"""
NexusSwift :: core.crypto
=========================

RSA-4096 / RSASSA-PSS non-repudiation engine.

This module answers exactly one question: *did the institution that owns this
BIC actually authorise these bytes, and have those bytes changed since?* It
does not do confidentiality — that is TLS's job on the wire — and it does not
do authorisation, which is the engine's job. Conflating those three is how
payment systems end up with a "signature" that proves nothing.

Why the specific primitives:

**RSA-4096, not 2048.** A cross-border settlement instruction has a legal
lifetime measured in decades: a disputed payment can be litigated years after
it settled, and the signature must still mean something then. NIST SP 800-57
rates 2048-bit RSA to roughly 2030; 4096-bit is the conservative choice when
the artefact must outlive the key. The cost is real — 4096-bit signing is
roughly 6–8x slower than 2048 — and it is the correct trade for a hub
signing thousands of messages a day, not millions.

**PSS, not PKCS#1 v1.5.** PKCS#1 v1.5 has no security proof, and its rigid
padding has produced a long line of signature-forgery bugs in implementations
that parse it leniently (Bleichenbacher's e=3 forgery being the famous one).
PSS is randomised and has a reduction to the RSA problem. Given a free choice
on a new system, there is no argument for v1.5.

**Salt length = digest length (32 bytes).** The library's ``MAX_LENGTH``
sentinel picks the largest salt the modulus allows, which for a 4096-bit key
is 446 bytes. That verifies fine here, but it is *not* what other stacks
default to: Java's ``SHA256withRSA/PSS`` and most HSMs default to a 32-byte
salt, and a verifier configured for 32 will reject a 446-byte-salted
signature. Interoperability with counterparty infrastructure is the entire
point of a messaging hub, so this module pins 32 explicitly on both sides.

**Signing covers raw bytes, never a re-serialised DOM.** See
``core.schemas`` — the payload is signed and stored verbatim.
"""

from __future__ import annotations

import asyncio
import base64
import binascii
import hashlib
from dataclasses import dataclass
from typing import Final, Mapping

from cryptography.exceptions import InvalidSignature, UnsupportedAlgorithm
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.asymmetric.rsa import (
    RSAPrivateKey,
    RSAPublicKey,
)

__all__ = [
    "CryptoError",
    "KeyGenerationError",
    "KeyImportError",
    "SignatureMalformedError",
    "SignatureVerificationError",
    "KeyPair",
    "SigningEngine",
    "KeyRegistry",
    "RSA_KEY_SIZE",
    "RSA_PUBLIC_EXPONENT",
    "PSS_SALT_LENGTH",
]

#: Modulus size in bits. See the module docstring for why 4096.
RSA_KEY_SIZE: Final[int] = 4096

#: 65537 (F4). The only public exponent that should ever be used: it is large
#: enough to defeat the small-exponent attacks that killed e=3, and its
#: two-bit Hamming weight keeps verification fast.
RSA_PUBLIC_EXPONENT: Final[int] = 65537

#: Fixed 32-byte salt, matching SHA-256's digest size. Pinned rather than
#: MAX_LENGTH for cross-stack interoperability — see the module docstring.
PSS_SALT_LENGTH: Final[int] = 32

_HASH = hashes.SHA256


class CryptoError(Exception):
    """Base class for every failure raised by this module."""


class KeyGenerationError(CryptoError):
    """Key material could not be generated."""


class KeyImportError(CryptoError):
    """PEM could not be parsed, or parsed into the wrong kind of key."""


class SignatureMalformedError(CryptoError):
    """The signature field was absent, not Base64, or the wrong length."""


class SignatureVerificationError(CryptoError):
    """The signature did not verify against the payload and public key."""


def _pss_padding() -> padding.PSS:
    return padding.PSS(mgf=padding.MGF1(_HASH()), salt_length=PSS_SALT_LENGTH)


def _as_bytes(payload: str | bytes) -> bytes:
    """Normalise to bytes with an explicit, non-negotiable encoding.

    ``str.encode()`` defaults to UTF-8 on every platform Python supports, but
    stating it here documents that the signature covers the UTF-8 octets. A
    counterparty that signs the same characters as UTF-16 produces a
    different signature over the "same" document, and the resulting dispute
    is unresolvable without knowing which octets were meant.
    """
    if isinstance(payload, bytes):
        return payload
    if isinstance(payload, str):
        return payload.encode("utf-8")
    raise TypeError(f"payload must be str or bytes, got {type(payload).__name__}")


@dataclass(frozen=True, slots=True)
class KeyPair:
    """An RSA-4096 key pair bound to a single institution's BIC."""

    bic: str
    private_key: RSAPrivateKey
    public_key: RSAPublicKey

    @property
    def key_size(self) -> int:
        return self.private_key.key_size

    def private_pem(self, password: bytes | None = None) -> str:
        """Serialise the private key to PEM (PKCS#8).

        When ``password`` is supplied the key is wrapped with the best
        available cipher the library offers. An unencrypted private key on
        disk is acceptable only for ephemeral test material; in production
        this key lives in an HSM or a KMS and never leaves it, and the
        ``password`` parameter exists so that the file-backed development
        path is at least not plaintext.
        """
        encryption: serialization.KeySerializationEncryption
        if password:
            encryption = serialization.BestAvailableEncryption(password)
        else:
            encryption = serialization.NoEncryption()
        return self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption,
        ).decode("ascii")

    def public_pem(self) -> str:
        """Serialise the public key to PEM (SubjectPublicKeyInfo)."""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode("ascii")

    @property
    def fingerprint(self) -> str:
        """SHA-256 over the DER SubjectPublicKeyInfo.

        Computed over DER, not PEM: PEM line-wrapping and trailing-newline
        conventions differ between OpenSSL versions, so a PEM-based
        fingerprint can change for byte-identical key material. DER is
        canonical.
        """
        der = self.public_key.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        return hashlib.sha256(der).hexdigest()

    @property
    def short_fingerprint(self) -> str:
        """First 16 hex chars, colon-grouped, for operator-facing logs."""
        fp = self.fingerprint
        return ":".join(fp[i : i + 4] for i in range(0, 16, 4))


class SigningEngine:
    """Stateless RSA-PSS signing and verification.

    Every method is a ``staticmethod`` because this engine holds no secrets
    and no configuration: keys are passed in explicitly at each call. That is
    deliberate. An engine that caches "the current key" acquires an ambient
    identity, and ambient identity in a multi-institution hub is how a
    message ends up signed by the wrong participant.
    """

    @staticmethod
    def generate_keypair(bic: str, *, key_size: int = RSA_KEY_SIZE) -> KeyPair:
        """Generate a fresh RSA key pair for ``bic``.

        ``key_size`` is parameterised solely so the test suite can use 2048
        where it exercises logic rather than cryptographic strength — 4096-bit
        generation costs seconds and would dominate a test run. Production
        callers must not pass it.
        """
        if key_size < 2048:
            raise KeyGenerationError(
                f"refusing to generate a {key_size}-bit RSA key; "
                f"2048 is the absolute floor and {RSA_KEY_SIZE} is the default"
            )
        try:
            private_key = rsa.generate_private_key(
                public_exponent=RSA_PUBLIC_EXPONENT, key_size=key_size
            )
        except (ValueError, UnsupportedAlgorithm) as exc:
            raise KeyGenerationError(f"RSA key generation failed: {exc}") from exc
        return KeyPair(bic=bic, private_key=private_key, public_key=private_key.public_key())

    @staticmethod
    async def generate_keypair_async(bic: str, *, key_size: int = RSA_KEY_SIZE) -> KeyPair:
        """:meth:`generate_keypair`, off the event loop.

        RSA-4096 generation is CPU-bound and takes seconds — it searches for
        two ~2048-bit probable primes, and the search time is variable
        because prime density is. Calling the synchronous version from a
        coroutine stalls *every* other task on that loop for the duration:
        in a clearing hub, that means settlement stops while an operator
        onboards a participant.

        Signing (~8 ms at 4096 bits) and verification (~0.3 ms) are short
        enough to run inline, and verification is the only one on the hot
        path. Generation is not, so it gets a thread.
        """
        return await asyncio.get_running_loop().run_in_executor(
            None, lambda: SigningEngine.generate_keypair(bic, key_size=key_size)
        )

    # -- import / export ---------------------------------------------------

    @staticmethod
    def load_private_key(pem: str | bytes, *, password: bytes | None = None) -> RSAPrivateKey:
        try:
            key = serialization.load_pem_private_key(_as_bytes(pem), password=password)
        except (ValueError, TypeError, UnsupportedAlgorithm) as exc:
            raise KeyImportError(f"could not load private key: {exc}") from exc
        if not isinstance(key, RSAPrivateKey):
            raise KeyImportError(
                f"expected an RSA private key, got {type(key).__name__}; "
                "this hub does not accept EC or Ed25519 signing keys"
            )
        return key

    @staticmethod
    def load_public_key(pem: str | bytes) -> RSAPublicKey:
        try:
            key = serialization.load_pem_public_key(_as_bytes(pem))
        except (ValueError, UnsupportedAlgorithm) as exc:
            raise KeyImportError(f"could not load public key: {exc}") from exc
        if not isinstance(key, RSAPublicKey):
            raise KeyImportError(
                f"expected an RSA public key, got {type(key).__name__}"
            )
        if key.key_size < 2048:
            # A registered 512-bit key is worse than no key: it makes the
            # verification step look like a control while being forgeable on
            # a laptop. Reject at registration time, not at verify time.
            raise KeyImportError(
                f"public key is only {key.key_size} bits; minimum accepted is 2048"
            )
        return key

    @staticmethod
    def keypair_from_pem(
        bic: str, private_pem: str | bytes, *, password: bytes | None = None
    ) -> KeyPair:
        private_key = SigningEngine.load_private_key(private_pem, password=password)
        return KeyPair(bic=bic, private_key=private_key, public_key=private_key.public_key())

    # -- digest ------------------------------------------------------------

    @staticmethod
    def digest(payload: str | bytes) -> str:
        """SHA-256 of the payload, hex. Stored alongside the record so a
        tampered ``raw_payload`` is detectable even without the public key."""
        return hashlib.sha256(_as_bytes(payload)).hexdigest()

    # -- sign --------------------------------------------------------------

    @staticmethod
    def sign(private_key: RSAPrivateKey, payload: str | bytes) -> str:
        """Sign ``payload`` with RSASSA-PSS(SHA-256, salt=32). Returns Base64.

        The signature is *randomised*: signing the same bytes twice yields
        two different, both-valid signatures. That is expected PSS behaviour
        and callers must never compare signatures for equality to detect
        replay — replay detection is the UETR uniqueness constraint's job.
        """
        data = _as_bytes(payload)
        if not data:
            raise CryptoError("refusing to sign an empty payload")
        signature = private_key.sign(data, _pss_padding(), _HASH())
        return base64.b64encode(signature).decode("ascii")

    # -- verify ------------------------------------------------------------

    @staticmethod
    def decode_signature(signature_b64: str) -> bytes:
        """Strictly decode the Base64 signature field.

        ``validate=True`` matters: without it, ``b64decode`` silently
        discards characters outside the Base64 alphabet, so a corrupted or
        deliberately padded signature decodes to *something* rather than
        failing. Silent repair of attacker-controlled input is never correct.
        """
        if not signature_b64 or not signature_b64.strip():
            raise SignatureMalformedError("signature is empty")
        try:
            raw = base64.b64decode(signature_b64.strip(), validate=True)
        except (binascii.Error, ValueError) as exc:
            raise SignatureMalformedError(f"signature is not valid Base64: {exc}") from exc
        if not raw:
            raise SignatureMalformedError("signature decoded to zero bytes")
        return raw

    @staticmethod
    def verify(
        public_key: RSAPublicKey,
        payload: str | bytes,
        signature_b64: str,
    ) -> bool:
        """Verify, returning ``True``/``False`` and never raising on a bad signature.

        Two failure modes are distinguished by the *caller-visible* contract:
        a malformed signature field raises :class:`SignatureMalformedError`
        (the message is structurally broken and cannot be adjudicated), while
        a well-formed signature that does not match returns ``False`` (the
        message is structurally fine and has been tampered with, or was
        signed by someone else). The engine records those as different
        rejection reasons, and an operator needs to tell them apart.
        """
        raw = SigningEngine.decode_signature(signature_b64)

        # PSS signatures are always exactly the modulus length. Checking here
        # turns a class of malformed input into a clean error instead of
        # relying on the backend's internal length handling.
        expected = (public_key.key_size + 7) // 8
        if len(raw) != expected:
            raise SignatureMalformedError(
                f"signature is {len(raw)} bytes; a {public_key.key_size}-bit "
                f"key produces exactly {expected}"
            )

        try:
            public_key.verify(raw, _as_bytes(payload), _pss_padding(), _HASH())
        except InvalidSignature:
            return False
        return True

    @staticmethod
    def verify_or_raise(
        public_key: RSAPublicKey, payload: str | bytes, signature_b64: str
    ) -> None:
        """:meth:`verify`, but raising :class:`SignatureVerificationError`."""
        if not SigningEngine.verify(public_key, payload, signature_b64):
            raise SignatureVerificationError(
                "RSA-PSS verification failed: payload does not match signature"
            )


class KeyRegistry:
    """In-memory BIC → public key cache, backed by the institutions table.

    Parsing a PEM is not free (roughly tens of microseconds, plus an ASN.1
    parse), and the clearing path verifies a signature for every single
    message. Caching the parsed key object removes that from the hot path.

    The cache is keyed by BIC *and* validated against the PEM it was built
    from, so rotating an institution's key in the database and forgetting to
    invalidate does not leave the hub verifying against a retired key —
    :meth:`resolve` re-parses whenever the stored PEM differs from the one
    the cached entry was derived from.
    """

    __slots__ = ("_by_bic", "_pem_by_bic")

    def __init__(self) -> None:
        self._by_bic: dict[str, RSAPublicKey] = {}
        self._pem_by_bic: dict[str, str] = {}

    def __len__(self) -> int:
        return len(self._by_bic)

    def __contains__(self, bic: object) -> bool:
        return bic in self._by_bic

    @property
    def registered_bics(self) -> tuple[str, ...]:
        return tuple(sorted(self._by_bic))

    def register(self, bic: str, public_key_pem: str) -> RSAPublicKey:
        """Parse and cache a public key. Raises :class:`KeyImportError`."""
        key = SigningEngine.load_public_key(public_key_pem)
        self._by_bic[bic] = key
        self._pem_by_bic[bic] = public_key_pem
        return key

    def resolve(self, bic: str, public_key_pem: str) -> RSAPublicKey:
        """Return the cached key, re-parsing if the stored PEM has changed."""
        cached_pem = self._pem_by_bic.get(bic)
        if cached_pem == public_key_pem:
            cached = self._by_bic.get(bic)
            if cached is not None:
                return cached
        return self.register(bic, public_key_pem)

    def get(self, bic: str) -> RSAPublicKey | None:
        return self._by_bic.get(bic)

    def revoke(self, bic: str) -> bool:
        """Drop a key from the cache. Returns whether anything was removed."""
        self._pem_by_bic.pop(bic, None)
        return self._by_bic.pop(bic, None) is not None

    def clear(self) -> None:
        self._by_bic.clear()
        self._pem_by_bic.clear()

    def snapshot(self) -> Mapping[str, str]:
        """Fingerprints of every cached key, for a health endpoint."""
        return {
            bic: hashlib.sha256(
                key.public_bytes(
                    encoding=serialization.Encoding.DER,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo,
                )
            ).hexdigest()
            for bic, key in sorted(self._by_bic.items())
        }
