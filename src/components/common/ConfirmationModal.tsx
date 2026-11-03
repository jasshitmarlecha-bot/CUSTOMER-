import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  itemDetails?: Array<{ label: string; value: string }>;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm & Proceed',
  cancelText = 'Cancel',
  variant = 'danger',
  itemDetails = []
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-950/80 border-rose-600/50 text-rose-400',
          confirmBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40',
          icon: Trash2
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-950/80 border-amber-600/50 text-amber-400',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40',
          icon: AlertTriangle
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-[#261327] border-purple-600/50 text-[#cfb7c8]',
          confirmBtn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-950/40',
          icon: Sparkles
        };
    }
  };

  const { iconBg, confirmBtn, icon: IconComponent } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#160d16] border border-[#392233] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#cfb7c8] block">
                Showroom Confirmation
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg bg-[#100911] hover:bg-[#261327] text-[#cfb7c8] hover:text-white border border-[#482c40] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Body */}
        <p className="text-xs sm:text-sm text-[#faeed4] leading-relaxed">
          {description}
        </p>

        {/* Optional Item Details Pill */}
        {itemDetails.length > 0 && (
          <div className="p-3 bg-[#100911] rounded-xl border border-[#392233] space-y-1.5 text-xs">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[#cfb7c8]">{item.label}:</span>
                <span className="font-semibold text-white font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#392233]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#261327] hover:bg-[#281829] text-[#faeed4] hover:text-white text-xs font-semibold rounded-xl border border-[#482c40] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${confirmBtn} ${
              isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
