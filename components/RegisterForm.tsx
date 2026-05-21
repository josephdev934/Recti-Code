'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Secret verification tokens do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Administrative workspace creation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-[#080b11]">
      
      {/* Brand logo header */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-7 h-7 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-white font-sans">Recti Code</span>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[420px] bg-[#0d121f] border border-[#1e293b]/70 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Top Header Panel (no dots in Image 3, but let's make it styled cleanly) */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-white text-center">
            Create your workspace
          </h2>
          <p className="text-xs text-[#64748b] text-center mt-2">
            Get started with your free-tier professional account.
          </p>
        </div>

        {/* Body Content */}
        <div className="px-8 pb-8">
          
          {error && (
            <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] text-xs font-mono rounded-lg">
              [SYSTEM ERROR]: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Linus Torvalds"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="linus@kernel.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                Confirm
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002 2m0 0V9a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2zM9 11a4 4 0 100-8 4 4 0 000 8zm0 0v12m0 0l-3-3m3 3l3-3" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#a5b4fc] hover:bg-[#818cf8] active:bg-[#6366f1] text-[#0f172a] font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none group"
            >
              <span className="text-sm font-sans font-bold tracking-wide">
                {isLoading ? 'Creating...' : 'Create Account'}
              </span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e293b]/50"></div>
            </div>
            <span className="relative px-3 bg-[#0d121f] text-[9px] font-mono font-bold tracking-widest text-[#475569]">
              OR CONTINUE WITH
            </span>
          </div>

          {/* Social Sign-In buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => alert("GitHub Integration is a Premium PRO capability.")}
              className="py-2.5 px-4 bg-[#111827]/40 hover:bg-[#111827]/80 text-[#94a3b8] hover:text-white font-mono text-xs font-bold rounded-lg border border-[#1e293b]/50 flex items-center justify-center cursor-pointer transition-all"
            >
              <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
            <button
              type="button"
              onClick={() => alert("Google Integration is a Premium PRO capability.")}
              className="py-2.5 px-4 bg-[#111827]/40 hover:bg-[#111827]/80 text-[#94a3b8] hover:text-white font-mono text-xs font-bold rounded-lg border border-[#1e293b]/50 flex items-center justify-center cursor-pointer transition-all"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-6.887 4.113-4.716 0-8.58-3.77-8.58-8.58 0-4.81 3.864-8.58 8.58-8.58 2.33 0 4.26.85 5.74 2.23l3.29-3.29C17.43 1.4 15.02 0 12.24 0 5.58 0 0 5.58 0 12.24s5.58 12.24 12.24 12.24c6.96 0 11.57-4.89 11.57-11.79 0-.78-.07-1.54-.2-2.28H12.24z" />
              </svg>
              Google
            </button>
          </div>

          {/* Already have an account? */}
          <div className="mt-6 pt-4 border-t border-[#1e293b]/50 text-center">
            <span className="text-xs font-mono text-[#475569]">Already have an account? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-xs font-mono text-[#818cf8] hover:underline font-bold"
            >
              Log in
            </button>
          </div>

        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex items-center gap-4 text-[10px] font-mono text-[#334155]">
        <button onClick={() => alert("Privacy policy details.")} className="hover:text-[#818cf8] transition-colors">Privacy Policy</button>
        <span>•</span>
        <button onClick={() => alert("Terms of service details.")} className="hover:text-[#818cf8] transition-colors">Terms of Service</button>
      </div>

    </div>
  );
}

