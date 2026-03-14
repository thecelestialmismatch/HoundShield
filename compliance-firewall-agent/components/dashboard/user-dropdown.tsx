import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, Settings, UserCircle, Star, Trophy, Sparkles } from "lucide-react";

interface User {
    name: string;
    email: string;
    avatar: string;
    provider: string;
}

export function UserDropdown({ user, onLogout }: { user: User; onLogout: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all ${isOpen
                        ? "bg-slate-100 border-white/[0.12]"
                        : "bg-transparent border-transparent hover:bg-slate-100"
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 border border-indigo-500/20">
                        {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0 text-left overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate leading-tight">
                            {user.name}
                        </p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate leading-tight">
                            {user.email}
                        </p>
                    </div>
                </div>
                <div className={`text-slate-600 dark:text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 15l-6-6-6 6" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-[calc(100%+8px)] left-0 w-[260px] bg-[#111116] border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">

                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    {/* Stats Section */}
                    <div className="px-4 py-3 border-b border-slate-200 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Plan</span>
                            <span className="text-slate-900 font-medium">Free</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Reports</span>
                            <span className="text-indigo-400 font-medium flex items-center gap-1.5 border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 rounded-md text-xs">
                                <Sparkles className="w-3 h-3" />
                                0
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Stars</span>
                            <span className="text-amber-400 font-medium flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-amber-400" /> 50</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Trophies</span>
                            <span className="text-indigo-300 font-medium flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5" /> 0/17</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                        {/* Theme Toggle (Exact Request Match) */}
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors border group ${theme === 'light'
                                        ? 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10'
                                        : 'border-transparent text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
                                <span className="font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
                            </button>
                        )}

                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Account
                        </button>

                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <Sparkles className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Get more reports
                        </button>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            Sign out
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
