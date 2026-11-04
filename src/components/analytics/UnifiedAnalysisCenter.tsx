import React, { useState, useEffect } from 'react';
import {
  Users,
  QrCode,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Tag,
  MapPin,
  Clock,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Phone,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Category, QRAnalyticsData, DataQualitySummary, DuplicateGroup } from '../../types/index.ts';
import { getQRAnalytics, getQualitySummary, getDuplicates, cleanCustomerData } from '../../api/client.ts';

interface UnifiedAnalysisCenterProps {
  customers: Customer[];
  categories: Category[];
  initialSection?: string;
  onRefreshData?: () => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (id: string) => Promise<void>;
}

export const UnifiedAnalysisCenter: React.FC<UnifiedAnalysisCenterProps> = ({
  customers,
  categories,
  onRefreshData,
  onEditCustomer
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days' | 'today'>('all');
  const [qrAnalytics, setQrAnalytics] = useState<QRAnalyticsData | null>(null);
  const [qualitySummary, setQualitySummary] = useState<DataQualitySummary | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qrData, qualityData, dupsData] = await Promise.all([
        getQRAnalytics(timeRange).catch(() => null),
        getQualitySummary().catch(() => null),
        getDuplicates().catch(() => [])
      ]);
      if (qrData) setQrAnalytics(qrData);
      if (qualityData) setQualitySummary(qualityData);
      if (dupsData) setDuplicates(dupsData);
    } catch (err) {
      console.warn('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoClean = async () => {
    setIsCleaning(true);
    setCleanMessage(null);
    try {
      const res = await cleanCustomerData();
      setCleanMessage(`Data cleaning completed! Standardized ${res.modifiedCount} customer records.`);
      await loadData();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setCleanMessage(`Cleaning error: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  // Export clean verified phone list for showroom communications
  const handleExportVerifiedPhoneList = () => {
    const validCustomers = customers.filter(c => c.phone && c.phone.trim().length >= 7);
    if (validCustomers.length === 0) return;

    const dataToExport = validCustomers.map((c, index) => {
      const cleanPhone = c.phone.replace(/\D/g, '');
      return {
        'S.No': index + 1,
        'Customer Name': c.name || 'Valued Customer',
        'Mobile Phone': cleanPhone.length === 10 ? `+91 ${cleanPhone}` : c.phone,
        'Customer Place': c.place || c.city || '-',
        'Referred By': c.referredBy || 'Direct Walk-in',
        'Jewelry Interest': c.categoryName || 'General',
        'Status': c.status
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verified_Phone_Directory');
    XLSX.writeFile(workbook, `GIRI_JEWELLERS_Verified_Phone_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalCustomers = customers.length;
  const qrIntakeCount = customers.filter(c => c.source === 'walkin_qr').length;
  const manualCount = customers.filter(c => c.source === 'manual').length;
  const importCount = customers.filter(c => c.source === 'import').length;

  const totalScans = qrAnalytics?.totalScans || 0;
  const completedScans = qrAnalytics?.totalCompleted || qrIntakeCount;
  const conversionRate = qrAnalytics?.scanToRegRate || (totalScans > 0 ? Math.round((completedScans / totalScans) * 100) : 0);

  // Group by place
  const placeMap = new Map<string, number>();
  customers.forEach(c => {
    const pl = (c.place || c.city || '').trim();
    if (pl) {
      placeMap.set(pl, (placeMap.get(pl) || 0) + 1);
    }
  });
  const topPlaces = Array.from(placeMap.entries())
    .map(([place, count]) => ({ place, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Group by referral source
  const referralMap = new Map<string, number>();
  customers.forEach(c => {
    const ref = (c.referredBy || '').trim();
    if (ref) {
      referralMap.set(ref, (referralMap.get(ref) || 0) + 1);
    }
  });
  const topReferrals = Array.from(referralMap.entries())
    .map(([ref, count]) => ({ ref, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Broadcast / marketing ready (clean 10-digit mobile numbers)
  const broadcastReady = customers.filter(c => {
    const clean = c.phone ? c.phone.replace(/\D/g, '') : '';
    return clean.length === 10;
  });

  const healthScore = qualitySummary?.overallScore ??
    (totalCustomers > 0 ? Math.round((broadcastReady.length / totalCustomers) * 100) : 100);

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header & Filter Bar */}
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b241c] tracking-tight">
              Showroom Footfall & Performance Hub
            </h1>
          </div>
          <p className="text-xs text-[#718079] mt-1">
            Real-time analytics on counter walk-ins, QR scan conversion rates, place demographics, and phone directory hygiene.
          </p>
        </div>

        {/* Time Filter Pill Switcher */}
        <div className="flex items-center gap-1.5 bg-[#faf7f0] p-1 rounded-xl border border-[#ede3d3]">
          {(['all', '30days', '7days', 'today'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${timeRange === r
                  ? 'bg-[#0b241c] text-[#f7eedf]'
                  : 'text-[#718079] hover:text-[#0b241c]'
                }`}
            >
              {r === 'all' && 'All Time'}
              {r === '30days' && 'Last 30 Days'}
              {r === '7days' && 'Last 7 Days'}
              {r === 'today' && 'Today'}
            </button>
          ))}
          <button
            onClick={loadData}
            className="p-1.5 text-[#718079] hover:text-[#0b241c] rounded-lg transition-colors cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0b241c]' : ''}`} />
          </button>
        </div>
      </div>

      {cleanMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{cleanMessage}</span>
        </div>
      )}

      {/* 2. Top 4 High-Clarity Scorecard Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#718079] uppercase tracking-wider block">
              Total Customers
            </span>
            <div className="text-3xl font-black text-[#0b241c]">{totalCustomers}</div>
            <p className="text-[11px] text-[#b08738] font-medium">
              Registered in directory
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#faf7f0] border border-[#ede3d3] text-[#0b241c] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Showroom QR Scans */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#718079] uppercase tracking-wider block">
              Showroom QR Scans
            </span>
            <div className="text-3xl font-black text-[#0b241c]">{totalScans}</div>
            <p className="text-[11px] text-[#b08738] font-medium">
              Walk-in camera hits
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#faf7f0] border border-[#ede3d3] text-[#0b241c] flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

        {/* Scan-to-Register Rate */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#718079] uppercase tracking-wider block">
              Intake Conversion
            </span>
            <div className="text-3xl font-black text-emerald-700">{conversionRate}%</div>
            <p className="text-[11px] text-emerald-700 font-medium">
              {completedScans} completed profiles
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Verified Directory Reach */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-[#718079] uppercase tracking-wider block">
              Verified Directory
            </span>
            <div className="text-3xl font-black text-[#0b241c]">{broadcastReady.length}</div>
            <p className="text-[11px] text-[#718079] font-medium">
              Verified customer phones
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#faf7f0] border border-[#ede3d3] text-[#0b241c] flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Customer Acquisition Channels */}
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ede3d3] pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#0b241c] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#b08738]" />
              <span>Customer Intake Channels</span>
            </h2>
            <p className="text-xs text-[#718079]">How customers were added to the system</p>
          </div>
          <span className="text-xs text-[#718079] font-mono font-bold">{totalCustomers} total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Channel 1 */}
          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0b241c] flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#b08738]" />
                <span>Showroom QR Standee</span>
              </span>
              <span className="text-[#718079] font-bold">
                {totalCustomers > 0 ? Math.round((qrIntakeCount / totalCustomers) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-[#0b241c]">{qrIntakeCount}</div>
            <p className="text-[11px] text-[#718079]">Walk-in visitors scanned counter QR</p>
            <div className="w-full bg-[#ede3d3] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0b241c] h-full rounded-full transition-all"
                style={{ width: `${totalCustomers > 0 ? (qrIntakeCount / totalCustomers) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Channel 2 */}
          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0b241c] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#b08738]" />
                <span>Counter Staff Entry</span>
              </span>
              <span className="text-[#718079] font-bold">
                {totalCustomers > 0 ? Math.round((manualCount / totalCustomers) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-[#0b241c]">{manualCount}</div>
            <p className="text-[11px] text-[#718079]">Added manually at the desk</p>
            <div className="w-full bg-[#ede3d3] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0b241c] h-full rounded-full transition-all"
                style={{ width: `${totalCustomers > 0 ? (manualCount / totalCustomers) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Channel 3 */}
          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0b241c] flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#b08738]" />
                <span>Excel / CSV Import</span>
              </span>
              <span className="text-[#718079] font-bold">
                {totalCustomers > 0 ? Math.round((importCount / totalCustomers) * 100) : 0}%
              </span>
            </div>
            <div className="text-2xl font-black text-[#0b241c]">{importCount}</div>
            <p className="text-[11px] text-[#718079]">Bulk uploaded from outside files</p>
            <div className="w-full bg-[#ede3d3] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0b241c] h-full rounded-full transition-all"
                style={{ width: `${totalCustomers > 0 ? (importCount / totalCustomers) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Columns: Customer Places & Referral Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column A: Top Customer Places / Locations */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ede3d3] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#0b241c] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b08738]" />
                <span>Top Customer Places / Locations</span>
              </h2>
              <p className="text-xs text-[#718079]">Where walk-in buyers visit your showroom from</p>
            </div>
            <span className="text-xs text-[#718079] font-mono font-bold">{placeMap.size} Places</span>
          </div>

          <div className="space-y-3 pt-1">
            {topPlaces.length > 0 ? (
              topPlaces.map((item, idx) => {
                const pct = totalCustomers > 0 ? Math.round((item.count / totalCustomers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0b241c] flex items-center gap-2">
                        <span className="font-mono text-[#b08738] text-[11px]">#{idx + 1}</span>
                        <span>{item.place}</span>
                      </span>
                      <span className="text-[#718079] font-medium">
                        {item.count} customers ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#faf7f0] rounded-full h-2 overflow-hidden border border-[#ede3d3]">
                      <div
                        className="bg-[#0b241c] h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#718079] space-y-1">
                <MapPin className="w-6 h-6 text-[#b08738] mx-auto" />
                <p>Location entries will appear here as customer places are recorded.</p>
              </div>
            )}
          </div>
        </div>

        {/* Column B: Referral Sources */}
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ede3d3] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#0b241c] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#b08738]" />
                <span>Customer Referral Attribution</span>
              </h2>
              <p className="text-xs text-[#718079]">Word-of-mouth & referrer performance</p>
            </div>
            <span className="text-xs text-[#718079] font-mono font-bold">{referralMap.size} Referrers</span>
          </div>

          <div className="space-y-3 pt-1">
            {topReferrals.length > 0 ? (
              topReferrals.map((item, idx) => {
                const pct = totalCustomers > 0 ? Math.round((item.count / totalCustomers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0b241c] flex items-center gap-2">
                        <span className="font-mono text-[#b08738] text-[11px]">#{idx + 1}</span>
                        <span>{item.ref}</span>
                      </span>
                      <span className="text-[#718079] font-medium">
                        {item.count} referrals ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#faf7f0] rounded-full h-2 overflow-hidden border border-[#ede3d3]">
                      <div
                        className="bg-gradient-to-r from-[#dfb76c] to-[#0b241c] h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-[#718079] space-y-1">
                <UserCheck className="w-6 h-6 text-[#b08738] mx-auto" />
                <p>Referral records will appear here as staff and customers enter "Referred By".</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Customer Phone List Health & Marketing Readiness */}
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ede3d3] pb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0b241c] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Customer Phone List Health & Directory Quality</span>
            </h2>
            <p className="text-xs text-[#718079]">
              Ensure contact numbers are formatted, unique, and ready for festival announcements & customer billing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportVerifiedPhoneList}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#f7eedf] bg-[#0b241c] hover:bg-[#12362b] active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer border border-[#dfb76c]/40"
              title="Download clean phone list for showroom communications"
            >
              <Download className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Export Verified Contacts (.xlsx)</span>
            </button>
            <button
              onClick={handleAutoClean}
              disabled={isCleaning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0b241c] bg-[#ffffff] hover:bg-[#faf7f0] border border-[#ded7ca] rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#b08738]" />
              <span>{isCleaning ? 'Cleaning...' : '1-Click Fix Phone Formats'}</span>
            </button>
          </div>
        </div>

        {/* 3 Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#718079] block">Directory Health Score</span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
                {healthScore}%
              </span>
              <span className="text-[11px] text-[#b08738]">Complete verified contact data</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#718079] block">Duplicate Phone Groups</span>
              <span className={`text-2xl font-black mt-0.5 block ${duplicates.length > 0 ? 'text-rose-700' : 'text-[#0b241c]'}`}>
                {duplicates.length}
              </span>
              <span className="text-[11px] text-[#718079]">
                {duplicates.length === 0 ? 'Zero conflicts' : 'Requires review'}
              </span>
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${duplicates.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-[#ded7ca] text-[#718079]'
              }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#faf7f0] p-4 rounded-2xl border border-[#ede3d3] flex items-center justify-between">
            <div>
              <span className="text-xs text-[#718079] block">Verified Mobile Directory</span>
              <span className="text-2xl font-black text-[#0b241c] mt-0.5 block">
                {broadcastReady.length}
              </span>
              <span className="text-[11px] text-emerald-700">Valid 10-digit mobile numbers</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white border border-[#ded7ca] text-[#0b241c] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Duplicate warning & quick resolution if duplicates exist */}
        {duplicates.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
              <span>⚠️ {duplicates.length} Duplicate Customer Contact Numbers Found</span>
            </div>
            <div className="space-y-1 text-xs">
              {duplicates.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[#0b241c] bg-white p-2.5 rounded-xl border border-rose-200">
                  <span className="font-mono text-[#718079]">{d.key}</span>
                  <span className="font-medium">{d.customers.map(c => c.name).join(' & ')}</span>
                  {onEditCustomer && (
                    <button
                      onClick={() => onEditCustomer(d.customers[0])}
                      className="text-[11px] text-[#0b241c] font-semibold underline cursor-pointer"
                    >
                      Resolve / Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
