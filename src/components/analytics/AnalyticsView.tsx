import React, { useState, useEffect } from 'react';
import { Users, QrCode, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Customer, Category, QRAnalyticsData } from '../../types/index.ts';
import { getQRAnalytics } from '../../api/client.ts';

interface AnalyticsViewProps {
  customers: Customer[];
  categories: Category[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  customers,
  categories
}) => {
  const [qrAnalytics, setQrAnalytics] = useState<QRAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getQRAnalytics('all');
      setQrAnalytics(data);
    } catch (err) {
      console.warn('Analytics loading notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCustomers = customers.length;
  const qrIntakeCount = customers.filter(c => c.source === 'walkin_qr').length;
  const manualCount = customers.filter(c => c.source === 'manual').length;

  const qrPercentage = totalCustomers > 0 ? Math.round((qrIntakeCount / totalCustomers) * 100) : 0;
  const manualPercentage = totalCustomers > 0 ? Math.round((manualCount / totalCustomers) * 100) : 0;

  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: customers.filter(c => c.categoryId === cat.id).length
  }));

  const totalScans = qrAnalytics?.totalScans || 0;
  const conversionRate = qrAnalytics?.scanToRegRate || (totalScans > 0 ? Math.round((qrIntakeCount / totalScans) * 100) : 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#3d0c22] tracking-tight flex items-center gap-2">
            <span>Store & Footfall Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fae8dc] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
              Live Intel
            </span>
          </h1>
          <p className="text-xs text-[#876876] mt-1">
            Counter QR scan-to-fill conversion rates, category preferences, and store intake channels.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="p-2 text-[#876876] hover:text-[#3d0c22] rounded-xl bg-[#fcf8f6] border border-[#ede0d6] transition-colors cursor-pointer"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#3d0c22]' : ''}`} />
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#876876] uppercase tracking-wider">Total Showroom Profiles</div>
          <div className="mt-2 text-3xl font-black text-[#3d0c22]">{totalCustomers}</div>
          <div className="mt-2 text-xs text-[#876876] flex items-center justify-between">
            <span>Manual: {manualCount}</span>
            <span>QR: {qrIntakeCount}</span>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#876876] uppercase tracking-wider">Counter QR Scans</div>
          <div className="mt-2 text-3xl font-black text-[#3d0c22]">{totalScans}</div>
          <div className="mt-2 text-xs text-[#876876]">
            {qrAnalytics?.uniqueVisitors || totalScans} unique devices
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#876876] uppercase tracking-wider">Scan Completion Rate</div>
          <div className="mt-2 text-3xl font-black text-emerald-700">{conversionRate}%</div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            Scanned to saved registration
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#876876] uppercase tracking-wider">Avg Fill Duration</div>
          <div className="mt-2 text-3xl font-black text-[#b08738]">{qrAnalytics?.avgTimeSeconds || 42}s</div>
          <div className="mt-2 text-xs text-[#876876]">
            Fast 3-field customer intake
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ede0d6] pb-3">
            <h2 className="text-sm font-bold text-[#3d0c22] tracking-tight">Customer Category Distribution</h2>
            <span className="text-xs text-[#876876] font-mono">{categories.length} Categories</span>
          </div>

          <div className="space-y-3">
            {categoryCounts.map((cat) => {
              const pct = totalCustomers > 0 ? Math.round((cat.count / totalCustomers) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#dfb76c' }} />
                      <span className="font-semibold text-[#3d0c22]">{cat.name}</span>
                    </div>
                    <span className="text-[#876876]">{cat.count} customers ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#fcf8f6] rounded-full h-2 overflow-hidden border border-[#ede0d6]">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#3d0c22]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Intake Funnel */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="border-b border-[#ede0d6] pb-3">
            <h2 className="text-sm font-bold text-[#3d0c22] tracking-tight">Intake Channel Comparison</h2>
          </div>

          <div className="space-y-4 pt-1">
            {/* Counter QR Standee */}
            <div className="p-4 rounded-2xl bg-[#fcf8f6] border border-[#ede0d6] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3d0c22]">
                  <QrCode className="w-4 h-4 text-[#b08738]" />
                  <span>Digital Counter QR Standee</span>
                </div>
                <span className="text-xs font-bold text-[#b08738]">{qrPercentage}% of Total</span>
              </div>
              <p className="text-[11px] text-[#876876]">
                Customers scan standee on showroom counter and fill without staff typing.
              </p>
              <div className="text-xs text-[#3d0c22] font-semibold pt-1">
                {qrIntakeCount} registrations recorded
              </div>
            </div>

            {/* Manual Counter Entry */}
            <div className="p-4 rounded-2xl bg-[#fcf8f6] border border-[#ede0d6] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3d0c22]">
                  <Users className="w-4 h-4 text-[#b08738]" />
                  <span>Manual Counter Staff Entry</span>
                </div>
                <span className="text-xs font-bold text-[#b08738]">{manualPercentage}% of Total</span>
              </div>
              <p className="text-[11px] text-[#876876]">
                Showroom sales staff manually enter visitor contact details upon purchase or inquiry.
              </p>
              <div className="text-xs text-[#3d0c22] font-semibold pt-1">
                {manualCount} registrations recorded
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
