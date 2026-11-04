import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  QrCode,
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Gem,
  Phone,
  MapPin,
  Calendar,
  Printer,
  Upload,
  MessageSquare,
  Download,
  X,
  Maximize2,
  RefreshCw,
  Tag,
  UserCheck,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Settings as SettingsIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Category, QRAnalyticsData, StaffUser, StoreSettings } from '../../types/index.ts';
import { getQRAnalytics, getQRStandeeInfo } from '../../api/client.ts';

interface DashboardViewProps {
  customers: Customer[];
  categories: Category[];
  currentUser: StaffUser;
  businessName?: string;
  storeSettings?: StoreSettings;
  onNavigateTab: (tab: string) => void;
  onOpenAddCustomer: () => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  categories,
  currentUser,
  businessName = 'GIRI JEWELLERS',
  storeSettings,
  onNavigateTab,
  onOpenAddCustomer,
  onSelectCustomer
}) => {
  const [qrAnalytics, setQrAnalytics] = useState<QRAnalyticsData | null>(null);
  const [qrStandeeInfo, setQrStandeeInfo] = useState<{ qrDataUrl: string; targetUrl: string } | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'today' | 'walkin_qr' | 'manual' | 'import'>('all');
  const [showFullscreenQR, setShowFullscreenQR] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch QR standee info & analytics
  useEffect(() => {
    getQRAnalytics('all')
      .then((data) => setQrAnalytics(data))
      .catch((err) => console.warn('Dashboard QR analytics notice:', err));
    getQRStandeeInfo()
      .then((info) => setQrStandeeInfo(info))
      .catch((err) => console.warn('Dashboard QR standee notice:', err));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onOpenAddCustomer();
      } else if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        onNavigateTab('qr_common');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        onNavigateTab('import');
      } else if (e.key === 'Escape' && showFullscreenQR) {
        setShowFullscreenQR(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAddCustomer, onNavigateTab, showFullscreenQR]);

  // Metrics
  const totalCustomers = customers.length;
  const qrIntakeCount = customers.filter(c => c.source === 'walkin_qr').length;
  const manualIntakeCount = customers.filter(c => c.source === 'manual').length;
  const importIntakeCount = customers.filter(c => c.source === 'import').length;
  const totalScans = qrAnalytics?.totalScans || 0;
  const conversionRate = qrAnalytics?.scanToRegRate || (totalScans > 0 ? Math.round((qrIntakeCount / totalScans) * 100) : 0);

  // Today's customers
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayCustomers = customers.filter(c => {
    if (!c.createdAt) return false;
    return c.createdAt.startsWith(todayDateStr);
  });

  // Reachable verified phone count for directory & billing
  const broadcastReadyCustomers = customers.filter(c => c.phone && c.phone.replace(/\D/g, '').length >= 7);
  const validPhonePct = totalCustomers > 0 ? Math.round((broadcastReadyCustomers.length / totalCustomers) * 100) : 100;

  // Filtered customers for instant counter desk
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Source filter
      if (sourceFilter === 'today') {
        if (!c.createdAt || !c.createdAt.startsWith(todayDateStr)) return false;
      } else if (sourceFilter !== 'all') {
        if (c.source !== sourceFilter) return false;
      }
      // Keyword search
      if (quickSearch.trim()) {
        const q = quickSearch.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesCity = c.city?.toLowerCase().includes(q) || c.place?.toLowerCase().includes(q);
        const matchesReferral = c.referredBy?.toLowerCase().includes(q);
        const matchesCat = c.categoryName?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCity && !matchesReferral && !matchesCat && !matchesNotes) {
          return false;
        }
      }
      return true;
    });
  }, [customers, sourceFilter, quickSearch, todayDateStr]);

  // Popular category interest breakdown
  const categoryRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const cat = c.categoryName || 'General Bridal';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percent: totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [customers, totalCustomers]);

  // Top Customer Towns / Places
  const topPlaces = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const loc = c.place || c.city;
      if (loc && loc.trim()) {
        const placeTrimmed = loc.trim();
        counts[placeTrimmed] = (counts[placeTrimmed] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([place, count]) => ({ place, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [customers]);

  // 1-Click Customer Directory Exporter (Excel .xlsx)
  const handleExportDirectoryList = () => {
    if (broadcastReadyCustomers.length === 0) return;
    const rows = broadcastReadyCustomers.map((c, i) => {
      const cleanPhone = c.phone.replace(/[^0-9]/g, '');
      return {
        'S.No': i + 1,
        'Customer Name': c.name,
        'Mobile Phone': cleanPhone.length === 10 ? `+91 ${cleanPhone}` : c.phone,
        'Customer Place / City': c.place || c.city || '-',
        'Referred By': c.referredBy || 'Direct Walk-in',
        'Preferred Category': c.categoryName || 'General',
        'Registered Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-',
        'Intake Channel': c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Counter Staff'
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 16 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified_Directory');
    XLSX.writeFile(workbook, `${businessName.replace(/\s+/g, '_')}_Customer_Directory_${todayDateStr}.xlsx`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* =========================================================================
          1. HERO COMMAND BANNER (Matching image_b8141114.png)
      ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-[#160d16] border border-[#392233] p-6 md:p-8 shadow-2xl">
        {/* Luxury Diamond Ring on Deep Velvet Silk Image Overlay */}
        <div
          className="absolute inset-y-0 right-0 w-full sm:w-2/3 lg:w-1/2 pointer-events-none opacity-45 sm:opacity-75 bg-right bg-no-repeat bg-contain"
          style={{
            backgroundImage: "url('/assets/aistudio/image_c092bbfb.png')",
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.8) 40%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.8) 40%, black 100%)'
          }}
        />

        {/* Ambient Warm Golden Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between min-h-[220px] gap-6">
          {/* Top Badges & Right Action Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e241c] border border-[#1e4e37] text-[11px] font-semibold text-[#6ee7b7]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Showroom Counter Active</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#29112d] border border-[#552763] text-[11px] font-semibold text-[#e9d5ff]">
                <Gem className="w-3 h-3 text-[#d8b4fe]" />
                <span>{storeSettings?.branchName || 'Trivandrum Flagship Showroom'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('import')}
                className="px-3.5 py-1.5 bg-[#1d121c]/90 hover:bg-[#2c192b] text-[#faeed4] hover:text-white text-xs font-semibold rounded-xl border border-[#4a2e43] shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
              >
                <Upload className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Import Data</span>
              </button>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="px-3.5 py-1.5 bg-[#1d121c]/90 hover:bg-[#2c192b] text-[#faeed4] hover:text-white text-xs font-semibold rounded-xl border border-[#4a2e43] shadow-md transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
              >
                <QrCode className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Counter QR</span>
              </button>
            </div>
          </div>

          {/* Typography Content */}
          <div className="space-y-2 max-w-xl">
            <p className="text-[11.5px] text-[#cfb7c8] font-medium">
              Operator: <strong className="text-white">Store Manager</strong> ({currentUser.role === 'admin' ? 'Store Admin' : 'Counter Staff'})
            </p>
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers Crest"
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_0_12px_rgba(245,215,127,0.45)] shrink-0"
              />
              <div>
                <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-bold tracking-[0.12em] text-[#faeed4] uppercase drop-shadow-md">
                  {businessName}
                </h1>
                <p className="font-cormorant italic text-xl sm:text-2xl text-[#dfb76c] font-normal leading-tight">
                  Customer Center
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-[13px] text-[#d6c4d1] leading-relaxed max-w-lg pt-1">
              Unified showroom intake, customer referral records, phone directory health, and verified contacts.
            </p>
          </div>

          {/* Bottom Primary Action Button: Quick Walk-In Entry */}
          <div className="pt-1">
            <button
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1a1019]/90 hover:bg-[#dfb76c] hover:text-[#1a1004] text-[#faeed4] border border-[#dfb76c]/70 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-lg group backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 text-[#dfb76c] group-hover:text-[#1a1004] stroke-[2.5]" />
              <span>Quick Walk-In Entry</span>
              <ArrowRight className="w-4 h-4 text-[#dfb76c] group-hover:text-[#1a1004] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. 4 STAT CARDS WITH NEON WAVEFORM GRAPH BACKGROUNDS (Matching Screenshot)
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: TOTAL CUSTOMERS (Purple Waveform) */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="relative overflow-hidden bg-[#180f18] hover:bg-[#201320] border border-[#3d2437] hover:border-[#6a345e] rounded-2xl p-4 sm:p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[125px]"
        >
          {/* Glowing Purple Waveform SVG in Background */}
          <div className="absolute inset-0 pointer-events-none flex items-end opacity-40 group-hover:opacity-60 transition-opacity">
            <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="none" fill="none">
              <path
                d="M0,55 Q50,60 100,50 T200,30 T300,50"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,55 Q50,60 100,50 T200,30 T300,50 L300,70 L0,70 Z"
                fill="url(#purpleWaveGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="purpleWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2e1533] border border-[#5c2466] text-[#d8b4fe] flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider">
                Total Customers
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-3xl font-black text-white block tracking-tight">
              {totalCustomers}
            </span>
            <div className="text-[11px] text-[#cfb7c8] mt-1 flex items-center gap-1 font-medium">
              <span className="text-[#a855f7] font-bold">↗ {qrIntakeCount} QR</span>
              <span>•</span>
              <span>{manualIntakeCount} Staff</span>
              <span>•</span>
              <span>{importIntakeCount} Import</span>
            </div>
          </div>
        </div>

        {/* Card 2: TODAY'S FOOTFALL (Emerald Waveform) */}
        <div className="relative overflow-hidden bg-[#180f18] border border-[#3d2437] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between min-h-[125px]">
          {/* Glowing Emerald Waveform SVG in Background */}
          <div className="absolute inset-0 pointer-events-none flex items-end opacity-40">
            <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="none" fill="none">
              <path
                d="M0,55 Q60,60 120,45 T220,25 T300,45"
                stroke="#34d399"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,55 Q60,60 120,45 T220,25 T300,45 L300,70 L0,70 Z"
                fill="url(#emeraldWaveGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="emeraldWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#14291f] border border-[#1e5239] text-[#6ee7b7] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider">
                Today's Footfall
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-3xl font-black text-[#34d399] block tracking-tight">
              {todayCustomers.length}
            </span>
            <span className="text-[11px] text-[#cfb7c8] mt-1 block">
              New walk-in visitors today
            </span>
          </div>
        </div>

        {/* Card 3: SHOWROOM QR SCANS (Bronze/Gold Waveform) */}
        <div
          onClick={() => onNavigateTab('qr_common')}
          className="relative overflow-hidden bg-[#180f18] hover:bg-[#201320] border border-[#3d2437] hover:border-[#6a345e] rounded-2xl p-4 sm:p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[125px]"
        >
          {/* Glowing Bronze Waveform SVG */}
          <div className="absolute inset-0 pointer-events-none flex items-end opacity-40 group-hover:opacity-60 transition-opacity">
            <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="none" fill="none">
              <path
                d="M0,55 Q50,55 110,48 T220,35 T300,45"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,55 Q50,55 110,48 T220,35 T300,45 L300,70 L0,70 Z"
                fill="url(#amberWaveGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="amberWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2e1d13] border border-[#5c371d] text-[#fcd34d] flex items-center justify-center">
                <QrCode className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider">
                Showroom QR Scans
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tight">
                {totalScans}
              </span>
              <span className="text-[10.5px] font-bold text-[#fcd34d] bg-[#382013] border border-[#78350f] px-2 py-0.5 rounded-full">
                {conversionRate}% Rate
              </span>
            </div>
            <span className="text-[11px] text-[#cfb7c8] mt-1 block">
              Phone camera visits at counter
            </span>
          </div>
        </div>

        {/* Card 4: VERIFIED PHONE DIRECTORY (Emerald Waveform) */}
        <div
          onClick={handleExportDirectoryList}
          className="relative overflow-hidden bg-[#180f18] hover:bg-[#201320] border border-[#3d2437] hover:border-emerald-600/50 rounded-2xl p-4 sm:p-5 shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[125px]"
          title="Click to download verified customer directory Excel sheet"
        >
          {/* Glowing Emerald Waveform SVG */}
          <div className="absolute inset-0 pointer-events-none flex items-end opacity-40 group-hover:opacity-60 transition-opacity">
            <svg className="w-full h-16" viewBox="0 0 300 70" preserveAspectRatio="none" fill="none">
              <path
                d="M0,55 Q60,55 130,42 T230,28 T300,48"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M0,55 Q60,55 130,42 T230,28 T300,48 L300,70 L0,70 Z"
                fill="url(#waWaveGrad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="waWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#11291f] border border-[#1b5239] text-[#34d399] flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider">
                Verified Directory
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-3">
            <span className="text-3xl font-black text-white block tracking-tight">
              {broadcastReadyCustomers.length}
            </span>
            <div className="text-[11px] text-[#34d399] mt-1 flex items-center gap-1 font-semibold group-hover:underline">
              <span>Export Directory List</span>
              <Download className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. PHONE DIRECTORY HEALTH BANNER (Deep Royal Purple Velvet Gradient)
      ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#200d2e] via-[#35164d] to-[#1c0c28] border border-[#7e34a6]/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#4c1d68]/60 text-[#e9d5ff] border border-[#9333ea]/40 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5 text-[#d8b4fe]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Customer Phone List Health: <span className="text-[#34d399] font-black">{validPhonePct}% Verified</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#4c1d68] text-purple-200 border border-[#7e34a6]/60 font-semibold">
                {broadcastReadyCustomers.length} / {totalCustomers} Active
              </span>
            </div>
            <p className="text-[11px] text-[#d6c4d1] mt-0.5">
              Clean 10-digit mobile numbers formatted and verified for showroom billing, festival greetings, and invoices.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportDirectoryList}
            className="px-4 py-2 bg-[#fae2ab] hover:bg-[#f0cc85] text-[#1c1206] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Directory [.xlsx]</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. MAIN WORKSPACE: RECENT CUSTOMERS & SHOWROOM QR STANDEE
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT (2 Cols): Recent Customers & Referrals */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#160d16] rounded-2xl border border-[#392233] shadow-xl overflow-hidden">
            {/* Header & Search */}
            <div className="p-4 sm:p-5 border-b border-[#2d1b28] bg-[#120a13] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Recent Customers & Referrals</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#4a124c] text-[#f0abfc] border border-[#6b1e6e] font-bold">
                      {filteredCustomers.length}
                    </span>
                  </h2>
                  <p className="text-xs text-[#cfb7c8] mt-0.5">
                    Showing place & referral source with phone verification and quick profile view.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('customers')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#faeed4] hover:text-white bg-[#1d121c] hover:bg-[#281928] rounded-xl border border-[#482c40] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Directory</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#dfb76c]" />
                  </button>
                </div>
              </div>

              {/* Universal Search & Source Filter Pills */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#dfb76c] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Search by name, phone, place, or ref#..."
                    className="w-full pl-10 pr-9 py-2 text-xs bg-[#100911] border border-[#44283c] rounded-xl text-white placeholder-[#8f7488] focus:outline-none focus:ring-1 focus:ring-[#dfb76c] focus:border-[#dfb76c] transition-all font-medium"
                  />
                  {quickSearch && (
                    <button
                      onClick={() => setQuickSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cfb7c8] hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    onClick={() => setSourceFilter('all')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      sourceFilter === 'all'
                        ? 'bg-[#fae2ab] text-[#1a1104] shadow-sm'
                        : 'bg-[#1d121c] border border-[#3e2537] text-[#cfb7c8] hover:text-white'
                    }`}
                  >
                    All ({customers.length})
                  </button>
                  <button
                    onClick={() => setSourceFilter('today')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      sourceFilter === 'today'
                        ? 'bg-[#fae2ab] text-[#1a1104] shadow-sm'
                        : 'bg-[#1d121c] border border-[#3e2537] text-[#cfb7c8] hover:text-white'
                    }`}
                  >
                    Today ({todayCustomers.length})
                  </button>
                  <button
                    onClick={() => setSourceFilter('walkin_qr')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      sourceFilter === 'walkin_qr'
                        ? 'bg-[#fae2ab] text-[#1a1104] shadow-sm'
                        : 'bg-[#1d121c] border border-[#3e2537] text-[#cfb7c8] hover:text-white'
                    }`}
                  >
                    <QrCode className="w-3 h-3" />
                    <span>QR ({qrIntakeCount})</span>
                  </button>
                  <button
                    onClick={() => setSourceFilter('import')}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      sourceFilter === 'import'
                        ? 'bg-[#fae2ab] text-[#1a1104] shadow-sm'
                        : 'bg-[#1d121c] border border-[#3e2537] text-[#cfb7c8] hover:text-white'
                    }`}
                  >
                    Imported ({importIntakeCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Customer List Rows */}
            {filteredCustomers.length > 0 ? (
              <div className="divide-y divide-[#2d1b28] max-h-[520px] overflow-y-auto">
                {filteredCustomers.slice(0, 10).map((customer) => {
                  const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
                  const customerPlace = customer.place || customer.city;
                  return (
                    <div
                      key={customer.id}
                      onClick={() => onSelectCustomer(customer)}
                      className="p-4 hover:bg-[#1d111d] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      {/* Name & Contact Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#261327] border border-[#482c40] text-[#dfb76c] font-black text-sm flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white group-hover:text-[#faeed4] transition-colors truncate">
                              {customer.name}
                            </span>
                            {customer.source === 'walkin_qr' && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#331435] text-[#f0abfc] border border-[#522157]">
                                <QrCode className="w-2.5 h-2.5" />
                                <span>QR</span>
                              </span>
                            )}
                            {customer.source === 'import' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#331730] text-[#e8b5d8] border border-[#54254f]">
                                Import
                              </span>
                            )}
                          </div>

                          {/* Contact, Place & Referred By */}
                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#cfb7c8]">
                            <span className="font-mono text-[#faeed4] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-[#dfb76c]" />
                              <span>{customer.phone || 'No Phone'}</span>
                            </span>

                            {customerPlace && (
                              <span className="flex items-center gap-1 text-[#faeed4]">
                                <MapPin className="w-3 h-3 text-[#dfb76c]" />
                                <span>{customerPlace}</span>
                              </span>
                            )}

                            {customer.referredBy && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#f3e8ff] bg-[#2a142c] px-2 py-0.2 rounded border border-[#482c40]">
                                <UserCheck className="w-3 h-3 text-[#dfb76c]" />
                                <span>Ref: <strong>{customer.referredBy}</strong></span>
                              </span>
                            )}

                            {customer.categoryName && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#2a142c] text-[#dfb76c] border border-[#482c40]">
                                {customer.categoryName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Call and Profile Details */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-[#1d121c] hover:bg-[#281928] text-[#faeed4] hover:text-white rounded-xl border border-[#482c40] text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#dfb76c]" />
                            <span className="hidden sm:inline font-semibold">Call</span>
                          </a>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(customer);
                          }}
                          className="px-3 py-2 bg-[#261327] hover:bg-[#381a3a] text-[#faeed4] rounded-xl border border-[#482c40] text-xs font-bold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredCustomers.length > 10 && (
                  <div className="p-3 text-center bg-[#120a13] border-t border-[#2d1b28]">
                    <button
                      onClick={() => onNavigateTab('customers')}
                      className="text-xs font-bold text-[#dfb76c] hover:text-white hover:underline cursor-pointer"
                    >
                      + View all {filteredCustomers.length} customers in Full Directory →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#261327] border border-[#482c40] text-[#dfb76c] flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No Matching Customers Found</h3>
                  <p className="text-xs text-[#cfb7c8] max-w-sm mx-auto mt-1">
                    {quickSearch
                      ? `No customer in the system matches "${quickSearch}". Try checking place, phone, or name.`
                      : 'No customer records recorded yet.'}
                  </p>
                </div>
                <button
                  onClick={onOpenAddCustomer}
                  className="px-4 py-2 bg-[#fae2ab] text-[#1c1206] text-xs font-bold rounded-xl shadow-lg hover:bg-[#f0cc85] transition-colors cursor-pointer"
                >
                  + Add Walk-In Customer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT (1 Col): Showroom Quick Station (QR Standee & Preferences) */}
        <div className="space-y-4">
          {/* Showroom QR Standee Card */}
          <div className="bg-[#160d16] rounded-2xl border border-[#392233] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2a142c] text-[#dfb76c] flex items-center justify-center border border-[#482c40]">
                  <SettingsIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Showroom QR Standee</h3>
              </div>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="text-xs text-[#dfb76c] hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                title="Expand QR full screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expand</span>
              </button>
            </div>

            {/* Standee Miniature Preview */}
            <div
              onClick={() => setShowFullscreenQR(true)}
              className="p-4 bg-gradient-to-b from-[#201022] to-[#120a13] rounded-xl border border-[#482c40] text-center cursor-pointer hover:border-[#dfb76c]/60 transition-all group shadow-inner"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <img
                  src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                  alt="Giri Jewellers Crest"
                  className="w-5 h-5 object-contain"
                />
                <div className="text-[10px] font-cinzel font-bold tracking-[0.2em] text-[#fae7ba] uppercase">
                  {businessName}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#cfb7c8] mb-2.5">
                Scan to Connect
              </div>
              {qrStandeeInfo?.qrDataUrl ? (
                <div className="inline-block p-2.5 bg-white rounded-xl shadow-md group-hover:scale-105 transition-transform">
                  <img
                    src={qrStandeeInfo.qrDataUrl}
                    alt="Showroom QR Code"
                    className="w-32 h-32 object-contain"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 mx-auto bg-[#261327] rounded-xl border border-[#482c40] flex items-center justify-center text-[#dfb76c]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#dfb76c]" />
                </div>
              )}
              <p className="text-[10px] text-[#cfb7c8] mt-2">
                Counter camera registration for walk-in clients
              </p>
            </div>

            {/* Standee Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateTab('qr_common')}
                className="py-2 px-3 bg-[#1d121c] hover:bg-[#281928] text-[#faeed4] rounded-xl border border-[#482c40] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Print Standee</span>
              </button>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="py-2 px-3 bg-[#261327] hover:bg-[#381a3a] text-white rounded-xl border border-[#522157] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>

          {/* Jewellery Demands Breakdown */}
          <div className="bg-[#160d16] rounded-2xl border border-[#392233] p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2a142c] text-[#dfb76c] flex items-center justify-center border border-[#482c40]">
                  <Gem className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">Jewellery Demands</h3>
              </div>
              <button
                onClick={() => onNavigateTab('categories')}
                className="text-xs text-[#dfb76c] hover:text-white hover:underline font-semibold cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {categoryRanking.length > 0 ? (
                categoryRanking.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#faeed4] truncate">{item.name}</span>
                      <span className="font-mono text-[#dfb76c] text-[11px] font-bold">{item.count} ({item.percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#100911] rounded-full overflow-hidden border border-[#2d1b28]">
                      <div
                        className="h-full bg-gradient-to-r from-[#d9aa59] to-[#9b7331] rounded-full"
                        style={{ width: `${Math.max(item.percent, 8)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#cfb7c8] py-3 text-center">
                  Add categories or customer interests to see trends.
                </p>
              )}
            </div>
          </div>

          {/* Top Customer Locations */}
          {topPlaces.length > 0 && (
            <div className="bg-[#160d16] rounded-2xl border border-[#392233] p-4 shadow-xl space-y-2.5">
              <span className="text-[10px] font-bold text-[#dfb76c] uppercase tracking-wider block">
                Top Customer Locations
              </span>
              <div className="space-y-1.5">
                {topPlaces.map((tp, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#120a13] border border-[#2d1b28]">
                    <span className="font-semibold text-[#faeed4] flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-[#dfb76c]" />
                      <span>{tp.place}</span>
                    </span>
                    <span className="text-[#dfb76c] font-mono font-bold">{tp.count} clients</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          5. FULLSCREEN COUNTER QR MODAL
      ========================================================================= */}
      {showFullscreenQR && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowFullscreenQR(false)}
        >
          <div
            className="bg-[#160d16] border-2 border-[#dfb76c]/70 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowFullscreenQR(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#201022] hover:bg-[#301633] text-[#cfb7c8] hover:text-white border border-[#482c40] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 flex flex-col items-center">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers Crest"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-[0_0_12px_rgba(245,215,127,0.5)]"
              />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#dfb76c]">
                Official Customer Intake
              </span>
              <h2 className="font-cinzel text-2xl font-bold text-[#faeed4]">
                {businessName}
              </h2>
              <p className="text-xs text-[#cfb7c8]">
                Point any smartphone camera to register showroom visit & warranty
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl inline-block shadow-2xl">
              {qrStandeeInfo?.qrDataUrl ? (
                <img
                  src={qrStandeeInfo.qrDataUrl}
                  alt="Showroom Walk-in QR"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-[#dfb76c] animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#201022] border border-[#482c40] text-xs text-[#faeed4] font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>No app download needed • Works instantly on any camera</span>
              </div>
              <div>
                <button
                  onClick={() => {
                    setShowFullscreenQR(false);
                    onNavigateTab('qr_common');
                  }}
                  className="text-xs text-[#dfb76c] hover:text-white underline cursor-pointer"
                >
                  Print physical acrylic standee or counter display sign →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
