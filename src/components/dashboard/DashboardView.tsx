import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  QrCode,
  Plus,
  Search,
  ArrowRight,
  Shield,
  Calendar,
  Upload,
  Download,
  X,
  Maximize2
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

  // Category breakdown
  const categoryRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const cat = c.categoryName || 'General';
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
    <div className="space-y-6">
      {/* 1. Header Command Banner */}
      <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 lg:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-12 h-12 object-contain shrink-0 mt-0.5"
            />
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#112318] border border-[#1b4329] text-[10.5px] font-medium text-[#4ade80]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Showroom Active</span>
                </span>
                <span className="text-xs text-[#717886] font-medium">
                  {storeSettings?.branchName || 'Trivandrum Showroom'}
                </span>
              </div>
              <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.1em] text-[#e8c86d] uppercase">
                {businessName}
              </h1>
              <p className="text-xs text-[#9aa0a6] mt-1">
                Showroom walk-in registry, customer directory, and counter intake portal.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('import')}
              className="px-3 py-2 bg-[#1b1e27] hover:bg-[#222632] text-[#d1d5db] text-xs font-medium rounded-lg border border-[#272b36] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Import Data</span>
            </button>
            <button
              onClick={() => setShowFullscreenQR(true)}
              className="px-3 py-2 bg-[#1b1e27] hover:bg-[#222632] text-[#d1d5db] text-xs font-medium rounded-lg border border-[#272b36] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Counter QR</span>
            </button>
            <button
              onClick={onOpenAddCustomer}
              className="px-3.5 py-2 bg-[#d4af37] hover:bg-[#e0bc45] text-[#14161d] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#14161d] stroke-[2.5]" />
              <span>New Walk-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-[#14161d] hover:bg-[#181a23] border border-[#232732] hover:border-[#303544] rounded-xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a919e] uppercase tracking-wider">
              Total Customers
            </span>
            <Users className="w-4 h-4 text-[#8a919e]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {totalCustomers}
            </span>
            <div className="text-[11px] text-[#717886] mt-1 flex items-center gap-1.5">
              <span>{qrIntakeCount} QR</span>
              <span>•</span>
              <span>{manualIntakeCount} Staff</span>
              <span>•</span>
              <span>{importIntakeCount} Import</span>
            </div>
          </div>
        </div>

        {/* Today's Footfall */}
        <div className="bg-[#14161d] border border-[#232732] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a919e] uppercase tracking-wider">
              Today's Footfall
            </span>
            <Calendar className="w-4 h-4 text-[#4ade80]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#4ade80] tracking-tight">
              {todayCustomers.length}
            </span>
            <p className="text-[11px] text-[#717886] mt-1">
              New customer entries recorded today
            </p>
          </div>
        </div>

        {/* Showroom QR Intake */}
        <div
          onClick={() => onNavigateTab('qr_common')}
          className="bg-[#14161d] hover:bg-[#181a23] border border-[#232732] hover:border-[#303544] rounded-xl p-5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a919e] uppercase tracking-wider">
              Showroom QR Visits
            </span>
            <QrCode className="w-4 h-4 text-[#d4af37]" />
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                {totalScans}
              </span>
              <span className="text-[11px] font-medium text-[#d4af37]">
                {conversionRate}% completion
              </span>
            </div>
            <p className="text-[11px] text-[#717886] mt-1">
              Counter standee scans
            </p>
          </div>
        </div>

        {/* Verified Directory List */}
        <div
          onClick={handleExportDirectoryList}
          className="bg-[#14161d] hover:bg-[#181a23] border border-[#232732] hover:border-[#303544] rounded-xl p-5 transition-colors cursor-pointer"
          title="Click to download Excel sheet"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8a919e] uppercase tracking-wider">
              Verified Contacts
            </span>
            <Shield className="w-4 h-4 text-[#8a919e]" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {broadcastReadyCustomers.length}
            </span>
            <p className="text-[11px] text-[#717886] mt-1">
              Valid phone numbers ready for export
            </p>
          </div>
        </div>
      </div>

      {/* 3. Operational Overview: Counter Intake + Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Walk-Ins List (2 cols wide) */}
        <div className="lg:col-span-2 bg-[#14161d] border border-[#232732] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Customer Registry</h2>
              <p className="text-xs text-[#717886]">Counter visits and recent registrations</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${sourceFilter === 'all'
                    ? 'bg-[#1e222b] text-white font-medium'
                    : 'text-[#8a919e] hover:text-white'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setSourceFilter('today')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${sourceFilter === 'today'
                    ? 'bg-[#1e222b] text-white font-medium'
                    : 'text-[#8a919e] hover:text-white'
                  }`}
              >
                Today
              </button>
              <button
                onClick={() => setSourceFilter('walkin_qr')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${sourceFilter === 'walkin_qr'
                    ? 'bg-[#1e222b] text-white font-medium'
                    : 'text-[#8a919e] hover:text-white'
                  }`}
              >
                QR Intake
              </button>
              <button
                onClick={() => setSourceFilter('manual')}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${sourceFilter === 'manual'
                    ? 'bg-[#1e222b] text-white font-medium'
                    : 'text-[#8a919e] hover:text-white'
                  }`}
              >
                Staff Entry
              </button>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6b7280] absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Search name, phone, town, or referral..."
              className="w-full pl-9 pr-4 py-2 bg-[#0e1014] border border-[#232732] rounded-lg text-xs text-white placeholder:text-[#525866] focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Customer Records Table */}
          <div className="border border-[#1f222a] rounded-xl overflow-hidden">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-[#4b5260] mx-auto" />
                <p className="text-xs text-[#8a919e]">No customer records match your filter.</p>
                <button
                  onClick={onOpenAddCustomer}
                  className="text-xs text-[#d4af37] hover:underline cursor-pointer font-medium"
                >
                  Add a walk-in customer
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0e1014] text-[#717886] font-medium border-b border-[#1f222a]">
                    <tr>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f222a]">
                    {filteredCustomers.slice(0, 8).map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => onSelectCustomer(c)}
                        className="hover:bg-[#1a1d26] transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-white group-hover:text-[#e8c86d]">
                            {c.name}
                          </span>
                          {c.referredBy && (
                            <span className="block text-[10px] text-[#717886]">
                              Ref: {c.referredBy}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-[#c0c6d2] font-mono">
                          {c.phone || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-[#8a919e]">
                          {c.place || c.city || '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10.5px] bg-[#1a1d26] text-[#c0c6d2] border border-[#252832]">
                            {c.categoryName || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`text-[10px] font-medium ${c.source === 'walkin_qr'
                              ? 'text-[#d4af37]'
                              : c.source === 'import'
                                ? 'text-[#8a919e]'
                                : 'text-[#4ade80]'
                            }`}>
                            {c.source === 'walkin_qr' ? 'QR Standee' : c.source === 'import' ? 'Imported' : 'Counter'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {filteredCustomers.length > 8 && (
            <div className="text-center pt-1">
              <button
                onClick={() => onNavigateTab('customers')}
                className="text-xs text-[#d4af37] hover:underline cursor-pointer font-medium inline-flex items-center gap-1"
              >
                <span>View all {filteredCustomers.length} customer records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Showroom QR Standee & Demographics */}
        <div className="space-y-6">
          {/* Counter QR Standee Widget */}
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Counter QR Standee
                </h3>
                <p className="text-[11px] text-[#717886]">Customer self-intake scan</p>
              </div>
              <button
                onClick={() => setShowFullscreenQR(true)}
                className="p-1 rounded text-[#8a919e] hover:text-white hover:bg-[#1e222b] transition-colors cursor-pointer"
                title="Fullscreen QR"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {qrStandeeInfo?.qrDataUrl ? (
              <div className="flex flex-col items-center p-4 bg-[#0e1014] border border-[#232732] rounded-xl">
                <img
                  src={qrStandeeInfo.qrDataUrl}
                  alt="Customer Intake QR Code"
                  className="w-36 h-36 bg-white p-2 rounded-lg"
                />
                <p className="text-[11px] text-[#8a919e] mt-2 text-center">
                  Walk-in visitors scan to register counter preferences
                </p>
              </div>
            ) : (
              <div className="p-6 bg-[#0e1014] rounded-xl text-center text-xs text-[#717886]">
                QR preview loading...
              </div>
            )}

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => onNavigateTab('qr_common')}
                className="w-full py-2 text-xs font-medium text-[#c0c6d2] hover:text-white bg-[#1b1e27] hover:bg-[#222632] rounded-lg border border-[#272b36] transition-colors cursor-pointer text-center"
              >
                Open QR Center
              </button>
            </div>
          </div>

          {/* Customer Location & Category Distribution */}
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Top Customer Locations
              </h3>
              <p className="text-[11px] text-[#717886]">Leading towns & residential hubs</p>
            </div>

            {topPlaces.length === 0 ? (
              <p className="text-xs text-[#717886]">No location data recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {topPlaces.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#1f222a] last:border-0">
                    <span className="text-[#c0c6d2]">{item.place}</span>
                    <span className="text-[11px] font-semibold text-[#8a919e]">
                      {item.count} customers
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[#1f222a]">
              <h4 className="text-[11px] font-semibold text-[#8a919e] uppercase tracking-wider mb-2">
                Category Interest
              </h4>
              <div className="space-y-1.5">
                {categoryRanking.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#c0c6d2]">
                      <span>{cat.name}</span>
                      <span className="text-[11px] text-[#717886]">{cat.count} ({cat.percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#1f222a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#d4af37]"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {showFullscreenQR && qrStandeeInfo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#14161d] border border-[#232732] rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#8a919e] uppercase tracking-wider">
                Counter Scan Display
              </span>
              <button
                onClick={() => setShowFullscreenQR(false)}
                className="p-1 rounded text-[#8a919e] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-xl inline-block">
              <img
                src={qrStandeeInfo.qrDataUrl}
                alt="Fullscreen QR"
                className="w-56 h-56 mx-auto"
              />
            </div>

            <div>
              <h4 className="font-cinzel text-base font-semibold text-[#e8c86d] uppercase">
                {businessName}
              </h4>
              <p className="text-xs text-[#8a919e] mt-0.5">
                Scan with phone camera to record counter visit
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
