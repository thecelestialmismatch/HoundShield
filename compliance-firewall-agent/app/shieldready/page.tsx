"use client";

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import {
  ShieldCheck,
  ClipboardCheck,
  SearchX,
  FileBarChart,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

// ─── Animations ──────────────────────────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// ─── Placeholder Stats ───────────────────────────────────────────────────────

const STATS = [
  {
    label: 'Controls Assessed',
    value: 45,
    max: 110,
    icon: ClipboardCheck,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    glow: 'group-hover:shadow-[0_0_20px_rgba(96,165,250,0.2)]',
  },
  {
    label: 'Completion',
    value: 41,
    suffix: '%',
    icon: TrendingUp,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    glow: 'group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
  },
  {
    label: 'Controls Met',
    value: 22,
    max: 110,
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    glow: 'group-hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]',
  },
  {
    label: 'Open Gaps',
    value: 23,
    max: 110,
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    glow: 'group-hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Start Assessment',
    href: '/shieldready/assessment',
    icon: ClipboardCheck,
    description: 'Begin evaluating your NIST 800-171 controls',
    gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 glow-emerald',
  },
  {
    label: 'View Gaps',
    href: '/shieldready/gaps',
    icon: SearchX,
    description: 'Identify unmet controls and remediation steps',
    gradient: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 glow-amber',
  },
  {
    label: 'Generate Report',
    href: '/shieldready/reports',
    icon: FileBarChart,
    description: 'Export your SPRS score and assessment details',
    gradient: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 glow-blue',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function AnimatedCounter({ value, suffix = '', duration = 1.5 }: { value: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // use simple easeOutQuart
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{count}{suffix}</>;
}

export default function ShieldReadyDashboard() {
  const sprsScore = 45;
  const maxScore = 110;
  
  // Recharts data for a sleek gauge block
  const gaugeData = [
    { name: 'Score', value: sprsScore },
    { name: 'Remaining', value: maxScore - sprsScore },
  ];
  
  const COLORS = ['#34d399', '#ffffff05']; // emerald-400 and faint blank

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-md">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-white/60 font-medium">
          CMMC 2.0 / NIST SP 800-171 compliance at a glance
        </p>
      </motion.div>

      {/* SPRS Score Gauge */}
      <motion.div variants={itemVariants} className="glass-card-glow relative overflow-hidden bg-[#14141a]/60 p-8 pt-10 backdrop-blur-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)] group transition-all duration-500 hover:border-emerald-500/40">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px] transition-all duration-700 group-hover:bg-emerald-500/20" />
        
        <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-center">
          <div className="relative flex h-48 w-48 flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={gaugeData}
                   cx="50%"
                   cy="50%"
                   startAngle={210}
                   endAngle={-30}
                   innerRadius={70}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                   stroke="none"
                   cornerRadius={10}
                 >
                   {gaugeData.map((entry, index) => (
                     <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        style={index === 0 ? { filter: 'drop-shadow(0px 0px 8px rgba(52,211,153,0.6))' } : {}}
                     />
                   ))}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute flex flex-col items-center justify-center mt-2">
                 <span className="text-5xl font-bold tracking-tighter text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                   <AnimatedCounter value={sprsScore} />
                 </span>
                 <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80 mt-1">
                   Score
                 </p>
             </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-white">Assessment Progress</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-white/50">
              Your overall SPRS gap assessment is underway. Address Open Gaps to increase your score towards the maximum NIST SP 800-171 target of 110.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-white/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Range: -203 (worst) to +110 (perfect)
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, max, suffix, icon: Icon, color, bg, glow }, index) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className={`glass-card group relative p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1a1a23]/60 ${glow}`}
          >
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <span className="text-sm font-medium text-white/50">{label}</span>
                <p className="mt-1 text-3xl font-bold tracking-tight text-white drop-shadow-sm flex items-end gap-1">
                  <AnimatedCounter value={value} suffix={suffix} /> 
                  {max && <span className="text-lg text-white/30 font-medium pb-1">/{max}</span>}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="pt-2">
        <div className="mb-5 flex items-center gap-2">
           <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
           <div className="h-px w-12 bg-gradient-to-r from-emerald-500/50 to-transparent" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon, description, gradient }) => (
            <Link
              key={href}
              href={href}
              className={`glass-card group relative flex flex-col justify-between p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl ${gradient}`} />
              <div className="relative z-10">
                <Icon className="h-7 w-7 text-white/50 transition-colors duration-300 group-hover:text-white" />
                <h3 className="mt-4 text-base font-semibold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70">
                  {label}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/40 group-hover:text-white/60">
                  {description}
                </p>
              </div>
              <div className="relative z-10 mt-6 flex translate-x-[-10px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                 <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="glass-card p-8 group">
        <h2 className="text-lg font-semibold text-white mb-6">Recent Activity</h2>
        <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] py-12 text-center transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.02]">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/[0.02] to-transparent pointer-events-none rounded-xl" />
          <Clock className="h-10 w-10 text-emerald-500/30 mb-2 transition-transform duration-300 group-hover:scale-110" />
          <p className="mt-4 text-base font-medium text-white/70">Awaiting your first assessment</p>
          <p className="mt-2 text-sm text-white/40 max-w-sm">
            Activity events like uploading evidence, completing sections, and closing gaps will appear here in real-time.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
