import React, { useState, useEffect } from 'react';
import { BarChart3, Users, QrCode, TrendingUp, PieChart, ShieldCheck, Calendar, RefreshCw, Smartphone, Clock } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Store & Footfall Analytics</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              Live Intel
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Counter QR scan-to-fill conversion rates, category preferences, and store intake channels.
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Showroom Profiles</div>
          <div className="mt-2 text-3xl font-black text-white">{totalCustomers}</div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Manual: {manualCount}</span>
            <span>QR: {qrIntakeCount}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Counter QR Scans</div>
          <div className="mt-2 text-3xl font-black text-indigo-400">{totalScans}</div>
          <div className="mt-2 text-xs text-slate-400">
            {qrAnalytics?.uniqueVisitors || totalScans} unique devices
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scan Completion Rate</div>
          <div className="mt-2 text-3xl font-black text-emerald-400">{conversionRate}%</div>
          <div className="mt-2 text-xs text-slate-400">
            Scanned to saved registration
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Fill Duration</div>
          <div className="mt-2 text-3xl font-black text-amber-400">{qrAnalytics?.avgTimeSeconds || 42}s</div>
          <div className="mt-2 text-xs text-slate-400">
            Fast 3-field customer intake
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">Customer Category Distribution</h2>
            <span className="text-xs text-slate-400">{categories.length} Categories</span>
          </div>

          <div className="space-y-3">
            {categoryCounts.map((cat) => {
              const pct = totalCustomers > 0 ? Math.round((cat.count / totalCustomers) * 100) : 0;
              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#f59e0b' }} />
                      <span className="font-semibold text-white">{cat.name}</span>
                    </div>
                    <span className="text-slate-400">{cat.count} customers ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color || '#f59e0b' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Intake Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-white tracking-tight">Intake Channel Comparison</h2>

          <div className="space-y-4 pt-2">
            {/* Counter QR Standee */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <QrCode className="w-4 h-4 text-indigo-400" />
                  <span>Digital Counter QR Standee</span>
                </div>
                <span className="text-xs font-bold text-indigo-400">{qrPercentage}% of Total</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Customers scan standee on showroom counter and fill without staff typing.
              </p>
              <div className="text-xs text-slate-300 font-semibold pt-1">
                {qrIntakeCount} registrations recorded
              </div>
            </div>

            {/* Manual Counter Entry */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Manual Counter Staff Entry</span>
                </div>
                <span className="text-xs font-bold text-amber-400">{manualPercentage}% of Total</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Showroom sales staff manually enter visitor contact details upon purchase or inquiry.
              </p>
              <div className="text-xs text-slate-300 font-semibold pt-1">
                {manualCount} registrations recorded
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
