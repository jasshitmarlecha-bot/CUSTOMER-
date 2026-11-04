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
  const [qrSize, setQrSize] = useState<number>(260); // adjustable in pixels
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
      {/* Printable Area - Formatted cleanly for physical print */}
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
            color: #0b241c !important;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: none !important;
          }
        }
      `}</style>

      {/* Top Banner */}
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b241c] tracking-tight">
              Showroom Counter QR Standee
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
              Live Standee
            </span>
          </div>
          <p className="text-xs text-[#718079]">
            Customers scan with any smartphone camera to register their walk-in visit, place, and referral details.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadQR}
            disabled={!qrDataUrl || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] hover:bg-[#faf7f0] text-[#0b241c] border border-[#ded7ca] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-[#b08738]" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!qrDataUrl || isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] border border-[#dfb76c]/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40"
          >
            <Printer className="w-4 h-4 text-[#dfb76c]" />
            <span>Print Counter Stand</span>
          </button>
        </div>
      </div>

      {/* Main QR Display & Size Adjuster Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Code Standee Card (Centered & Sizable) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-8 sm:p-12 shadow-xs relative overflow-hidden">
          {/* Subtle Ambient Golden Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#dfb76c]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Printable Stand Card - Deep Royal Emerald Luxury Stand */}
          <div
            id="printable-qr-stand"
            className="bg-gradient-to-b from-[#0b241c] to-[#071c16] border-2 border-[#dfb76c]/50 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center text-center max-w-md w-full relative z-10 transition-all duration-200"
          >
            {/* Gold Diamond Crest */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#dfb76c] via-[#ecd49d] to-[#b3883b] p-2.5 flex items-center justify-center shadow-lg shadow-[#dfb76c]/20 mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#071c16]" stroke="currentColor" strokeWidth="2">
                <path d="M6 3h12l4 7-10 11L2 10l4-7z" fill="currentColor" fillOpacity="0.2" />
                <path d="M2 10h20M12 21L7.5 10 12 3l4.5 7L12 21z" />
              </svg>
            </div>

            <h2 className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#faeed4] uppercase">
              {businessName || 'GIRI JEWELLERS'}
            </h2>
            <p className="text-[11px] text-[#dfb76c] font-semibold tracking-wider uppercase mt-1 mb-5">
              Scan to Register Showroom Walk-in
            </p>

            {/* Dynamic Sized QR Code Container */}
            <div
              className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center border-4 border-[#dfb76c]/40"
              style={{ width: `${qrSize}px`, height: `${qrSize}px` }}
            >
              {isLoading ? (
                <div className="text-xs text-[#0b241c] font-bold animate-pulse">Generating QR...</div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`${businessName} Counter QR`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-[#718079]">QR unavailable</div>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-5 space-y-1">
              <span className="text-xs font-bold text-white block">
                Point Phone Camera at QR Code
              </span>
              <span className="text-[11px] text-[#cfdfd6] block max-w-xs mx-auto">
                Instant digital intake for hallmark warranty, billing records, and bespoke assistance.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Size Adjuster & Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Size Adjuster Card */}
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#ede3d3]">
              <Sliders className="w-4 h-4 text-[#b08738]" />
              <h3 className="text-sm font-bold text-[#0b241c]">Standee QR Size</h3>
            </div>

            {/* Live Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#4b5a54]">Display & Print Size:</span>
                <span className="text-[#0b241c] font-mono font-bold bg-[#faf7f0] px-2.5 py-0.5 rounded border border-[#ede3d3]">
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
                className="w-full h-2 bg-[#faf7f0] rounded-lg appearance-none cursor-pointer accent-[#0b241c]"
              />
              <div className="flex justify-between text-[10px] text-[#718079] font-mono">
                <span>160px</span>
                <span>300px</span>
                <span>440px</span>
              </div>
            </div>

            {/* Size Preset Buttons */}
            <div className="space-y-2 pt-2 border-t border-[#ede3d3]">
              <span className="text-xs font-bold text-[#0b241c] block">Preset Formats:</span>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => (
                  <button
                    key={p.size}
                    type="button"
                    onClick={() => setQrSize(p.size)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer text-left ${
                      qrSize === p.size
                        ? 'bg-[#0b241c] border-[#0b241c] text-[#f7eedf]'
                        : 'bg-[#ffffff] border-[#ded7ca] text-[#4b5a54] hover:bg-[#faf7f0]'
                    }`}
                  >
                    <span className="block">{p.label}</span>
                    <span className={`text-[10px] font-mono ${qrSize === p.size ? 'text-[#dfb76c]' : 'text-[#718079]'}`}>
                      {p.size}px
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2.5 pt-3 border-t border-[#ede3d3]">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 bg-[#0b241c] hover:bg-[#12362b] active:scale-95 text-[#f7eedf] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-[#dfb76c]" />
                <span>Print Counter Standee</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full py-2.5 px-4 bg-[#ffffff] hover:bg-[#faf7f0] text-[#0b241c] border border-[#ded7ca] font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#b08738]" />
                <span>Download High-Res PNG</span>
              </button>
            </div>
          </div>

          {/* Direct Link Card */}
          <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#0b241c] flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-[#b08738]" />
              <span>Direct Customer Intake Link</span>
            </h3>
            <p className="text-[11px] text-[#718079]">
              Share this web address with counter tablets or bookmark on store iPads:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetUrl || `${window.location.origin}/?intake=qr`}
                className="flex-1 text-[11px] font-mono px-3 py-2 bg-[#faf7f0] border border-[#ede3d3] rounded-xl text-[#0b241c] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-2 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] border border-[#dfb76c]/40 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#dfb76c]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <a
              href={targetUrl || `${window.location.origin}/?intake=qr`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#0b241c] font-semibold hover:underline pt-1"
            >
              <span>Test Walk-in Customer Form in new tab</span>
              <ExternalLink className="w-3 h-3 text-[#b08738]" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
