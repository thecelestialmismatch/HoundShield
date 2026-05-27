"use client";

import { useState } from "react";
import { PublicShell } from "@/components/layout/PublicShell";
import { SectionEyebrow } from "@/components/marketing/SectionEyebrow";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <PublicShell>
      <section
        className="spotlight"
        style={{ position: "relative", padding: "128px 24px 96px", overflow: "hidden" }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <SectionEyebrow>Contact</SectionEyebrow>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(36px,5vw,56px)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--hs-ink)",
              margin: "16px 0 24px",
            }}
          >
            Talk to a human.
          </h1>
          <p style={{ fontSize: 18, color: "var(--hs-ink-secondary)", marginBottom: 40 }}>
            Best for security teams evaluating CMMC, HIPAA, or SOC 2 deployment timelines. We reply within one business day.
          </p>
          {submitted ? (
            <div
              className="glass-card"
              style={{ padding: 32, textAlign: "center" }}
            >
              <div
                className="font-display"
                style={{ fontSize: 28, fontWeight: 600, color: "var(--hs-ink)", marginBottom: 10 }}
              >
                Thanks — message received.
              </div>
              <p style={{ color: "var(--hs-ink-secondary)" }}>
                A HoundShield engineer will reach out to <strong>{email}</strong> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="glass-card" style={{ padding: 32, display: "grid", gap: 18 }}>
              <Field label="Name" value={name} onChange={setName} placeholder="Jordan Maddox" required />
              <Field label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" required />
              <Field label="Company" value={company} onChange={setCompany} placeholder="Acme Defense Systems" required />
              <div>
                <label
                  className="font-mono uppercase"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    color: "var(--hs-ink-tertiary)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="What does compliance look like for your org today?"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--hs-border-subtle)",
                    background: "#fff",
                    color: "var(--hs-ink)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>
              <button
                type="submit"
                className="text-white"
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, var(--hs-steel-dark), var(--hs-steel))",
                  boxShadow: "0 4px 12px rgba(90,134,168,0.25)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Send message →
              </button>
              <p style={{ fontSize: 12.5, color: "var(--hs-ink-tertiary)" }}>
                Or email{" "}
                <a href="mailto:hello@houndshield.com" style={{ color: "var(--hs-steel-dark)", fontWeight: 500 }}>
                  hello@houndshield.com
                </a>{" "}
                directly.
              </p>
            </form>
          )}
        </div>
      </section>
    </PublicShell>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, value, onChange, type = "text", placeholder, required }: FieldProps) {
  return (
    <div>
      <label
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          color: "var(--hs-ink-tertiary)",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          border: "1px solid var(--hs-border-subtle)",
          background: "#fff",
          color: "var(--hs-ink)",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
