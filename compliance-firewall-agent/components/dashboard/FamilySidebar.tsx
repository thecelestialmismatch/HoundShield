"use client";

import { motion } from "framer-motion";
import type { ControlFamilyMeta, AssessmentResponse } from "@/lib/shieldready/types";

interface FamilySidebarProps {
  families: ControlFamilyMeta[];
  responses: AssessmentResponse[];
  activeFamily: string | null;
  onFamilyClick: (familyCode: string) => void;
}

export default function FamilySidebar({
  families,
  responses,
  activeFamily,
  onFamilyClick,
}: FamilySidebarProps) {
  const getStats = (familyCode: string) => {
    const familyResponses = responses.filter((r) => r.controlId.startsWith(familyCode + "."));
    let met = 0, partial = 0, unmet = 0;
    for (const r of familyResponses) {
      if (r.status === "MET") met++;
      else if (r.status === "PARTIAL") partial++;
      else if (r.status === "UNMET") unmet++;
    }
    return { met, partial, unmet, answered: met + partial + unmet };
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
        Control Families
      </h3>
      {families.map((family) => {
        const stats = getStats(family.code);
        const isActive = activeFamily === family.code;
        const progress = family.controlCount > 0 ? stats.answered / family.controlCount : 0;

        return (
          <button
            key={family.code}
            onClick={() => onFamilyClick(family.code)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
              isActive
                ? "bg-blue-500/10 border border-blue-500/30"
                : "hover:bg-slate-100 border border-transparent"
            }`}
          >
            {/* Progress ring */}
            <div className="relative shrink-0" style={{ width: 32, height: 32 }}>
              <svg width={32} height={32} className="-rotate-90">
                <circle cx={16} cy={16} r={13} fill="none" stroke="rgba(100,116,139,0.2)" strokeWidth={3} />
                <motion.circle
                  cx={16}
                  cy={16}
                  r={13}
                  fill="none"
                  stroke={
                    progress >= 1 ? "#10b981" :
                    progress > 0 ? "#3b82f6" : "rgba(100,116,139,0.2)"
                  }
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 13}
                  animate={{ strokeDashoffset: 2 * Math.PI * 13 * (1 - progress) }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${
                isActive ? "text-blue-400" : "text-slate-600 dark:text-slate-400"
              }`}>
                {stats.answered}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold truncate ${
                isActive ? "text-blue-400" : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900"
              }`}>
                {family.code}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{family.name}</div>
            </div>

            {/* Status dots */}
            <div className="flex gap-0.5 shrink-0">
              {stats.met > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${stats.met} met`} />}
              {stats.partial > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title={`${stats.partial} partial`} />}
              {stats.unmet > 0 && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title={`${stats.unmet} unmet`} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
