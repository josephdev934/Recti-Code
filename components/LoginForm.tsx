'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(false);

    // Dynamic processing feedback
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Access Denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-[#080b11]">
      {/* Brand logo header */}
      <div className="flex items-center gap-3 mb-8">
        <svg className="w-7 h-7 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-white font-sans">Recti Code</span>
      </div>

      {/* Main card panel */}
      <div className="w-full max-w-[420px] bg-[#0d121f] border border-[#1e293b]/70 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Top 3-dot window controls */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1e293b]/50">
          <span className="w-3 h-3 rounded-full bg-[#f87171]/80"></span>
          <span className="w-3 h-3 rounded-full bg-[#fbbf24]/80"></span>
          <span className="w-3 h-3 rounded-full bg-[#34d399]/80"></span>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            System Auth
          </h2>
          <p className="text-sm font-mono text-[#64748b] mb-8">
            Initialising secure connection<span className="text-[#818cf8]">...</span><span className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#818cf8] cursor-blink"></span>
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#f87171] text-xs font-mono rounded-lg">
              [SYSTEM ERROR]: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                EMAIL_ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-md font-semibold text-[#475569]">@</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="dev@recti.code"
                  className="w-full pl-9 pr-4 py-3 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-mono font-bold tracking-widest text-[#475569] uppercase">
                  PASSWORD_HASH
                </label>
                <button
                  type="button"
                  onClick={() => alert("Secret keys must be reset via administrative systems.")}
                  className="text-[10px] font-mono text-[#475569] hover:text-[#818cf8] transition-colors"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-[#060910] text-sm text-white placeholder-[#334155] border border-[#1e293b] rounded-lg focus:outline-none focus:border-[#818cf8]/70 focus:ring-1 focus:ring-[#818cf8]/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 text-[#475569] hover:text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-[#475569] hover:text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#a5b4fc] hover:bg-[#818cf8] active:bg-[#6366f1] text-[#0f172a] font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none group"
            >
              <span className="text-sm font-sans font-bold tracking-wide">
                {isLoading ? 'Decrypting...' : 'Sign In'}
              </span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-[#1e293b]/50 text-center">
            <span className="text-xs font-mono text-[#475569]">Don't have an account? </span>
            <button
              onClick={onSwitchToRegister}
              className="text-xs font-mono text-[#34d399] hover:underline font-bold"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="mt-12 text-[10px] font-mono tracking-widest text-[#334155]">
        © 2026 RECTI CODE. VER 2.4.0-STABLE
      </div>
    </div>
  );
}

