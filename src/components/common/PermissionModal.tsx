import React, { useState } from 'react';
import { Lock, ShieldAlert, X, KeyRound, CheckCircle2, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { StaffUser } from '../../types/index.ts';

export interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  actionDescription?: string;
  currentUser?: StaffUser;
  onAuthorizeOverride?: () => void;
  onOpenStaffAccessModal?: () => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  actionTitle,
  actionDescription = 'This operation is restricted under showroom role-based access policy.',
  currentUser,
  onAuthorizeOverride,
  onOpenStaffAccessModal
}) => {
  const [adminPin, setAdminPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerifyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPin = adminPin.trim();
    // Validate master store PIN or default admin password
    const VALID_ADMIN_KEYS = ['admin123', 'admin', 'GIRI-7788', '7788', 'STORE-RESET', 'GIRIJEWELS', '1234'];

    if (!cleanPin) {
      setErrorMessage('Please enter the Admin Password or Store Security PIN');
      return;
    }

    if (VALID_ADMIN_KEYS.includes(cleanPin) || (currentUser?.role === 'admin')) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setAdminPin('');
        onClose();
        if (onAuthorizeOverride) {
          onAuthorizeOverride();
        }
      }, 700);
    } else {
      setErrorMessage('Incorrect Admin password or PIN. Please consult the Store Admin.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#160d16] border-2 border-[#392233] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Lock Icon & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                Security & Access Control
              </span>
              <h2 className="text-lg font-black text-white tracking-tight">
                Permission Required
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#100911] hover:bg-[#261327] text-[#cfb7c8] hover:text-white border border-[#482c40] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Details Box */}
        <div className="p-4 bg-[#100911] rounded-2xl border border-[#392233] space-y-1.5 text-xs">
          <span className="text-[#dfb76c] uppercase tracking-wider text-[10px] font-bold block">
            Restricted Action
          </span>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{actionTitle}</span>
          </div>
          <p className="text-[#cfb7c8] text-[11px] leading-relaxed pt-1">
            {actionDescription}
          </p>
        </div>

        {/* Instant Admin PIN / Password Override Form */}
        <form onSubmit={handleVerifyOverride} className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#faeed4] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Instant Admin Authorization</span>
              </span>
              <span className="text-[10px] text-[#dfb76c] font-mono">PIN: GIRI-7788 or admin123</span>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter Admin Password or Store PIN..."
                autoFocus
                className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#1d121c] border border-[#482c40] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#dfb76c] hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Authorization granted! Executing action...</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2.5 pt-2">
            {onOpenStaffAccessModal ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenStaffAccessModal();
                }}
                className="text-[11px] text-[#cfb7c8] hover:text-white underline cursor-pointer"
              >
                Manage Staff Permissions
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-[#261327] hover:bg-[#281829] text-[#faeed4] hover:text-white text-xs font-semibold rounded-xl border border-[#482c40] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Authorize & Proceed</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
