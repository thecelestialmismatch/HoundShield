"""
Kaelus.Online — Compliance Brain GPT
A tiny, dependency-free GPT trained on NIST SP 800-171 Rev 2 and CMMC domain knowledge.

Adapted from Andrej Karpathy's microGPT (@karpathy):
  github.com/karpathy/makemore
  "The most atomic way to train and run inference for a GPT in pure Python."

Purpose:
  - Zero-cost local inference for compliance recommendations
  - Control description completion
  - CUI pattern suggestions
  - Assessment question generation
  - Runs entirely on your machine, no API calls

Training data: brain/input.txt (NIST controls + CMMC knowledge)
Run: python brain/gpt.py
"""

import os
import math
import random
import json

random.seed(42)

# ─── Config ────────────────────────────────────────────────────────────────────
TRAINING_FILE = os.path.join(os.path.dirname(__file__), 'input.txt')
CHECKPOINT_FILE = os.path.join(os.path.dirname(__file__), 'checkpoint.json')

# Model hyperparameters — tuned for compliance text (longer sequences than names)
n_layer = 4       # depth of transformer
n_embd = 64       # embedding dimension
block_size = 128  # context window (enough for a NIST control + description)
n_head = 4        # attention heads
head_dim = n_embd // n_head

# Training
num_steps = 5000
learning_rate = 0.005
beta1, beta2, eps_adam = 0.9, 0.99, 1e-8

# ─── Dataset ──────────────────────────────────────────────────────────────────
if not os.path.exists(TRAINING_FILE):
    print(f"[brain] No training data at {TRAINING_FILE}. Run: python brain/prepare.py")
    exit(1)

with open(TRAINING_FILE, 'r', encoding='utf-8') as f:
    text = f.read()

# Character-level tokenizer (works well for compliance text with special chars: 3.1.1, FOUO, etc.)
uchars = sorted(set(text))
BOS = len(uchars)           # Beginning-of-sequence token
vocab_size = len(uchars) + 1
char_to_id = {c: i for i, c in enumerate(uchars)}
id_to_char = {i: c for i, c in enumerate(uchars)}

# Split text into documents at newline-separated sections
docs = [d.strip() for d in text.split('\n\n') if d.strip()]
random.shuffle(docs)
print(f"[brain] vocab={vocab_size} | docs={len(docs)} | context={block_size}")

# ─── Autograd ─────────────────────────────────────────────────────────────────
class Value:
    """Scalar value with autograd — Karpathy's micrograd engine."""
    __slots__ = ('data', 'grad', '_children', '_local_grads')

    def __init__(self, data, children=(), local_grads=()):
        self.data = data
        self.grad = 0
        self._children = children
        self._local_grads = local_grads

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data + other.data, (self, other), (1, 1))

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        return Value(self.data * other.data, (self, other), (other.data, self.data))

    def __pow__(self, other): return Value(self.data**other, (self,), (other * self.data**(other-1),))
    def log(self): return Value(math.log(max(self.data, 1e-10)), (self,), (1/max(self.data, 1e-10),))
    def exp(self): e = math.exp(min(self.data, 20)); return Value(e, (self,), (e,))
    def relu(self): return Value(max(0, self.data), (self,), (float(self.data > 0),))
    def __neg__(self): return self * -1
    def __radd__(self, other): return self + other
    def __sub__(self, other): return self + (-other)
    def __rsub__(self, other): return other + (-self)
    def __rmul__(self, other): return self * other
    def __truediv__(self, other): return self * other**-1
    def __rtruediv__(self, other): return other * self**-1

    def backward(self):
        topo, visited = [], set()
        def build(v):
            if v not in visited:
                visited.add(v)
                for c in v._children: build(c)
                topo.append(v)
        build(self)
        self.grad = 1
        for v in reversed(topo):
            for child, lg in zip(v._children, v._local_grads):
                child.grad += lg * v.grad

# ─── Model Parameters ─────────────────────────────────────────────────────────
def mat(nout, nin, std=0.05):
    return [[Value(random.gauss(0, std)) for _ in range(nin)] for _ in range(nout)]

state_dict = {
    'wte': mat(vocab_size, n_embd),   # token embeddings
    'wpe': mat(block_size, n_embd),   # position embeddings
    'lm_head': mat(vocab_size, n_embd),
}
for i in range(n_layer):
    state_dict[f'l{i}.wq'] = mat(n_embd, n_embd)
    state_dict[f'l{i}.wk'] = mat(n_embd, n_embd)
    state_dict[f'l{i}.wv'] = mat(n_embd, n_embd)
    state_dict[f'l{i}.wo'] = mat(n_embd, n_embd)
    state_dict[f'l{i}.fc1'] = mat(4 * n_embd, n_embd)
    state_dict[f'l{i}.fc2'] = mat(n_embd, 4 * n_embd)

params = [p for mat_vals in state_dict.values() for row in mat_vals for p in row]
print(f"[brain] parameters={len(params):,}")

# ─── Model Forward Pass ────────────────────────────────────────────────────────
def linear(x, w): return [sum(wi * xi for wi, xi in zip(wo, x)) for wo in w]
def softmax(logits):
    mx = max(v.data for v in logits)
    exps = [(v - mx).exp() for v in logits]
    total = sum(exps)
    return [e / total for e in exps]
def rmsnorm(x):
    ms = sum(xi * xi for xi in x) / len(x)
    scale = (ms + 1e-5) ** -0.5
    return [xi * scale for xi in x]

def gpt_forward(token_id, pos_id, keys, values):
    x = [t + p for t, p in zip(state_dict['wte'][token_id], state_dict['wpe'][pos_id])]
    x = rmsnorm(x)
    for li in range(n_layer):
        xr = x
        x = rmsnorm(x)
        q = linear(x, state_dict[f'l{li}.wq'])
        k = linear(x, state_dict[f'l{li}.wk'])
        v = linear(x, state_dict[f'l{li}.wv'])
        keys[li].append(k); values[li].append(v)
        x_attn = []
        for h in range(n_head):
            hs = h * head_dim
            qh, kh, vh = q[hs:hs+head_dim], [ki[hs:hs+head_dim] for ki in keys[li]], [vi[hs:hs+head_dim] for vi in values[li]]
            attn_w = softmax([sum(qh[j]*kh[t][j] for j in range(head_dim))/head_dim**0.5 for t in range(len(kh))])
            x_attn.extend([sum(attn_w[t]*vh[t][j] for t in range(len(vh))) for j in range(head_dim)])
        x = linear(x_attn, state_dict[f'l{li}.wo'])
        x = [a + b for a, b in zip(x, xr)]
        xr = x
        x = rmsnorm(x)
        x = [xi.relu() for xi in linear(x, state_dict[f'l{li}.fc1'])]
        x = [a + b for a, b in zip(linear(x, state_dict[f'l{li}.fc2']), xr)]
    return linear(x, state_dict['lm_head'])

# ─── Training ─────────────────────────────────────────────────────────────────
m_buf = [0.0] * len(params)
v_buf = [0.0] * len(params)

print(f"[brain] Training for {num_steps} steps...")
best_loss = float('inf')

for step in range(num_steps):
    doc = docs[step % len(docs)]
    tokens = [BOS] + [char_to_id.get(ch, BOS) for ch in doc[:block_size]] + [BOS]
    n = min(block_size, len(tokens) - 1)

    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]
    losses = []

    for pos_id in range(n):
        token_id = tokens[pos_id]
        target_id = tokens[pos_id + 1]
        logits = gpt_forward(token_id, pos_id, keys, values)
        probs = softmax(logits)
        losses.append(-probs[target_id].log())

    loss = (1 / n) * sum(losses)
    loss.backward()

    lr_t = learning_rate * (1 - step / num_steps)
    for i, p in enumerate(params):
        m_buf[i] = beta1 * m_buf[i] + (1 - beta1) * p.grad
        v_buf[i] = beta2 * v_buf[i] + (1 - beta2) * p.grad ** 2
        mh = m_buf[i] / (1 - beta1 ** (step + 1))
        vh = v_buf[i] / (1 - beta2 ** (step + 1))
        p.data -= lr_t * mh / (vh ** 0.5 + eps_adam)
        p.grad = 0

    if loss.data < best_loss:
        best_loss = loss.data

    if (step + 1) % 100 == 0:
        print(f"  step {step+1:5d}/{num_steps} | loss {loss.data:.4f} | best {best_loss:.4f}")

print(f"\n[brain] Training complete. Best loss: {best_loss:.4f}")

# ─── Inference ────────────────────────────────────────────────────────────────
def generate(prompt: str = "", temperature: float = 0.7, max_tokens: int = 200) -> str:
    """Generate compliance text from an optional prompt."""
    keys = [[] for _ in range(n_layer)]
    values = [[] for _ in range(n_layer)]

    # Encode prompt
    token_ids = [BOS] + [char_to_id.get(ch, BOS) for ch in prompt]
    output = list(prompt)

    # Prime the model with prompt tokens
    for pos_id, token_id in enumerate(token_ids[:-1]):
        gpt_forward(token_id, pos_id, keys, values)

    token_id = token_ids[-1]
    for pos_id in range(len(token_ids) - 1, len(token_ids) - 1 + max_tokens):
        if pos_id >= block_size:
            break
        logits = gpt_forward(token_id, pos_id, keys, values)
        probs = softmax([l / temperature for l in logits])
        token_id = random.choices(range(vocab_size), weights=[p.data for p in probs])[0]
        if token_id == BOS:
            break
        if token_id < len(id_to_char):
            output.append(id_to_char[token_id])

    return ''.join(output)

print("\n[brain] ─── Compliance Brain Inference ───")
print("Generating sample compliance text...\n")

samples = [
    ("3.1.1 ", "Access control policy:"),
    ("CUI must be ", "CUI handling rule:"),
    ("SPRS score of ", "SPRS score context:"),
]

for prompt, label in samples:
    print(f"{label}")
    result = generate(prompt=prompt, temperature=0.7, max_tokens=150)
    print(f"  {result}\n")

print("[brain] Done. Use generate() in your code for zero-cost compliance inference.")
