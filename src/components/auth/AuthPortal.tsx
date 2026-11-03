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
  Shield,
  ArrowLeft,
  User,
  Store
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

  // Quick Preset Selector for Fast Sign-In
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
      setLoginError(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Manual Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim();
    const passTrimmed = loginPassword.trim();

    if (!emailTrimmed) {
      setLoginError('Please enter your email or username.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const user = await onLoginSubmit(emailTrimmed, passTrimmed);
      onLoginSuccess(user);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Password Reset Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccessMessage(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter your account email.');
      return;
    }
    if (!recoveryPin.trim()) {
      setResetError('Please enter the Store Master PIN.');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setResetError('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetPassword(resetEmail.trim(), recoveryPin.trim(), newPassword.trim());
      setResetSuccessMessage(result.message || 'Password updated successfully. You can now sign in.');
      setLoginEmail(resetEmail.trim());
      setLoginPassword(newPassword.trim());
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please check the Master Recovery PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f4f5f7] flex flex-col font-sans selection:bg-[#d4af37]/30 selection:text-white">
      {/* Top Header */}
      <header className="w-full border-b border-[#1f222a] bg-[#12141a]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-8 h-8 object-contain"
            />
            <span className="font-cinzel text-sm font-semibold tracking-[0.2em] text-[#e8c86d] uppercase">
              {businessName}
            </span>
          </div>
          <span className="text-xs text-[#8a919e] font-medium hidden sm:inline">
            Showroom Suite & Staff Portal
          </span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px]">
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-7 sm:p-8 shadow-xl">
            {/* Brand Header */}
            <div className="text-center pb-6 border-b border-[#1f222a]">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers"
                className="w-14 h-14 mx-auto object-contain mb-3"
              />
              <h1 className="font-cinzel text-xl font-bold tracking-[0.16em] text-[#e8c86d] uppercase">
                {businessName}
              </h1>
              <p className="text-xs text-[#8a919e] mt-1 font-medium">
                Customer Management & Showroom Operations
              </p>
            </div>

            {viewMode === 'login' ? (
              <div className="mt-6 space-y-5">
                {/* Quick Access Account Selector */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#8a919e] uppercase tracking-wider mb-2.5">
                    <span>Quick Sign-In</span>
                    <span className="text-[10px] text-[#5f6674] lowercase font-normal">click to autofill</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('admin')}
                      disabled={isLoggingIn}
                      className="p-3 rounded-xl bg-[#1a1d26] hover:bg-[#202430] border border-[#272b36] hover:border-[#383e4d] text-left transition-colors cursor-pointer group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="text-xs font-semibold text-white group-hover:text-[#e8c86d]">Store Admin</span>
                      </div>
                      <p className="text-[10.5px] text-[#717886] mt-0.5">Full store management</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('staff')}
                      disabled={isLoggingIn}
                      className="p-3 rounded-xl bg-[#1a1d26] hover:bg-[#202430] border border-[#272b36] hover:border-[#383e4d] text-left transition-colors cursor-pointer group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="text-xs font-semibold text-white group-hover:text-[#e8c86d]">Counter Staff</span>
                      </div>
                      <p className="text-[10.5px] text-[#717886] mt-0.5">Counter walk-in desk</p>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1f222a]" />
                  </div>
                  <span className="relative px-3 bg-[#14161d] text-[11px] font-medium text-[#646a78] uppercase tracking-wider">
                    Or credentials
                  </span>
                </div>

                {/* Error Banner */}
                {loginError && (
                  <div className="p-3 bg-[#241315] border border-[#482025] rounded-xl text-xs text-[#fca5a5] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium">{loginError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setViewMode('forgot_password');
                        }}
                        className="text-[11px] text-[#d4af37] hover:underline cursor-pointer font-medium block"
                      >
                        Reset password with Master PIN (GIRI-7788)
                      </button>
                    </div>
                  </div>
                )}

                {/* Manual Credentials Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#c0c6d2] mb-1.5">
                      Email address or username
                    </label>
                    <div className="relative flex items-center rounded-xl bg-[#0e1014] border border-[#252832] focus-within:border-[#d4af37] transition-colors">
                      <Mail className="w-4 h-4 text-[#6b7280] ml-3.5 mr-2 shrink-0" />
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="admin@girijewels.com or staff"
                        className="w-full py-2.5 pr-3.5 bg-transparent text-xs text-white placeholder:text-[#4b5260] focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-[#c0c6d2]">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setViewMode('forgot_password');
                        }}
                        className="text-xs text-[#d4af37] hover:text-[#e8c86d] transition-colors cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center rounded-xl bg-[#0e1014] border border-[#252832] focus-within:border-[#d4af37] transition-colors">
                      <Lock className="w-4 h-4 text-[#6b7280] ml-3.5 mr-2 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full py-2.5 pr-10 bg-transparent text-xs text-white placeholder:text-[#4b5260] focus:outline-none font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#6b7280] hover:text-[#c0c6d2] cursor-pointer p-0.5"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Refined Gold Primary Button */}
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e0bc45] active:bg-[#c29f2f] disabled:opacity-50 text-[#14161d] font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
                  >
                    {isLoggingIn ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#14161d]" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Showroom Suite</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Security Footer Note */}
                <div className="pt-2 flex items-center gap-2.5 text-[11px] text-[#6b7280]">
                  <Shield className="w-3.5 h-3.5 text-[#8a919e] shrink-0" />
                  <span>Authorized showroom staff access. Sessions securely managed.</span>
                </div>
              </div>
            ) : (
              /* Password Reset View */
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#1f222a]">
                  <button
                    type="button"
                    onClick={() => setViewMode('login')}
                    className="p-1 rounded-lg text-[#8a919e] hover:text-white hover:bg-[#1a1d26] transition-colors cursor-pointer"
                    aria-label="Back to sign in"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-xs font-semibold text-white">Reset Account Password</h2>
                    <p className="text-[11px] text-[#717886]">Recovery via Store Master PIN</p>
                  </div>
                </div>

                {resetError && (
                  <div className="p-3 bg-[#241315] border border-[#482025] rounded-xl text-xs text-[#fca5a5] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccessMessage ? (
                  <div className="p-5 bg-[#14231b] border border-[#234832] rounded-xl text-center space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-[#34d399] mx-auto" />
                    <h3 className="text-xs font-semibold text-white">Password Updated</h3>
                    <p className="text-xs text-[#9ae6b4]">{resetSuccessMessage}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('login');
                        setResetSuccessMessage(null);
                      }}
                      className="w-full py-2.5 px-4 bg-[#234832] hover:bg-[#2d5d40] text-[#9ae6b4] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                        Account email or username
                      </label>
                      <input
                        type="text"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@girijewels.com"
                        className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-[#c0c6d2]">Store Master Recovery PIN</label>
                        <span className="text-[10px] text-[#6b7280]">Default: GIRI-7788</span>
                      </div>
                      <input
                        type="password"
                        required
                        value={recoveryPin}
                        onChange={(e) => setRecoveryPin(e.target.value)}
                        placeholder="e.g. GIRI-7788"
                        className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white font-mono focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#c0c6d2] mb-1">New password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 4 characters"
                          className="w-full text-xs pl-3.5 pr-10 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white focus:outline-none focus:border-[#d4af37]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-[#6b7280] hover:text-[#c0c6d2] cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#c0c6d2] mb-1">Confirm password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('login')}
                        className="w-1/3 py-2.5 text-xs font-medium text-[#9aa0a6] hover:text-white bg-[#1a1d26] hover:bg-[#202430] rounded-xl border border-[#252832] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting}
                        className="flex-1 py-2.5 text-xs font-semibold text-[#14161d] bg-[#d4af37] hover:bg-[#e0bc45] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isResetting ? 'Verifying...' : 'Set New Password'}
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
