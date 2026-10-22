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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 bg-(color:--c-080b11)">
      
      {/* Brand logo header */}
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-7 h-7 text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
        </svg>
        <span className="text-2xl font-bold tracking-tight text-(color:--ink) font-sans">Recti Code</span>
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[420px] bg-(color:--c-0d121f) border border-(color:--c-1e293b)/70 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Top Header Panel (no dots in Image 3, but let's make it styled cleanly) */}
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-(color:--ink) text-center">
            Create your workspace
          </h2>
          <p className="text-xs text-(color:--c-64748b) text-center mt-2">
            Get started with your free-tier professional account.
          </p>
        </div>

        {/* Body Content */}
        <div className="px-8 pb-8">
          
          {error && (
            <div role="alert" className="mb-6 p-3.5 bg-(color:--c-ef4444)/10 border border-(color:--c-ef4444)/30 text-(color:--c-f87171) text-xs font-sans rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-(color:--c-475569) uppercase">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-(color:--c-475569)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Linus Torvalds"
                  className="w-full pl-10 pr-4 py-2.5 bg-(color:--c-060910) text-sm text-(color:--ink) placeholder-(color:--c-334155) border border-(color:--c-1e293b) rounded-lg focus:outline-none focus:border-(color:--c-818cf8)/70 focus:ring-1 focus:ring-(color:--c-818cf8)/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-(color:--c-475569) uppercase">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-(color:--c-475569)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="linus@kernel.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-(color:--c-060910) text-sm text-(color:--ink) placeholder-(color:--c-334155) border border-(color:--c-1e293b) rounded-lg focus:outline-none focus:border-(color:--c-818cf8)/70 focus:ring-1 focus:ring-(color:--c-818cf8)/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-(color:--c-475569) uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-(color:--c-475569)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-(color:--c-060910) text-sm text-(color:--ink) placeholder-(color:--c-334155) border border-(color:--c-1e293b) rounded-lg focus:outline-none focus:border-(color:--c-818cf8)/70 focus:ring-1 focus:ring-(color:--c-818cf8)/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4 text-(color:--c-475569) hover:text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-(color:--c-475569) hover:text-(color:--c-818cf8)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold tracking-widest text-(color:--c-475569) uppercase">
                Confirm
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-(color:--c-475569)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 002 2m0 0V9a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V9a2 2 0 012-2zM9 11a4 4 0 100-8 4 4 0 000 8zm0 0v12m0 0l-3-3m3 3l3-3" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-(color:--c-060910) text-sm text-(color:--ink) placeholder-(color:--c-334155) border border-(color:--c-1e293b) rounded-lg focus:outline-none focus:border-(color:--c-818cf8)/70 focus:ring-1 focus:ring-(color:--c-818cf8)/30 transition-all font-mono"
                />
              </div>
            </div>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-(color:--c-a5b4fc) hover:bg-(color:--c-818cf8) active:bg-(color:--c-6366f1) text-(color:--c-0f172a) font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none group"
            >
              <span className="text-sm font-sans font-bold tracking-wide">
                {isLoading ? 'Creating...' : 'Create Account'}
              </span>
              <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>

          {/* Already have an account? */}
          <div className="mt-6 pt-4 border-t border-(color:--c-1e293b)/50 text-center">
            <span className="text-xs font-mono text-(color:--c-475569)">Already have an account? </span>
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-xs font-mono text-(color:--c-818cf8) hover:underline font-bold"
            >
              Log in
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

