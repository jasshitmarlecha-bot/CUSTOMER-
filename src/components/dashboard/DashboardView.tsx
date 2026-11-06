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
  ExternalLink,
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
  const qrIntakeCount = customers.filter(c => c.source === 'walkin_qr').length;
  const staffIntakeCount = customers.filter(c => c.source === 'manual').length;
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
  const validPhonePercent = totalCustomers > 0 ? Math.round((broadcastReadyCustomers.length / totalCustomers) * 100) : 100;

  // Filtered customers for instant counter desk
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
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
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesCity && !matchesReferral && !matchesCat && !matchesNotes) {
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hero Command Banner (Matching Screenshot Exactly) */}
      <div className="bg-[#fffbf8] border border-[#ede0d6] rounded-[26px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(42,7,23,0.03)] relative overflow-hidden">
        {/* Right side luxury burgundy silk ring visual */}
        <div className="hidden md:block absolute top-0 right-0 h-full w-[46%] lg:w-[48%] pointer-events-none select-none overflow-hidden">
          <img
            src="/assets/aistudio/burgundy_silk_ring.png"
            alt="Diamond Ring on Velvet Silk"
            className="h-full w-full object-cover object-right"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#fffbf8] to-transparent pointer-events-none" />
        </div>

        {/* Left side Content */}
        <div className="relative z-10 max-w-xl">
          {/* Top Status & Showroom Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4ee] border border-[#cbe4d4] text-xs font-bold text-[#134327]">
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
              <span>Showroom Counter Active</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf0e4] border border-[#edd5bf] text-xs font-bold text-[#4a2e1d]">
              <Gem className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>{storeSettings?.branchName || 'Trivandrum Flagship Showroom'}</span>
            </span>
          </div>

          {/* Operator line */}
          <p className="text-xs text-[#876876]">
            Operator: <strong className="text-[#2a0717] font-bold">Store Manager</strong> (Store Admin)
          </p>

          {/* Large Title */}
          <h1 className="font-cinzel text-3xl sm:text-4xl font-extrabold tracking-wide text-[#2a0717] mt-1">
            {businessName || 'GIRI JEWELLERS'}
          </h1>

          {/* Tagline Divider */}
          <div className="flex items-center gap-3 my-1.5">
            <div className="h-[1px] w-8 bg-[#dfb76c]" />
            <span className="font-serif text-[11px] sm:text-xs tracking-[0.25em] text-[#a4687d] uppercase font-bold">
              TRUST • TRADITION • TIMELESS ELEGANCE
            </span>
            <div className="h-[1px] w-8 bg-[#dfb76c]" />
          </div>

          {/* Subtitle Description */}
          <p className="text-xs sm:text-[12.5px] text-[#6d515e] leading-relaxed max-w-lg mt-1 font-normal">
            Unified showroom intake, customer referral records, phone directory health, and instant WhatsApp customer outreach.
          </p>

          {/* Quick Walk-In Entry Pill Button */}
          <div className="pt-4">
            <button
              onClick={onOpenAddCustomer}
              className="px-5 py-2.5 rounded-full bg-[#3d0c22] hover:bg-[#521130] active:scale-95 text-[#ffffff] text-xs font-bold shadow-md shadow-[#3d0c22]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#ffffff] stroke-[2.2]" />
              <span>Quick Walk-In Entry</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#ffffff]" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards (4 Grid Cards from Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL CUSTOMERS */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fae8ee] text-[#4d102e] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[#6d4c5c] tracking-wider uppercase">
                TOTAL CUSTOMERS
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#2a0717] tracking-tight my-1">
              {totalCustomers}
            </div>
          </div>
          <div className="text-xs font-semibold text-[#8a6877] mt-2">
            ↗ {qrIntakeCount} QR • {staffIntakeCount} Staff • {importIntakeCount} Import
          </div>

          {/* Soft rose silk wave */}
          <svg className="absolute bottom-0 right-0 w-28 h-16 pointer-events-none opacity-40" viewBox="0 0 100 60" fill="none">
            <path d="M0 50 Q 50 15 100 35 L 100 60 L 0 60 Z" fill="#fae8ee" />
          </svg>
        </div>

        {/* Card 2: TODAY'S FOOTFALL */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#fdf0e2] text-[#b87333] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[#6d4c5c] tracking-wider uppercase">
                TODAY'S FOOTFALL
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#2a0717] tracking-tight my-1">
              {todayCustomers.length}
            </div>
          </div>
          <div className="text-xs font-semibold text-[#8a6877] mt-2">
            New walk-in visitors today
          </div>

          {/* Soft amber wave */}
          <svg className="absolute bottom-0 right-0 w-28 h-16 pointer-events-none opacity-40" viewBox="0 0 100 60" fill="none">
            <path d="M0 50 Q 50 15 100 35 L 100 60 L 0 60 Z" fill="#fdf0e2" />
          </svg>
        </div>

        {/* Card 3: SHOWROOM QR SCANS */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#f3e8f8] text-[#6b21a8] flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[#6d4c5c] tracking-wider uppercase">
                SHOWROOM QR SCANS
              </span>
            </div>
            <div className="flex items-baseline gap-2 my-1">
              <span className="text-3xl font-extrabold text-[#2a0717] tracking-tight">{totalScans}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f3e8f8] text-[#6b21a8]">
                {conversionRate}% Rate
              </span>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#8a6877] mt-2">
            Phone camera visits at counter
          </div>

          {/* Soft lavender wave */}
          <svg className="absolute bottom-0 right-0 w-28 h-16 pointer-events-none opacity-40" viewBox="0 0 100 60" fill="none">
            <path d="M0 50 Q 50 15 100 35 L 100 60 L 0 60 Z" fill="#f3e8f8" />
          </svg>
        </div>

        {/* Card 4: WHATSAPP REACH */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-[#6d4c5c] tracking-wider uppercase">
                WHATSAPP REACH
              </span>
            </div>
            <div className="text-3xl font-extrabold text-[#2a0717] tracking-tight my-1">
              {broadcastReadyCustomers.length}
            </div>
          </div>
          <div className="text-xs mt-2">
            <button
              onClick={handleExportDirectoryList}
              className="text-[#137333] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Export WhatsApp List</span>
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Soft mint wave */}
          <svg className="absolute bottom-0 right-0 w-28 h-16 pointer-events-none opacity-40" viewBox="0 0 100 60" fill="none">
            <path d="M0 50 Q 50 15 100 35 L 100 60 L 0 60 Z" fill="#e6f4ea" />
          </svg>
        </div>
      </div>

      {/* 3. Customer Phone List Health Banner (Row 3 from Screenshot) */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#eaf4ee] via-[#f1f8f3] to-[#eaf4ee] border border-[#cbe4d4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1b5e39] text-[#ffffff] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-[#ffffff]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-[#134327]">
                Customer Phone List Health: {validPhonePercent}% Verified
              </span>
              <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#ffffff] text-[#134327] border border-[#b2d8be]">
                {broadcastReadyCustomers.length} / {totalCustomers} Active
              </span>
            </div>
            <p className="text-xs text-[#406850] mt-0.5 font-normal">
              Clean 10-digit mobile numbers formatted and verified for instant WhatsApp updates, festival greetings, and invoices.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportDirectoryList}
          className="px-5 py-2.5 rounded-full bg-[#3d0c22] hover:bg-[#521130] active:scale-95 text-[#ffffff] text-xs font-bold flex items-center gap-2 shadow-md shadow-[#3d0c22]/20 transition-all shrink-0 cursor-pointer self-start md:self-center"
        >
          <Download className="w-4 h-4 text-[#ffffff]" />
          <span>Download WhatsApp (.xlsx)</span>
        </button>
      </div>

      {/* 4. Bottom Section: Recent Customers Table & QR Standee (Row 4 from Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Customers & Referrals (2 Columns) */}
        <div className="lg:col-span-2 bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#2a0717]">
                  Recent Customers & Referrals
                </h3>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#f4e2d8] text-[#3d0c22]">
                  {customers.length}
                </span>
              </div>
              <p className="text-xs text-[#876876] mt-0.5 font-normal">
                Showing place & referral source with 1-click WhatsApp chat and quick edit.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('customers')}
              className="px-4 py-1.5 rounded-full bg-[#fae8dc] hover:bg-[#f5dbc9] text-[#3d0c22] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-center shadow-xs"
            >
              <span>Full Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Bar & Filter Pills (Matching Screenshot Exactly) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8a6877] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search by name, phone, place, or ref#"
                className="w-full pl-9 pr-4 py-2 bg-[#ffffff] border border-[#ebdcd3] rounded-full text-xs text-[#2a0717] placeholder:text-[#8a6877] font-medium focus:outline-none focus:border-[#3d0c22]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer shrink-0 ${
                  sourceFilter === 'all'
                    ? 'bg-[#3d0c22] text-[#ffffff] font-bold shadow-xs'
                    : 'bg-[#ffffff] hover:bg-[#fcf3ed] text-[#5c3e4c] border border-[#ebdcd3] font-semibold'
                }`}
              >
                All ({totalCustomers})
              </button>

              <button
                onClick={() => setSourceFilter('today')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shrink-0 ${
                  sourceFilter === 'today'
                    ? 'bg-[#3d0c22] text-[#ffffff] font-bold shadow-xs'
                    : 'bg-[#ffffff] hover:bg-[#fcf3ed] text-[#5c3e4c] border border-[#ebdcd3] font-semibold'
                }`}
              >
                Today ({todayCustomers.length})
              </button>

              <button
                onClick={() => setSourceFilter('walkin_qr')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shrink-0 ${
                  sourceFilter === 'walkin_qr'
                    ? 'bg-[#3d0c22] text-[#ffffff] font-bold shadow-xs'
                    : 'bg-[#ffffff] hover:bg-[#fcf3ed] text-[#5c3e4c] border border-[#ebdcd3] font-semibold'
                }`}
              >
                QR ({qrIntakeCount})
              </button>

              <button
                onClick={() => setSourceFilter('import')}
                className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shrink-0 ${
                  sourceFilter === 'import'
                    ? 'bg-[#3d0c22] text-[#ffffff] font-bold shadow-xs'
                    : 'bg-[#ffffff] hover:bg-[#fcf3ed] text-[#5c3e4c] border border-[#ebdcd3] font-semibold'
                }`}
              >
                Imported ({importIntakeCount})
              </button>
            </div>
          </div>

          {/* Customer Records Table */}
          <div className="border border-[#ede0d6] rounded-xl overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-[#8a6877] mx-auto opacity-50" />
                <p className="text-xs text-[#876876]">No customer records match your filter.</p>
                <button
                  onClick={onOpenAddCustomer}
                  className="text-xs text-[#3d0c22] hover:underline cursor-pointer font-bold"
                >
                  Add a walk-in customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#faf2ec] text-[#6d4c5c] font-bold border-b border-[#ebdcd3]">
                    <tr>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2ebd9]">
                    {filteredCustomers.slice(0, 6).map((c) => {
                      const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-[#fcf6f2] transition-colors group"
                        >
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#2a0717] group-hover:text-[#3d0c22]">
                              {c.name}
                            </span>
                            {c.referredBy && (
                              <span className="block text-[10px] text-[#876876] font-medium">
                                Ref: {c.referredBy}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#2a0717] font-mono font-bold">
                            {c.phone || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-[#5c3e4c] font-medium">
                            {c.place || c.city || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#fbf0e4] text-[#4a2e1d] border border-[#edd5bf]">
                              {c.categoryName || 'General'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1.5">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#eaf4ee] text-[#134327] border border-[#cbe4d4] hover:bg-[#d8edd0] transition-colors"
                                title="Open WhatsApp chat"
                              >
                                <span>WhatsApp</span>
                              </a>
                            )}
                            <button
                              onClick={() => onSelectCustomer(c)}
                              className="p-1 rounded-full text-[#876876] hover:text-[#2a0717] hover:bg-[#fae8dc] transition-colors cursor-pointer"
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

        {/* Right: Showroom QR Standee Card (1 Column) */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-[0_2px_12px_rgba(42,7,23,0.02)] space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3d0c22]" />
                <h3 className="text-xs font-bold text-[#2a0717] uppercase tracking-wider">
                  Showroom QR Standee
                </h3>
              </div>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#5c3e4c] hover:text-[#2a0717] bg-[#faf2ec] hover:bg-[#f5e4da] border border-[#ebdcd3] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Expand</span>
              </button>
            </div>

            {/* Standee Preview Card (Matching Screenshot) */}
            <div className="p-4 bg-gradient-to-b from-[#fdfbf9] to-[#f7efe8] border border-[#ebdcd3] rounded-xl flex items-center justify-between gap-3 shadow-inner">
              <div className="p-2 bg-white rounded-lg shadow-xs shrink-0 border border-[#ede0d6]">
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
                <div className="w-6 h-6 mx-auto mb-1 text-[#dfb76c]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 3h12l4 6-10 12L2 9z" />
                    <path d="M11 3v18" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h4 className="font-cinzel text-xs font-black text-[#2a0717] uppercase leading-tight">
                  {businessName || 'GIRI JEWELLERS'}
                </h4>
                <p className="text-[10px] text-[#876876] mt-0.5 font-bold">
                  Scan to Connect
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('qr_common')}
            className="w-full py-2 rounded-full text-xs font-bold text-[#2a0717] bg-[#faf2ec] hover:bg-[#f5e4da] border border-[#ebdcd3] transition-colors cursor-pointer text-center"
          >
            Open Standee Print Center
          </button>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showFullscreenQR && qrStandeeInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#718079] uppercase tracking-wider">
                Showroom Standee Display
              </span>
              <button
                onClick={() => setShowFullscreenQR(false)}
                className="p-1 rounded-full text-[#718079] hover:text-[#14221d] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-sm border border-[#ede3d3]">
              <img
                src={qrStandeeInfo.qrDataUrl}
                alt="Fullscreen QR"
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div>
              <h4 className="font-cinzel text-base font-bold text-[#14221d] uppercase">
                {businessName}
              </h4>
              <p className="text-xs text-[#718079] mt-0.5">
                Scan with phone camera to register counter visit
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
