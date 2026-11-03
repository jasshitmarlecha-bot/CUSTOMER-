import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Smartphone, ShieldCheck, Gem, AlertCircle, MapPin, UserCheck } from 'lucide-react';
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
    // 1. Initial QR scan event logging
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
    <div className="min-h-screen bg-[#0b0416] py-8 px-4 flex flex-col items-center justify-center font-sans selection:bg-purple-600 selection:text-white">
      {isPreview && onClosePreview && (
        <div className="mb-4">
          <button
            onClick={onClosePreview}
            className="px-4 py-1.5 rounded-full bg-[#261327] hover:bg-[#281829] text-[#faeed4] text-xs font-semibold border border-[#482c40] shadow-md transition-colors"
          >
            ← Back to Store Admin Dashboard
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-[#130726] rounded-3xl shadow-2xl overflow-hidden border border-[#392233]">
        {/* Mobile Header Banner */}
        <div className="bg-gradient-to-br from-[#1d121c] via-[#15072e] to-[#0c0319] text-white p-7 text-center space-y-2.5 relative border-b border-[#392233]">
          <div className="flex flex-col items-center justify-center">
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_14px_rgba(245,215,127,0.5)] mb-2"
            />
          </div>
          <h1 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.14em] text-[#faeed4] uppercase drop-shadow-md">
            {businessName}
          </h1>
          <p className="text-xs text-[#faeed4]/90 font-medium">
            Welcome to our showroom! Register your counter visit for hallmark warranty & personalized assistance.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#261327] text-[#cfb7c8] text-[10px] font-semibold border border-[#482c40]">
            <Smartphone className="w-3 h-3 text-[#dfb76c]" />
            <span>Showroom QR Verified Session</span>
          </div>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto shadow-inner ${
              isReturning
                ? 'bg-[#261327] border-purple-500/50 text-[#cfb7c8]'
                : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {isReturning ? `Welcome Back, ${name}!` : 'Registration Complete!'}
            </h2>
            <p className="text-sm text-[#faeed4] leading-relaxed">
              {isReturning
                ? `We recognized your phone number (${phone}). Your visit details have been refreshed and our counter executive is ready to assist you!`
                : `Thank you, ${name}. Your showroom profile has been registered with ${businessName}.`}
            </p>
            <div className="p-4 bg-[#100911] rounded-2xl border border-[#392233] text-xs text-[#cfb7c8] space-y-1 text-left">
              <p className="font-semibold text-white">You are all set at the counter.</p>
              <p>
                Our sales executive can look up your record instantly by your mobile number ({phone}).
              </p>
            </div>
            {isPreview ? (
              <button
                onClick={onClosePreview}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 text-[#1c1206] text-xs font-bold rounded-xl transition-all cursor-pointer"
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
                className="text-xs font-semibold text-[#dfb76c] hover:text-white underline pt-2 block mx-auto cursor-pointer"
              >
                Register another person
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#faeed4] mb-1.5">
                Your Full Name <span className="text-[#dfb76c]">*</span>
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
                className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-purple-400/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#faeed4] mb-1.5">
                Mobile Phone Number <span className="text-[#dfb76c]">*</span>
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
                className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-purple-400/50 font-mono font-medium"
              />
              <p className="text-[10px] text-[#dfb76c] mt-1">Used for billing lookups, receipts, and order tracking.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#faeed4] mb-1.5">
                Your Place / Native Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#dfb76c] absolute left-3 top-3" />
                <input
                  type="text"
                  value={place}
                  onFocus={handleInteraction}
                  onChange={(e) => {
                    setPlace(e.target.value);
                    handleInteraction();
                  }}
                  placeholder="e.g. Trivandrum, East Fort, Kollam"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#100911] border border-[#392233] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-purple-400/50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#faeed4] mb-1.5">
                Who Referred You to Our Showroom? (Optional)
              </label>
              <div className="relative">
                <UserCheck className="w-3.5 h-3.5 text-[#dfb76c] absolute left-3 top-3" />
                <input
                  type="text"
                  value={referredBy}
                  onFocus={handleInteraction}
                  onChange={(e) => {
                    setReferredBy(e.target.value);
                    handleInteraction();
                  }}
                  placeholder="e.g. Ramesh Kumar, Family friend, Walk-in"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-[#100911] border border-[#392233] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-purple-400/50 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#faeed4] mb-1.5">
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
                className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white placeholder:text-purple-400/50 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-950/60 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Registering Details...' : 'Submit & Register'}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-purple-400/80 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Direct showroom intake. Your contact privacy is respected.</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
