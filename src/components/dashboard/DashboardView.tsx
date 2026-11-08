import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  QrCode,
  Search,
  ArrowRight,
  ShieldCheck,
  Calendar,
  MessageSquare,
  Download,
  X,
  Maximize2,
  Gem,
  UserPlus,
  Edit2
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

  // Metrics calculation
  const totalCustomers = customers.length;
  const qrIntakeCount = customers.filter((c) => c.source === 'walkin_qr').length;
  const staffIntakeCount = customers.filter((c) => c.source === 'manual').length;
  const importIntakeCount = customers.filter((c) => c.source === 'import').length;
  const totalScans = qrAnalytics?.totalScans || 0;
  const conversionRate =
    qrAnalytics?.scanToRegRate || (totalScans > 0 ? Math.round((qrIntakeCount / totalScans) * 100) : 0);

  // Today's customers
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayCustomers = customers.filter((c) => {
    if (!c.createdAt) return false;
    return c.createdAt.startsWith(todayDateStr);
  });

  // Reachable verified phone count for directory & billing
  const broadcastReadyCustomers = customers.filter(
    (c) => c.phone && c.phone.replace(/\D/g, '').length >= 7
  );
  const validPhonePercent =
    totalCustomers > 0 ? Math.round((broadcastReadyCustomers.length / totalCustomers) * 100) : 100;

  // Filtered customers for instant counter desk
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (sourceFilter === 'today') {
        if (!c.createdAt || !c.createdAt.startsWith(todayDateStr)) return false;
      } else if (sourceFilter !== 'all') {
        if (c.source !== sourceFilter) return false;
      }
      if (quickSearch.trim()) {
        const q = quickSearch.toLowerCase().trim();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesCity = c.city?.toLowerCase().includes(q) || c.place?.toLowerCase().includes(q);
        const matchesReferral = c.referredBy?.toLowerCase().includes(q);
        const matchesCat = c.categoryName?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesPhone &&
          !matchesEmail &&
          !matchesCity &&
          !matchesReferral &&
          !matchesCat &&
          !matchesNotes
        ) {
          return false;
        }
      }
      return true;
    });
  }, [customers, sourceFilter, quickSearch, todayDateStr]);

  // Customer Directory Exporter (Excel .xlsx)
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
        'Intake Channel':
          c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Counter Staff'
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
    XLSX.writeFile(
      workbook,
      `${businessName.replace(/\s+/g, '_')}_Customer_Directory_${todayDateStr}.xlsx`
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* 1. Hero Command Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden border border-orange-500/20 shadow-2xl">
        {/* Right side luxury velvet & diamond ring visual */}
        <div className="hidden md:block absolute top-0 right-0 h-full w-[46%] lg:w-[48%] pointer-events-none select-none overflow-hidden">
          <img
            src="/assets/aistudio/burgundy_silk_ring.png"
            alt="Diamond Ring on Velvet Silk"
            className="h-full w-full object-cover object-right opacity-90"
          />
          <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#121216] via-[#121216]/80 to-transparent pointer-events-none" />
        </div>

        {/* Left side Content */}
        <div className="relative z-10 max-w-xl">
          {/* Top Status & Showroom Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Showroom Counter Active</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-xs font-semibold text-orange-400">
              <Gem className="w-3.5 h-3.5 text-amber-400" />
              <span>{storeSettings?.branchName || 'Trivandrum Flagship Showroom'}</span>
            </span>
          </div>

          {/* Operator line */}
          <p className="text-xs text-neutral-400">
            Operator: <strong className="text-neutral-200 font-semibold">{currentUser?.name || 'Store Manager'}</strong> ({currentUser?.role === 'admin' ? 'Store Admin' : 'Staff'})
          </p>

          {/* Large Title */}
          <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold tracking-wide gold-gradient-text mt-1.5">
            {businessName || 'GIRI JEWELLERS'}
          </h1>

          {/* Tagline Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="h-[1px] w-8 bg-gradient-to-r from-amber-400 to-orange-500" />
            <span className="font-serif text-[11px] sm:text-xs tracking-[0.25em] text-amber-300/80 uppercase font-bold">
              TRUST • TRADITION • TIMELESS ELEGANCE
            </span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-amber-400 to-orange-500" />
          </div>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed max-w-lg mt-1 font-normal">
            Unified showroom intake, customer referral records, phone directory health, and instant WhatsApp customer outreach.
          </p>

          {/* Quick Walk-In Entry Pill Button */}
          <div className="pt-5">
            <button
              onClick={onOpenAddCustomer}
              className="glow-btn px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-white stroke-[2.2]" />
              <span>Quick Walk-In Entry</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL CUSTOMERS */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/15 hover:border-orange-500/35 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/25 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
                TOTAL CUSTOMERS
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight my-2">
              {totalCustomers}
            </div>
          </div>
          <div className="text-xs font-medium text-neutral-400 mt-2">
            ↗ {qrIntakeCount} QR • {staffIntakeCount} Staff • {importIntakeCount} Import
          </div>
        </div>

        {/* Card 2: TODAY'S FOOTFALL */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/15 hover:border-orange-500/35 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
                TODAY'S FOOTFALL
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight my-2">
              {todayCustomers.length}
            </div>
          </div>
          <div className="text-xs font-medium text-neutral-400 mt-2">
            New walk-in visitors today
          </div>
        </div>

        {/* Card 3: SHOWROOM QR SCANS */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/15 hover:border-orange-500/35 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/25 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
                SHOWROOM QR SCANS
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">{totalScans}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {conversionRate}% Rate
              </span>
            </div>
          </div>
          <div className="text-xs font-medium text-neutral-400 mt-2">
            Phone camera visits at counter
          </div>
        </div>

        {/* Card 4: WHATSAPP REACH */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/15 hover:border-orange-500/35 transition-all shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-neutral-400 tracking-wider uppercase">
                WHATSAPP REACH
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight my-2">
              {broadcastReadyCustomers.length}
            </div>
          </div>
          <div className="text-xs mt-2">
            <button
              onClick={handleExportDirectoryList}
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Export WhatsApp List</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Customer Phone List Health Banner */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-emerald-300">
                Customer Phone List Health: {validPhonePercent}% Verified
              </span>
              <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {broadcastReadyCustomers.length} / {totalCustomers} Active
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5 font-normal">
              Clean 10-digit mobile numbers formatted and verified for instant WhatsApp updates, festival greetings, and invoices.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportDirectoryList}
          className="glow-btn px-5 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all shrink-0 cursor-pointer self-start md:self-center"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Download WhatsApp (.xlsx)</span>
        </button>
      </div>

      {/* 4. Bottom Section: Recent Customers Table & QR Standee */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Customers & Referrals (2 Columns) */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-orange-500/15 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-100">
                  Recent Customers & Referrals
                </h3>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {customers.length}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-normal">
                Showing place & referral source with 1-click WhatsApp chat and quick edit.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('customers')}
              className="px-4 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center shadow-xs"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Bar & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search by name, phone, place, or ref#"
                className="w-full pl-9 pr-4 py-2 bg-neutral-900/80 border border-neutral-700/70 focus:border-orange-500 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${sourceFilter === 'all'
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium'
                  }`}
              >
                All ({totalCustomers})
              </button>

              <button
                onClick={() => setSourceFilter('today')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${sourceFilter === 'today'
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium'
                  }`}
              >
                Today ({todayCustomers.length})
              </button>

              <button
                onClick={() => setSourceFilter('walkin_qr')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${sourceFilter === 'walkin_qr'
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium'
                  }`}
              >
                QR ({qrIntakeCount})
              </button>

              <button
                onClick={() => setSourceFilter('import')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${sourceFilter === 'import'
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25'
                    : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 border border-neutral-700/60 font-medium'
                  }`}
              >
                Imported ({importIntakeCount})
              </button>
            </div>
          </div>

          {/* Customer Records Table */}
          <div className="border border-neutral-800/80 rounded-xl overflow-hidden bg-neutral-950/40">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs text-neutral-400">No customer records match your filter.</p>
                <button
                  onClick={onOpenAddCustomer}
                  className="text-xs text-orange-400 hover:underline cursor-pointer font-bold"
                >
                  Add a walk-in customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/80 text-neutral-400 font-bold border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                    {filteredCustomers.slice(0, 6).map((c) => {
                      const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-neutral-800/40 transition-colors group"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-neutral-100 group-hover:text-orange-400 transition-colors">
                              {c.name}
                            </span>
                            {c.referredBy && (
                              <span className="block text-[10px] text-neutral-400 font-medium">
                                Ref: {c.referredBy}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-amber-400 font-mono font-bold">
                            {c.phone || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-neutral-400 font-medium">
                            {c.place || c.city || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/25">
                              {c.categoryName || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                title="Open WhatsApp chat"
                              >
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              onClick={() => onSelectCustomer(c)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Edit Customer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Showroom QR Standee Card */}
        <div className="glass-panel p-5 rounded-2xl border border-orange-500/15 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-neutral-100 uppercase tracking-wider">
                  Showroom QR Standee
                </h3>
              </div>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand</span>
              </button>
            </div>

            {/* Standee Preview Card */}
            <div className="p-4 bg-neutral-950/70 border border-orange-500/20 rounded-xl flex items-center justify-between gap-3 shadow-inner">
              <div className="p-2 bg-white rounded-lg shadow-md shrink-0 border border-neutral-700">
                {qrStandeeInfo?.qrDataUrl ? (
                  <img
                    src={qrStandeeInfo.qrDataUrl}
                    alt="Intake QR Code"
                    className="w-20 h-20"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                    QR
                  </div>
                )}
              </div>

              <div className="text-center flex-1 pr-1">
                <div className="w-6 h-6 mx-auto mb-1 text-amber-400">
                  <Gem className="w-5 h-5 mx-auto" />
                </div>
                <h4 className="font-cinzel text-xs font-bold gold-gradient-text uppercase leading-tight">
                  {businessName || 'GIRI JEWELLERS'}
                </h4>
                <p className="text-[10px] text-neutral-400 mt-0.5 font-bold">
                  Scan to Connect
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('qr_common')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold text-neutral-200 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-orange-500/30 transition-colors cursor-pointer text-center"
          >
            Open Standee Print Center
          </button>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showFullscreenQR && qrStandeeInfo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel border border-orange-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Showroom Standee Display
              </span>
              <button
                onClick={() => setShowFullscreenQR(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-lg border border-neutral-700">
              <img
                src={qrStandeeInfo.qrDataUrl}
                alt="Fullscreen QR"
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div>
              <h4 className="font-cinzel text-base font-bold gold-gradient-text uppercase">
                {businessName}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Scan with phone camera to register counter visit
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
