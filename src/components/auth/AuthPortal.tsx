import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
  Store,
  User,
  BarChart2,
  Zap
} from 'lucide-react';
import { resetPassword } from '../../api/client.ts';
import { StaffUser } from '../../types/index.ts';

interface AuthPortalProps {
  onLoginSuccess: (user: StaffUser) => void;
  onLoginSubmit: (email: string, password?: string) => Promise<StaffUser>;
  businessName?: string;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onLoginSuccess,
  onLoginSubmit,
  businessName = 'GIRI JEWELLERS'
}) => {
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot / Reset Password state
  const [resetEmail, setResetEmail] = useState('');
  const [recoveryPin, setRecoveryPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Handle Quick Demo Login (Instant click without typing errors)
  const handleQuickLogin = async (role: 'admin' | 'staff') => {
    setIsLoggingIn(true);
    setLoginError(null);
    const email = role === 'admin' ? 'admin@girijewels.com' : 'staff@girijewels.com';
    const password = role === 'admin' ? 'admin123' : 'staff123';
    setLoginEmail(email);
    setLoginPassword(password);
    try {
      const user = await onLoginSubmit(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Manual Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim();
    const passTrimmed = loginPassword.trim();

    if (!emailTrimmed) {
      setLoginError('Please enter your email address or username (e.g. admin or staff).');
      return;
    }

    setIsLoggingIn(true);

    try {
      const user = await onLoginSubmit(emailTrimmed, passTrimmed);
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials. You can also use the 1-Click Quick Access above.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMessage(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter your account email address.');
      return;
    }
    if (!recoveryPin.trim()) {
      setResetError('Please enter the Store Master PIN (e.g. GIRI-7788).');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setResetError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('New password and confirmation do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetPassword(resetEmail.trim(), recoveryPin.trim(), newPassword.trim());
      setResetSuccessMessage(result.message || 'Password updated successfully! You can now sign in.');
      setLoginEmail(resetEmail.trim());
      setLoginPassword(newPassword.trim());
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please verify the master recovery PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col font-sans selection:bg-purple-600 selection:text-white relative overflow-x-hidden"
      style={{
        backgroundColor: '#0c0217',
        backgroundImage: "url('/assets/aistudio/image_c092bbfb.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Luxury Ambience Overlays: Deep velvet gradient & ambient lighting glow */}
      <div className="fixed inset-0 bg-[#0e021a]/60 backdrop-blur-[1px] pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none transition-opacity duration-700 bg-gradient-to-b from-[#0a0114]/70 via-[#100322]/40 to-[#07010e]/90 opacity-90" />

      {/* Floating Sparkles & Golden Bokeh Motifs */}
      <div className="fixed top-20 left-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP LUXURY NAVBAR                                                         */}
      {/* ========================================================================= */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-purple-900/20 bg-[#0b0115]/40 backdrop-blur-md">
        {/* Left: Gold Diamond Logo + GIRI JEWELLERS Brand in Luxury Serif Font */}
        <div className="flex items-center gap-3">
          <div className="relative group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_8px_rgba(245,215,127,0.4)]"
            />
          </div>
          <span className="font-cinzel text-base sm:text-lg font-bold tracking-[0.25em] text-[#fae7ba] uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {businessName.toUpperCase()}
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY: CENTERED GLASS CARD WITH RESPONSIVE SCALING                     */}
      {/* ========================================================================= */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-[490px]">
          {/* Glassmorphic Portal Panel */}
          <div className="relative rounded-[28px] sm:rounded-[32px] bg-[#120324]/85 sm:bg-[#120324]/80 backdrop-blur-2xl border-t border-t-[#fae8b6]/60 border-x border-x-purple-500/25 border-b border-b-purple-500/20 shadow-[0_25px_80px_rgba(20,2,40,0.85),0_0_50px_rgba(168,85,247,0.18)] p-6 sm:p-8 overflow-hidden">
            
            {/* Top-Center Golden Sparkle Highlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#fae8b6] to-transparent shadow-[0_0_12px_#fae8b6]" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#fae8b6]/20 blur-xl pointer-events-none" />

            {/* Header: Royal Crest Monogram Icon + Brand Name + Subtitle */}
            <div className="text-center space-y-2">
              {/* Royal Giri Jewellers Crest Monogram Logo without black background */}
              <div className="inline-block transform hover:scale-105 transition-transform duration-300">
                <img
                  src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                  alt="Giri Jewellers Crest"
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto object-contain drop-shadow-[0_0_16px_rgba(246,226,168,0.5)]"
                />
              </div>

              {/* GIRI JEWELLERS Brand in Golden Cinzel Serif */}
              <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.22em] text-[#fae7ba] uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {businessName.toUpperCase()}
              </h1>

              {/* Subtitle with Flanking Fine Divider Rules */}
              <div className="flex items-center justify-center gap-2 text-[10px] sm:text-[11.5px] text-[#d8b4fe]/85 tracking-widest uppercase">
                <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-r from-transparent to-purple-400/50" />
                <span className="font-medium whitespace-nowrap">Customer • Management • & Showroom Suite</span>
                <div className="h-[1px] w-6 sm:w-10 bg-gradient-to-l from-transparent to-purple-400/50" />
              </div>

              {/* Portal Pill Badge */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 sm:py-1.5 rounded-full bg-[#1e0738]/90 border border-purple-500/40 text-[10.5px] sm:text-[11px] text-purple-200 font-semibold tracking-wider uppercase shadow-inner">
                  <Store className="w-3.5 h-3.5 text-purple-300" />
                  <span>Store Staff & Admin Portal</span>
                  <ArrowRight className="w-3 h-3 text-purple-400" />
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* VIEW MODE 1: LOGIN PORTAL                                           */}
            {/* =================================================================== */}
            {viewMode === 'login' ? (
              <div className="mt-5 sm:mt-6 space-y-4 sm:space-y-5">
                {/* ⚡ QUICK ACCESS SECTION */}
                <div>
                  <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-200/90 mb-2.5">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300/40" />
                    <span>Quick Access</span>
                  </div>

                  {/* Two Side-by-Side Quick Cards (Stacked on small screens) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Store Admin Quick Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin')}
                      disabled={isLoggingIn}
                      className="group p-3 sm:p-3.5 rounded-2xl bg-[#1e0738]/80 hover:bg-[#2c0a52] border border-purple-500/30 hover:border-purple-400/60 text-left transition-all cursor-pointer flex items-center justify-between shadow-md hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-200 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[12.5px] font-bold text-white group-hover:text-purple-100">
                            Store Admin
                          </div>
                          <div className="text-[10px] text-purple-300/70 font-medium">
                            Access your dashboard
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-200 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>

                    {/* Counter Staff Quick Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('staff')}
                      disabled={isLoggingIn}
                      className="group p-3 sm:p-3.5 rounded-2xl bg-[#1e0738]/80 hover:bg-[#2c0a52] border border-purple-500/30 hover:border-purple-400/60 text-left transition-all cursor-pointer flex items-center justify-between shadow-md hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-200 shrink-0">
                          <BarChart2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-[12.5px] font-bold text-white group-hover:text-purple-100">
                            Counter Staff
                          </div>
                          <div className="text-[10px] text-purple-300/70 font-medium">
                            View operations
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-200 group-hover:translate-x-1 transition-transform shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Divider: OR SIGN IN MANUALLY */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-[1px] bg-purple-800/40 flex-1" />
                  <span className="text-[10px] sm:text-[10.5px] text-purple-300/70 uppercase tracking-widest font-semibold">
                    Or Sign In Manually
                  </span>
                  <div className="h-[1px] bg-purple-800/40 flex-1" />
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-semibold text-rose-300">{loginError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setViewMode('forgot_password');
                        }}
                        className="block text-[11px] text-purple-300 hover:text-white font-medium hover:underline cursor-pointer"
                      >
                        Reset password using Master PIN (GIRI-7788)?
                      </button>
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                  {/* Field 1: Email Address or Username */}
                  <div>
                    <label className="block text-xs font-medium text-purple-100/90 mb-1.5">
                      Email Address or Username
                    </label>
                    <div className="relative flex items-center rounded-2xl bg-[#17052c]/90 border border-purple-500/30 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                      <Mail className="w-4 h-4 text-purple-400 ml-4 mr-2.5 shrink-0" />
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="eg. admin or staff@girijewels.com"
                        className="w-full py-3 sm:py-3.5 pr-4 bg-transparent text-xs text-white placeholder:text-purple-400/45 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  {/* Field 2: Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-purple-100/90">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setViewMode('forgot_password');
                        }}
                        className="text-xs text-[#c084fc] hover:text-[#e9d5ff] transition-colors cursor-pointer font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative flex items-center rounded-2xl bg-[#17052c]/90 border border-purple-500/30 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400/50 transition-all">
                      <Lock className="w-4 h-4 text-purple-400 ml-4 mr-2.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full py-3 sm:py-3.5 pr-11 bg-transparent text-xs text-white placeholder:text-purple-400/45 focus:outline-none font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-purple-400 hover:text-white cursor-pointer p-1"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-purple-400/70" />}
                      </button>
                    </div>
                  </div>

                  {/* Glowing Lavender/Purple Gradient Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#d946ef] via-[#a855f7] to-[#8b5cf6] hover:from-[#e879f9] hover:via-[#c084fc] hover:to-[#a855f7] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-[0_0_30px_rgba(168,85,247,0.45)] hover:shadow-[0_0_40px_rgba(217,70,239,0.65)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2 border border-purple-300/30"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Showroom Suite</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </form>

                {/* Bottom Security Notice Box */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#16052c]/70 border border-purple-500/20 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-300 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] leading-tight">
                    <p className="font-semibold text-purple-200">Protected access for authorized staff only.</p>
                    <p className="text-purple-300/70 mt-0.5">Your data is secure with us.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* =================================================================== */
              /* VIEW MODE 2: FORGOT & RESET PASSWORD                                */
              /* =================================================================== */
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-purple-900/50 pb-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors cursor-pointer"
                    title="Back to Sign In"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <span>Reset Account Password</span>
                    </h2>
                    <p className="text-[10.5px] text-purple-300/70">
                      Authorized recovery using Store Master PIN
                    </p>
                  </div>
                </div>

                {resetError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccessMessage ? (
                  <div className="p-6 bg-[#16052c]/90 rounded-2xl border border-purple-500/40 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-purple-950 text-purple-300 border border-purple-700 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Password Reset Successful!</h3>
                    <p className="text-xs text-purple-200 leading-relaxed">
                      {resetSuccessMessage}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('login');
                        setResetSuccessMessage(null);
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-200 mb-1">
                        Registered Account Email
                      </label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. admin@girijewels.com"
                        className="w-full text-xs px-3 py-2.5 bg-[#17052c] border border-purple-700/60 rounded-xl text-white font-medium focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-200 mb-1">
                        Store Master Recovery PIN *
                      </label>
                      <input
                        type="password"
                        required
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value)}
                        placeholder="Enter Store Master PIN (e.g. GIRI-7788)..."
                        className="w-full text-xs px-3 py-2.5 bg-[#17052c] border border-purple-700/60 rounded-xl text-white font-mono focus:outline-none focus:border-purple-400"
                      />
                      <p className="text-[10px] text-purple-400 mt-1">Default Master PIN is GIRI-7788</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-200 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 4 characters..."
                          className="w-full text-xs pl-3 pr-10 py-2.5 bg-[#17052c] border border-purple-700/60 rounded-xl text-white focus:outline-none focus:border-purple-400 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-purple-400 hover:text-white cursor-pointer p-0.5"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-200 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password..."
                        className="w-full text-xs px-3 py-2.5 bg-[#17052c] border border-purple-700/60 rounded-xl text-white focus:outline-none focus:border-purple-400 font-medium"
                      />
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('login')}
                        className="w-1/3 py-2.5 px-3 text-xs font-semibold text-purple-300 hover:text-white bg-purple-950/80 hover:bg-purple-900 rounded-xl transition-colors cursor-pointer border border-purple-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting}
                        className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isResetting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Reset Password</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
