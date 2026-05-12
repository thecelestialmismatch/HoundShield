"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, Copy, Check, Terminal, ChevronDown } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

interface ClientOption {
  client_org_id: string;
  client_name: string;
  docker_api_key: string;
}

export default function DeployPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selected, setSelected] = useState<ClientOption | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("partner_organizations")
        .select("client_org_id, client_name, docker_api_key")
        .eq("partner_user_id", user.id)
        .eq("status", "active");

      if (data?.length) {
        setClients(data as ClientOption[]);
        setSelected(data[0] as ClientOption);
      }
    }

    void load();
  }, []);

  function copy(text: string, key: string) {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const apiKey = selected?.docker_api_key ?? "<your-docker-api-key>";
  const clientName = selected?.client_name ?? "Client";

  const curlInstall = `curl -sSL https://houndshield.com/install | bash`;

  const dockerRun = `docker run -d \\
  --name houndshield-proxy \\
  --restart unless-stopped \\
  -p 8080:8080 \\
  -e HOUNDSHIELD_LICENSE_KEY="${apiKey}" \\
  -e UPSTREAM_API_KEY="<their-ai-provider-key>" \\
  -v houndshield-data:/data \\
  houndshield/proxy:latest`;

  const sdkExample = `// Change ONE line in the AI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://localhost:8080/v1", // ← only change needed
});`;

  const blocks: { label: string; code: string; key: string; desc: string }[] = [
    {
      label: "One-Command Install",
      code: curlInstall,
      key: "curl",
      desc: "Runs setup wizard, pulls Docker image, prompts for keys",
    },
    {
      label: "Docker Run (manual)",
      code: dockerRun,
      key: "docker",
      desc: "For clients who prefer explicit Docker commands",
    },
    {
      label: "AI SDK Redirect",
      code: sdkExample,
      key: "sdk",
      desc: "Only change needed in customer code — takes 60 seconds",
    },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Docker Deploy Keys</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate deployment instructions pre-filled with each client&apos;s key. Share with their IT team.
        </p>
      </div>

      {/* Client selector */}
      {clients.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
          <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">
            Select Client
          </label>
          <div className="relative">
            <select
              value={selected?.client_org_id ?? ""}
              onChange={(e) => {
                const found = clients.find((c) => c.client_org_id === e.target.value);
                if (found) setSelected(found);
              }}
              className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500/50 pr-10"
            >
              {clients.map((c) => (
                <option key={c.client_org_id} value={c.client_org_id}>
                  {c.client_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          {selected && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>Deploy key:</span>
              <code className="font-mono text-brand-400 truncate max-w-[280px]">
                {selected.docker_api_key}
              </code>
              <button
                onClick={() => copy(selected.docker_api_key, "key")}
                className="ml-auto text-slate-400 hover:text-white transition-colors"
              >
                {copied === "key" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          Deploy Instructions for {clientName}
        </h2>

        {blocks.map(({ label, code, key, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl bg-white/[0.03] border border-white/[0.08] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => copy(code, key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:border-white/20 transition-colors"
              >
                {copied === key ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-5 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {code}
            </pre>
          </motion.div>
        ))}
      </div>

      {/* Instructions footer */}
      <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
        <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2 mb-2">
          <Box className="w-4 h-4" />
          What to tell the client&apos;s IT team (2-minute onboarding)
        </h3>
        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
          <li>Run the one-command install on any machine that has Docker and internet access</li>
          <li>Enter the license key and their AI provider API key when prompted</li>
          <li>
            In their IDE/ChatGPT/API config, change{" "}
            <code className="text-brand-400 font-mono">baseURL</code> to{" "}
            <code className="text-brand-400 font-mono">http://localhost:8080/v1</code>
          </li>
          <li>Test: send &quot;CAGE 1ABC2 project update&quot; — should get a 403 block response</li>
          <li>Login to houndshield.com/command-center — block event should appear within seconds</li>
        </ol>
      </div>
    </div>
  );
}
