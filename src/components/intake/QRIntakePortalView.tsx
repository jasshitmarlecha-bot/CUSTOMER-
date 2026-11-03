import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  ExternalLink,
  Sliders,
  Check,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { getQRStandeeInfo } from '../../api/client.ts';
import { Category } from '../../types/index.ts';

interface QRIntakePortalViewProps {
  businessName: string;
  categories?: Category[];
  initialSubTab?: string;
  onRefreshData?: () => void;
}

export const QRIntakePortalView: React.FC<QRIntakePortalViewProps> = ({
  businessName = 'GIRI JEWELLERS'
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<number>(280); // adjustable in pixels
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadQR();
  }, []);

  const loadQR = async () => {
    setIsLoading(true);
    try {
      const data = await getQRStandeeInfo();
      setQrDataUrl(data.qrDataUrl);
      setTargetUrl(data.targetUrl);
    } catch (err) {
      console.error('Failed to load QR code', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const fullUrl = targetUrl || `${window.location.origin}/?intake=qr`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${businessName.toLowerCase().replace(/\s+/g, '_')}_qr_code.png`;
    link.click();
  };

  const presets = [
    { label: 'Counter Small', size: 180 },
    { label: 'Standard Stand', size: 260 },
    { label: 'Table Tent', size: 340 },
    { label: 'Large Poster', size: 420 }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Printable Area - Formatted cleanly for print */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-stand, #printable-qr-stand * {
            visibility: visible;
          }
          #printable-qr-stand {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>

      {/* Top Banner */}
      <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#dfb76c]">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Showroom Counter QR Code
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#261327] text-[#faeed4] border border-[#482c40]">
              Direct Standee
            </span>
          </div>
          <p className="text-xs text-[#cfb7c8]">
            Customers scan with any phone camera to register their walk-in visit, place, and referral details.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#261327] hover:bg-[#2e162f] text-[#faeed4] border border-[#482c40] rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-[#dfb76c]" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!qrDataUrl || isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4 text-[#1c1206] stroke-[2.5]" />
            <span>Print QR Code</span>
          </button>
        </div>
      </div>

      {/* Main QR Display & Size Adjuster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Code Standee Card (Centered & Sizable) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#160d16] border border-[#392233] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Backlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

          {/* Printable Stand Card */}
          <div
            id="printable-qr-stand"
            className="bg-[#100911] border-2 border-[#482c40] rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center max-w-lg w-full relative z-10 transition-all duration-200"
          >
            {/* Royal Giri Jewellers Crest Logo without black background */}
            <div className="mb-3">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers Crest"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto drop-shadow-[0_0_12px_rgba(245,215,127,0.45)]"
              />
            </div>

            <h2 className="font-cinzel text-xl sm:text-2xl font-black tracking-[0.16em] text-[#fae7ba] uppercase">
              {businessName || 'GIRI JEWELLERS'}
            </h2>
            <p className="text-[11px] text-[#dfb76c] font-semibold tracking-wider uppercase mt-0.5 mb-5">
              Scan to Register Showroom Walk-in
            </p>

            {/* Dynamic Sized QR Code Container */}
            <div
              className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#392233]"
              style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
            >
              {isLoading ? (
                <div className="text-xs text-purple-900 font-bold animate-pulse">Generating QR...</div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${businessName} Counter QR`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-purple-950">QR unavailable</div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-5 space-y-1">
              <span className="text-xs font-bold text-white block">
                Point Phone Camera at QR Code
              </span>
              <span className="text-[11px] text-[#cfb7c8] block max-w-xs mx-auto">
                Instant digital intake for hallmark warranty, billing records, and bespoke assistance.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Size Adjuster & Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Size Adjuster Card */}
          <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#392233]">
              <Sliders className="w-4 h-4 text-[#dfb76c]" />
              <h3 className="text-sm font-bold text-white">QR Code Size Adjust</h3>
            </div>

            {/* Live Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#cfb7c8]">Display & Print Size:</span>
                <span className="text-[#faeed4] font-mono font-bold bg-[#100911] px-2.5 py-0.5 rounded border border-[#392233]">
                  {qrSize} px
                </span>
              </div>
              <input
                type="range"
                min="160"
                max="440"
                step="10"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                className="w-full h-2 bg-[#100911] rounded-lg appearance-none cursor-pointer accent-[#dfb76c]"
              />
              <div className="flex justify-between text-[10px] text-[#cfb7c8] font-mono">
                <span>160px</span>
                <span>300px</span>
                <span>440px</span>
              </div>
            </div>

            {/* Size Preset Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#392233]">
              <span className="text-xs font-bold text-white block">Preset Quick Sizes:</span>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.size}
                    type="button"
                    onClick={() => setQrSize(p.size)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-left ${
                      qrSize === p.size
                        ? 'bg-[#261327] border-[#dfb76c] text-[#faeed4]'
                        : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
                    }`}
                  >
                    <span className="block">{p.label}</span>
                    <span className="text-[10px] font-mono text-[#dfb76c]">{p.size}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5 pt-3 border-t border-[#392233]">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>Print Counter QR Stand</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 bg-[#261327] hover:bg-[#2d1b28] text-[#faeed4] border border-[#482c40] font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#dfb76c]" />
                <span>Download High-Res PNG</span>
              </button>
            </div>
          </div>

          {/* Direct Link Card */}
          <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Direct Walk-in Intake Link</span>
            </h3>
            <p className="text-[11px] text-[#cfb7c8]">
              Copy the web address to share via counter tablet or bookmark on store iPad:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetUrl || `${window.location.origin}/?intake=qr`}
                className="flex-1 text-[11px] font-mono px-3 py-2 bg-[#100911] border border-[#392233] rounded-xl text-[#faeed4] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#261327] hover:bg-[#2d1b28] text-[#faeed4] border border-[#482c40] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <a
              href={targetUrl || `${window.location.origin}/?intake=qr`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#dfb76c] hover:underline pt-1"
            >
              <span>Test Walk-in Customer Form in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
