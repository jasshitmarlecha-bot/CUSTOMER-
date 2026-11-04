import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Sparkles, RefreshCw } from 'lucide-react';

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
          iconBg: 'bg-rose-50 border-rose-200 text-rose-700',
          confirmBtn: 'bg-rose-700 hover:bg-rose-800 text-white shadow-xs',
          icon: Trash2
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50 border-amber-200 text-amber-800',
          confirmBtn: 'bg-amber-700 hover:bg-amber-800 text-white shadow-xs',
          icon: AlertTriangle
        };
      case 'primary':
      default:
        return {
          iconBg: 'bg-[#faf7f0] border-[#dfb76c]/50 text-[#0b241c]',
          confirmBtn: 'bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] border border-[#dfb76c]/40 shadow-xs',
          icon: Sparkles
        };
    }
  };

  const { iconBg, confirmBtn, icon: IconComponent } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 bg-[#040e0b]/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 text-[#0b241c] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#718079] block">
                Showroom Confirmation
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#0b241c] tracking-tight">
                {title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg bg-[#ffffff] hover:bg-[#faf7f0] text-[#718079] hover:text-[#0b241c] border border-[#ded7ca] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Body */}
        <p className="text-xs text-[#4b5a54] leading-relaxed">
          {description}
        </p>

        {/* Item Details */}
        {itemDetails && itemDetails.length > 0 && (
          <div className="p-3 bg-[#faf7f0] rounded-2xl border border-[#ede3d3] space-y-1.5 text-xs">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[#718079]">{item.label}:</span>
                <span className="font-semibold text-[#0b241c] font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ede3d3]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#ffffff] hover:bg-[#faf7f0] text-[#718079] hover:text-[#0b241c] text-xs font-semibold border border-[#ded7ca] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${confirmBtn}`}
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{isSubmitting ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
