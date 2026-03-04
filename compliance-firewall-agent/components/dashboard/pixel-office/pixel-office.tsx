"use client";

// ============================================================================
// Pixel Office — Dashboard tab showing animated pixel-art agents
// ============================================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { PixelOfficeEngine, type AgentInfo } from "./pixel-engine";
import {
    Gamepad2,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Volume2,
    VolumeX,
    Users,
    Activity,
} from "lucide-react";

// Demo agents that populate the pixel office
const DEMO_AGENTS: AgentInfo[] = [
    { id: "scout-1", name: "Scout", status: "typing", role: "Reconnaissance" },
    { id: "sentinel-2", name: "Sentinel", status: "running", role: "Monitor" },
    { id: "analyst-3", name: "Analyst", status: "reading", role: "Compliance" },
    { id: "diplomat-4", name: "Diplomat", status: "idle", role: "Outreach" },
    { id: "guardian-5", name: "Guardian", status: "waiting", role: "Security" },
    { id: "archivist-6", name: "Archivist", status: "typing", role: "Knowledge" },
];

const STATUS_LABELS: Record<string, { label: string; color: string; dot: string }> = {
    typing: { label: "Writing Code", color: "text-green-400", dot: "bg-green-400" },
    running: { label: "Executing", color: "text-blue-400", dot: "bg-blue-400" },
    reading: { label: "Analyzing", color: "text-purple-400", dot: "bg-purple-400" },
    waiting: { label: "Awaiting Input", color: "text-yellow-400", dot: "bg-yellow-400" },
    idle: { label: "Idle", color: "text-slate-400", dot: "bg-slate-400" },
};

export function PixelOffice() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<PixelOfficeEngine | null>(null);
    const [zoom, setZoom] = useState(3);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [agents, setAgents] = useState<AgentInfo[]>(DEMO_AGENTS);

    // Initialize engine
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const engine = new PixelOfficeEngine(canvas, zoom);
        engine.setAgents(agents);
        engine.start();
        engineRef.current = engine;

        return () => {
            engine.stop();
            engineRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Simulate agent status changes
    useEffect(() => {
        const statuses: AgentInfo["status"][] = [
            "typing",
            "running",
            "reading",
            "waiting",
            "idle",
        ];

        const interval = setInterval(() => {
            setAgents((prev) =>
                prev.map((agent) => {
                    // 30% chance to change status each tick
                    if (Math.random() < 0.3) {
                        return {
                            ...agent,
                            status: statuses[Math.floor(Math.random() * statuses.length)],
                        };
                    }
                    return agent;
                })
            );
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    // Sync agents to engine
    useEffect(() => {
        if (engineRef.current) {
            engineRef.current.setAgents(agents);
        }
    }, [agents]);

    // Zoom
    const handleZoomIn = useCallback(() => {
        const newZoom = Math.min(6, zoom + 1);
        setZoom(newZoom);
        engineRef.current?.setZoom(newZoom);
    }, [zoom]);

    const handleZoomOut = useCallback(() => {
        const newZoom = Math.max(1, zoom - 1);
        setZoom(newZoom);
        engineRef.current?.setZoom(newZoom);
    }, [zoom]);

    const handleReset = useCallback(() => {
        setZoom(3);
        engineRef.current?.setZoom(3);
    }, []);

    const activeCount = agents.filter(
        (a) => a.status === "typing" || a.status === "running"
    ).length;

    return (
        <div className="h-full flex flex-col bg-[#0a0a14] rounded-xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
                        <Gamepad2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">Pixel Office</h2>
                        <p className="text-[10px] text-slate-500">
                            Live agent visualization • Inspired by{" "}
                            <a
                                href="https://github.com/pablodelucca/pixel-agents"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                pixel-agents
                            </a>
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono w-6 text-center">
                        {zoom}x
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button
                        onClick={handleReset}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Reset View"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title={soundEnabled ? "Mute" : "Unmute"}
                    >
                        {soundEnabled ? (
                            <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                            <VolumeX className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-[#0a0a12]">
                <div className="rounded-lg overflow-hidden border border-white/5 shadow-2xl shadow-purple-500/5">
                    <canvas
                        ref={canvasRef}
                        className="block"
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>
            </div>

            {/* Agent Status Bar */}
            <div className="border-t border-white/5 bg-[#0f0f1a]/80 backdrop-blur-sm px-5 py-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400">
                            {agents.length} agents
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-[11px] text-green-400">
                            {activeCount} active
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {agents.map((agent) => {
                        const status = STATUS_LABELS[agent.status] || STATUS_LABELS.idle;
                        return (
                            <div
                                key={agent.id}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                            >
                                <div
                                    className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-medium text-white truncate">
                                        {agent.name}
                                    </div>
                                    <div className={`text-[9px] ${status.color} truncate`}>
                                        {status.label} • {agent.role}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default PixelOffice;
