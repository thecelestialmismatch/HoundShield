'use client';

import { useState } from 'react';
import { Check, Copy, Lock } from 'lucide-react';
import {
  ENDPOINTS,
  LANG_LABEL,
  type Endpoint,
  type Lang,
  type ApiField,
} from './api-data';

/* Method badge colour by verb. */
const METHOD_STYLE: Record<Endpoint['method'], string> = {
  GET: 'background:#1E3A2E;color:#7CE0A3;',
  POST: 'background:#1E2E44;color:#8FC4EE;',
  PUT: 'background:#3A2E14;color:#E6B876;',
};

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="code">
      <div className="code-top">
        <span>{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.35rem',
            background: 'none',
            border: 'none',
            color: copied ? '#7CE0A3' : '#7B93A8',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
}

function FieldTable({ title, fields }: { title: string; fields: ApiField[] }) {
  return (
    <div style={{ margin: '14px 0' }}>
      <div className="mono" style={{ fontSize: '.7rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '.5rem' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
        {fields.map((f) => (
          <div key={f.name} style={{ display: 'flex', gap: '.6rem', alignItems: 'baseline', flexWrap: 'wrap', fontSize: '.86rem' }}>
            <code style={{ fontFamily: 'var(--f-mono)', color: 'var(--brand)', fontWeight: 700 }}>{f.name}</code>
            <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.72rem', color: 'var(--text-3)' }}>{f.type}</span>
            {f.required && (
              <span style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.05em', color: '#E5484D', textTransform: 'uppercase' }}>required</span>
            )}
            <span style={{ color: 'var(--text-2)', flex: 1, minWidth: 180 }}>{f.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EndpointSection({ endpoint, lang }: { endpoint: Endpoint; lang: Lang }) {
  return (
    <section id={endpoint.id} style={{ scrollMarginTop: 90, padding: '28px 0', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
        <span
          className="mono"
          style={{
            fontSize: '.68rem',
            fontWeight: 700,
            letterSpacing: '.06em',
            padding: '.2rem .5rem',
            borderRadius: 6,
            ...styleFromCss(METHOD_STYLE[endpoint.method]),
          }}
        >
          {endpoint.method}
        </span>
        <code style={{ fontFamily: 'var(--f-mono)', fontSize: '.92rem', color: 'var(--text)' }}>{endpoint.path}</code>
        {endpoint.admin && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.68rem', color: 'var(--text-3)' }}>
            <Lock size={11} /> admin token
          </span>
        )}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '.8rem 0 .4rem' }}>{endpoint.title}</h3>
      <p className="muted" style={{ maxWidth: 680, lineHeight: 1.65 }}>{endpoint.summary}</p>

      <div style={{ margin: '.7rem 0', fontSize: '.84rem', color: 'var(--text-2)' }}>
        <b style={{ color: 'var(--text)' }}>Auth&nbsp;·&nbsp;</b>{endpoint.auth}
      </div>

      {endpoint.headers && <FieldTable title="Headers" fields={endpoint.headers} />}
      {endpoint.params && <FieldTable title="Parameters" fields={endpoint.params} />}

      <CodeBlock label={`Request · ${LANG_LABEL[lang]}`} code={endpoint.request[lang]} />
      <CodeBlock label="Response" code={endpoint.response} />
    </section>
  );
}

/** Parse the tiny "prop:val;prop:val;" strings in METHOD_STYLE into a style object. */
function styleFromCss(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const [k, v] = decl.split(':');
    if (!k || !v) continue;
    const camel = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v.trim();
  }
  return out as React.CSSProperties;
}

export function ApiReference() {
  const [lang, setLang] = useState<Lang>('curl');
  const langs: Lang[] = ['curl', 'js', 'python'];

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 72,
          zIndex: 5,
          display: 'inline-flex',
          gap: '.25rem',
          padding: '.3rem',
          borderRadius: 12,
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          marginBottom: '.5rem',
        }}
      >
        {langs.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            style={{
              padding: '.4rem .9rem',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontSize: '.82rem',
              fontWeight: 700,
              background: lang === l ? 'var(--brand)' : 'transparent',
              color: lang === l ? '#fff' : 'var(--text-2)',
            }}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      {ENDPOINTS.map((e) => (
        <EndpointSection key={e.id} endpoint={e} lang={lang} />
      ))}
    </div>
  );
}
