import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Smartphone, ShieldCheck, Gem, AlertCircle, MapPin, UserCheck, ArrowRight, Store } from 'lucide-react';
import { recordPublicScan, recordPublicInteraction, submitPublicIntake } from '../../api/client.ts';

interface PublicIntakeFormProps {
  businessName?: string;
  onClosePreview?: () => void;
  isPreview?: boolean;
}

export const PublicIntakeForm: React.FC<PublicIntakeFormProps> = ({
  businessName = 'GIRI JEWELLERS',
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
    // Initial QR scan event logging
    recordPublicScan()
      .then((res) => {
        scanIdRef.current = res.scanId;
      })
      .catch((err) => console.warn('QR scan tracking notice:', err));
  }, []);

  const handleInteraction = () => {
    if (!hasInteractedRef.current && scanIdRef.current) {
      hasInteractedRef.current = true;
      recordPublicInteraction(scanIdRef.current).catch(() => { });
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
      setErrorMessage('Please enter a valid 10-digit phone number');
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
    <div className="min-h-screen bg-[#f5efe6] py-8 px-4 flex flex-col items-center justify-center font-sans selection:bg-[#dfb76c]/30 selection:text-[#0b241c]">
      {isPreview && onClosePreview && (
        <div className="mb-4">
          <button
            onClick={onClosePreview}
            className="px-4 py-2 rounded-full bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] text-xs font-semibold border border-[#dfb76c]/60 shadow-md transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>← Back to Store Admin Dashboard</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(7,28,22,0.12)] overflow-hidden border border-[#ede3d3]">
        {/* Mobile Header Banner with Royal Emerald & Champagne Gold */}
        <div className="bg-gradient-to-b from-[#0b241c] to-[#071c16] text-[#faeed4] p-7 text-center space-y-2.5 relative border-b border-[#dfb76c]/25">
          {/* Subtle gold line accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2px] bg-gradient-to-r from-transparent via-[#dfb76c] to-transparent shadow-[0_0_8px_#dfb76c]" />

          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfb76c] via-[#ecd49d] to-[#b3883b] p-2.5 flex items-center justify-center shadow-lg shadow-[#dfb76c]/20 mb-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#071c16]" stroke="currentColor" strokeWidth="2">
                <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill="currentColor" fillOpacity="0.2" />
                <path d="M2 10h20M12 21L7.5 10 12 3l4.5 7L12 21z" />
              </svg>
            </div>
          </div>

          <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#faeed4] uppercase">
            {businessName}
          </h1>

          <p className="text-xs text-[#cfdfd6] font-medium leading-relaxed max-w-xs mx-auto">
            Welcome to our showroom. Register your walk-in visit for hallmark warranty and bespoke assistance.
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#103328] text-[#dfb76c] text-[10.5px] font-semibold border border-[#dfb76c]/30">
            <Smartphone className="w-3.5 h-3.5 text-[#dfb76c]" />
            <span>Showroom QR Verified Session</span>
          </div>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto shadow-inner ${isReturning
                ? 'bg-[#f4f7f5] border-emerald-500/50 text-[#0b241c]'
                : 'bg-emerald-50 border-emerald-500 text-emerald-700'
              }`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <h2 className="text-xl font-bold text-[#0b241c]">
              {isReturning ? `Welcome Back, ${name}!` : 'Registration Complete!'}
            </h2>

            <p className="text-sm text-[#4b5a54] leading-relaxed">
              {isReturning
                ? `We recognized your mobile number (${phone}). Your visit details have been refreshed and our counter executive is ready to assist you.`
                : `Thank you, ${name}. Your showroom profile has been registered with ${businessName}.`}
            </p>

            <div className="p-4 bg-[#fbf9f5] rounded-2xl border border-[#ede3d3] text-xs text-[#4b5a54] space-y-1 text-left">
              <p className="font-semibold text-[#0b241c]">You are all set at the counter.</p>
              <p>
                Our sales executive can look up your record instantly by your mobile number ({phone}).
              </p>
            </div>

            {isPreview ? (
              <button
                onClick={onClosePreview}
                className="w-full py-2.5 px-4 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#dfb76c]/40"
              >
                Return to Admin
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setName('');
                  setPhone('');
                  setPlace('');
                  setReferredBy('');
                  setEmail('');
                }}
                className="text-xs font-semibold text-[#0b241c] hover:underline pt-2 block mx-auto cursor-pointer"
              >
                Register another person
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1c2e26] mb-1.5">
                Your Full Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onFocus={handleInteraction}
                onChange={(e) => {
                  setName(e.target.value);
                  handleInteraction();
                }}
                placeholder="e.g. Priya Sharma"
                className="w-full text-xs px-3.5 py-2.5 bg-[#fbf9f5] border border-[#ede3d3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 text-[#0b241c] placeholder:text-[#97a49e] font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c2e26] mb-1.5">
                Mobile Phone Number <span className="text-rose-600">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onFocus={handleInteraction}
                onChange={(e) => {
                  setPhone(e.target.value);
                  handleInteraction();
                }}
                placeholder="e.g. 9845012345"
                className="w-full text-xs px-3.5 py-2.5 bg-[#fbf9f5] border border-[#ede3d3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 text-[#0b241c] placeholder:text-[#97a49e] font-mono font-medium"
              />
              <p className="text-[10px] text-[#718079] mt-1">Used for billing lookups, receipts, and order tracking.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c2e26] mb-1.5">
                Your Place / Native Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#b08738] absolute left-3 top-3" />
                <input
                  type="text"
                  value={place}
                  onFocus={handleInteraction}
                  onChange={(e) => {
                    setPlace(e.target.value);
                    handleInteraction();
                  }}
                  placeholder="e.g. Trivandrum, East Fort, Kollam"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#fbf9f5] border border-[#ede3d3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 text-[#0b241c] placeholder:text-[#97a49e] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c2e26] mb-1.5">
                Who Referred You to Our Showroom? (Optional)
              </label>
              <div className="relative">
                <UserCheck className="w-3.5 h-3.5 text-[#b08738] absolute left-3 top-3" />
                <input
                  type="text"
                  value={referredBy}
                  onFocus={handleInteraction}
                  onChange={(e) => {
                    setReferredBy(e.target.value);
                    handleInteraction();
                  }}
                  placeholder="e.g. Ramesh Kumar, Family friend, Walk-in"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#fbf9f5] border border-[#ede3d3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 text-[#0b241c] placeholder:text-[#97a49e] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1c2e26] mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onFocus={handleInteraction}
                onChange={(e) => {
                  setEmail(e.target.value);
                  handleInteraction();
                }}
                placeholder="e.g. priya@example.com"
                className="w-full text-xs px-3.5 py-2.5 bg-[#fbf9f5] border border-[#ede3d3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 text-[#0b241c] placeholder:text-[#97a49e] font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] font-bold text-xs rounded-xl shadow-lg shadow-[#0b241c]/20 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer border border-[#dfb76c]/40 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Registering Details...' : 'Submit & Register'}</span>
              <ArrowRight className="w-4 h-4 text-[#dfb76c]" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#718079] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#b08738]" />
              <span>Direct showroom intake. Your contact privacy is respected.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
