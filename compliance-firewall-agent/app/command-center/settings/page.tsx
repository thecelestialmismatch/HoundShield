'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import {
  User,
  Mail,
  Shield,
  CreditCard,
  LogOut,
  Key,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

/* ── Types ── */
interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  plan: string;
  stripe_customer_id: string | null;
}

/* ── Section Card ── */
function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl animate-fade-in ${
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

/* ── Main Settings Page ── */
export default function SettingsPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // API Key
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Try to get profile from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const p: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: profileData?.full_name || user.user_metadata?.full_name || '',
        avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
        plan: profileData?.plan || 'free',
        stripe_customer_id: profileData?.stripe_customer_id || null,
      };

      setProfile(p);
      setFullName(p.full_name);

      // Generate a display-only API key (from user metadata or a hash)
      const existingKey = profileData?.api_key;
      setApiKey(existingKey || `kls_${user.id.replace(/-/g, '').slice(0, 24)}`);

      setLoading(false);
    }
    loadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save profile changes
  const handleSaveProfile = useCallback(async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const supabase = createClient();
      // Update Supabase auth metadata
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      // Update profiles table (if it exists)
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      setProfile((p) => (p ? { ...p, full_name: fullName } : null));
      setToast({ message: 'Profile updated successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [profile, fullName]);

  // Change password
  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      setToast({ message: 'Password must be at least 8 characters', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setToast({ message: 'Password changed successfully', type: 'success' });
    } catch {
      setToast({ message: 'Failed to change password', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [newPassword]);

  // Open Stripe billing portal
  const handleManageBilling = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setToast({ message: data.error || 'Billing portal unavailable', type: 'error' });
      }
    } catch {
      setToast({ message: 'Unable to open billing portal', type: 'error' });
    }
  }, []);

  // Copy API key
  const handleCopyKey = useCallback(() => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [apiKey]);

  // Sign out
  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  const planBadgeColors: Record<string, string> = {
    free: 'bg-slate-100 text-slate-500 border-slate-200',
    pro: 'bg-blue-50 text-blue-600 border-blue-200',
    enterprise: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    agency: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage your account, billing, and API access.</p>
      </div>

      {/* ── Profile Section ── */}
      <SectionCard title="Profile" description="Your personal information" icon={User}>
        <div className="space-y-4">
          {/* Avatar + Email (read-only) */}
          <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-emerald-500/20 border border-slate-200 flex items-center justify-center text-lg font-bold text-blue-600 uppercase">
              {profile?.full_name?.[0] || profile?.email?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${planBadgeColors[profile?.plan || 'free']}`}>
                  {profile?.plan || 'free'} plan
                </span>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving || fullName === profile?.full_name}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </SectionCard>

      {/* ── Security Section ── */}
      <SectionCard title="Security" description="Password and authentication" icon={Shield}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                className="w-full px-4 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-600 dark:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-300 hover:text-slate-600 dark:text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={saving || newPassword.length < 8}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            Change Password
          </button>
        </div>
      </SectionCard>

      {/* ── API Key Section ── */}
      <SectionCard title="API Key" description="Use this key to authenticate gateway requests" icon={Key}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-600 transition-all"
              title={showKey ? 'Hide key' : 'Reveal key'}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={handleCopyKey}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 dark:text-slate-400 hover:text-slate-600 transition-all"
              title="Copy key"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-700 dark:text-slate-300">
            Include this key in the <code className="text-slate-600 dark:text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">x-api-key</code> header of your gateway requests.
          </p>
        </div>
      </SectionCard>

      {/* ── Billing Section ── */}
      <SectionCard title="Billing" description="Subscription and payment management" icon={CreditCard}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-900 capitalize">{profile?.plan || 'Free'} Plan</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {profile?.plan === 'free'
                  ? '100 API scans/month — upgrade for more'
                  : 'Managed through Stripe'}
              </p>
            </div>
            {profile?.plan !== 'free' && profile?.stripe_customer_id ? (
              <button
                onClick={handleManageBilling}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 hover:text-slate-800 transition-all"
              >
                Manage Billing
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <a
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 text-slate-900 text-sm font-semibold hover:from-brand-500 hover:to-emerald-500 transition-all shadow-lg shadow-blue-200"
              >
                Upgrade
              </a>
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Sign Out ── */}
      <div className="pt-2 pb-8">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/10 text-red-400/70 text-sm font-medium hover:bg-red-500/5 hover:text-red-400 hover:border-red-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
