import { HoundShieldLogo } from "@/components/brand/HoundShieldLogo";

export default function Loading() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        background: "var(--hs-surface-0)",
      }}
    >
      <HoundShieldLogo size={48} asLink={false} />
      <div
        aria-label="Loading"
        role="status"
        style={{
          width: 140,
          height: 3,
          borderRadius: 2,
          background: "var(--hs-border-subtle)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "30%",
            height: "100%",
            background: "linear-gradient(90deg, var(--hs-steel-dark), var(--hs-steel))",
            borderRadius: 2,
            animation: "hs-loading 1.2s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes hs-loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
