import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Shield, AlertCircle } from 'lucide-react';
import { recordPublicScan, recordPublicInteraction, submitPublicIntake } from '../../api/client.ts';

interface PublicIntakeFormProps {
  businessName?: string;
  onClosePreview?: () => void;
  isPreview?: boolean;
}

export const PublicIntakeForm: React.FC<PublicIntakeFormProps> = ({
  businessName = 'Giri Jewels',
  onClosePreview,
  isPreview = false
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Scan tracking
  const scanIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasInteractedRef = useRef<boolean>(false);

  useEffect(() => {
    recordPublicScan()
      .then((res) => {
        scanIdRef.current = res.scanId;
      })
      .catch((err) => console.warn('QR scan tracking notice:', err));
  }, []);

  const handleInteraction = () => {
    if (!hasInteractedRef.current && scanIdRef.current) {
      hasInteractedRef.current = true;
      recordPublicInteraction(scanIdRef.current).catch(() => {});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanPhone.length < 7) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await submitPublicIntake({
        name: name.trim(),
        phone: phone.trim(),
        place: place.trim() || undefined,
        city: place.trim() || undefined,
        referredBy: referredBy.trim() || undefined,
        email: email.trim() || undefined,
        scanId: scanIdRef.current || undefined,
        timeSpentSeconds
      });
      setIsReturning(Boolean(res.isReturningCustomer));
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f4f5f7] flex flex-col items-center justify-center p-4 selection:bg-[#d4af37]/30">
      <div className="w-full max-w-md bg-[#14161d] border border-[#232732] rounded-2xl p-6 sm:p-8 shadow-xl">
        {/* Header */}
        <div className="text-center pb-6 border-b border-[#1f222a]">
          <img
            src="/assets/aistudio/giri_jewellers_logo_transparent.png"
            alt="Giri Jewellers Crest"
            className="w-12 h-12 mx-auto object-contain mb-3"
          />
          <h1 className="font-cinzel text-lg font-bold tracking-[0.14em] text-[#e8c86d] uppercase">
            {businessName}
          </h1>
          <p className="text-xs text-[#8a919e] mt-1">
            Showroom Visitor Registry & Bespoke Assistance
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[#34d399] mx-auto" />
            <h2 className="text-base font-semibold text-white">
              {isReturning ? 'Welcome Back!' : 'Registration Complete'}
            </h2>
            <p className="text-xs text-[#9aa0a6] leading-relaxed max-w-xs mx-auto">
              {isReturning
                ? `Thank you for visiting us again, ${name}. Your showroom preferences have been updated.`
                : `Thank you for registering, ${name}. Our jewellery specialist will assist you shortly.`}
            </p>
            {isPreview && onClosePreview && (
              <button
                onClick={onClosePreview}
                className="mt-4 px-4 py-2 bg-[#1e222b] hover:bg-[#252a36] text-xs font-medium text-white rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} onFocus={handleInteraction} className="mt-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-[#241315] border border-[#482025] rounded-xl text-xs text-[#fca5a5] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ananya Menon"
                className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98470 12345"
                className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                Town / City / Location
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Kowdiar, Trivandrum"
                className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                Referred By (Optional)
              </label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="Friend, family, or advertisement"
                className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c0c6d2] mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. ananya@example.com"
                className="w-full text-xs px-3.5 py-2.5 bg-[#0e1014] border border-[#252832] rounded-xl text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e0bc45] text-[#14161d] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Registering...' : 'Register Visit'}
            </button>
          </form>
        )}

        <div className="pt-6 mt-6 border-t border-[#1f222a] flex items-center justify-center gap-2 text-[11px] text-[#6b7280]">
          <Shield className="w-3.5 h-3.5" />
          <span>Your contact details are kept strictly confidential.</span>
        </div>
      </div>
    </div>
  );
};
