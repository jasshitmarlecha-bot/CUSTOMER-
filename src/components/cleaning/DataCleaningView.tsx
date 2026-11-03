import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getQualitySummary, getDuplicates, cleanCustomerData } from '../../api/client.ts';
import { DataQualitySummary, DuplicateGroup, Customer } from '../../types/index.ts';

interface DataCleaningViewProps {
  onRefreshAll: () => Promise<void>;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => Promise<void>;
}

export const DataCleaningView: React.FC<DataCleaningViewProps> = ({
  onRefreshAll,
  onEditCustomer,
  onDeleteCustomer
}) => {
  const [summary, setSummary] = useState<DataQualitySummary | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sum, dups] = await Promise.all([
        getQualitySummary(),
        getDuplicates()
      ]);
      setSummary(sum);
      setDuplicates(dups);
    } catch (err) {
      console.warn('Failed to load quality summary notice:', err);
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
      await onRefreshAll();
    } catch (err: any) {
      setCleanMessage(`Cleaning error: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Customer Phone List & Data Hygiene</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#261327] text-[#cfb7c8] border border-[#482c40] font-semibold">
              Health Score: {summary?.overallScore || 95}%
            </span>
          </h1>
          <p className="text-xs text-[#cfb7c8]">
            Standardize phone numbers, detect duplicate contact entries, and maintain verified showroom records.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#faeed4] bg-[#261327] hover:bg-[#281829] border border-[#392233] rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#cfb7c8]' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {cleanMessage && (
        <div className="p-3.5 bg-[#261327] border border-purple-600/40 rounded-xl text-[#faeed4] text-xs flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{cleanMessage}</span>
        </div>
      )}

      {/* Auto Clean Action Banner */}
      <div className="bg-gradient-to-r from-[#1d121c] via-[#210943] to-[#1d121c] border border-[#392233] rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-[#cfb7c8]" />
            <span>One-Click Smart Data & Phone Optimizer</span>
          </div>
          <p className="text-xs text-[#cfb7c8] max-w-xl">
            Removes whitespace, formats standard 10-digit mobile numbers, cleans email addresses, and maintains high phone list quality for showroom communications and SMS.
          </p>
        </div>

        <button
          onClick={handleAutoClean}
          disabled={isCleaning}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 text-[#1c1206] font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isCleaning ? 'Optimizing Data...' : 'Run Auto Clean Now'}</span>
        </button>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-[#cfb7c8] uppercase tracking-wider">Health Score</div>
          <div className="mt-2 text-3xl font-black text-emerald-400">
            {summary?.overallScore || 95}%
          </div>
          <p className="text-[11px] text-purple-400/60 mt-1">Overall database cleanliness</p>
        </div>

        <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-[#cfb7c8] uppercase tracking-wider">Healthy Profiles</div>
          <div className="mt-2 text-3xl font-black text-white">
            {summary?.healthyRecords || 0}
          </div>
          <p className="text-[11px] text-purple-400/60 mt-1">Complete phone & verified data</p>
        </div>

        <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-[#cfb7c8] uppercase tracking-wider">Duplicate Clusters</div>
          <div className="mt-2 text-3xl font-black text-amber-400">
            {duplicates.length}
          </div>
          <p className="text-[11px] text-purple-400/60 mt-1">Identified matching records</p>
        </div>

        <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-[#cfb7c8] uppercase tracking-wider">Missing Phone / Info</div>
          <div className="mt-2 text-3xl font-black text-[#faeed4]">
            {(summary?.missingPhones || 0) + (summary?.missingEmails || 0)}
          </div>
          <p className="text-[11px] text-purple-400/60 mt-1">Incomplete contact entries</p>
        </div>
      </div>

      {/* Duplicate Records Section */}
      <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Duplicate Customers Analysis</h2>
            <p className="text-xs text-[#cfb7c8]">Records sharing identical phone numbers or identical emails.</p>
          </div>
          <span className="text-xs text-[#cfb7c8] bg-[#261327] px-2.5 py-1 rounded-full border border-[#392233]">
            {duplicates.length} Groups Found
          </span>
        </div>

        {duplicates.length > 0 ? (
          <div className="space-y-3">
            {duplicates.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-xl bg-black/40 border border-[#392233] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      Duplicate Match on {group.reason.toUpperCase()}: <span className="text-amber-400 font-mono">{group.key}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-[#cfb7c8]">
                    {group.customers.length} Profiles
                  </span>
                </div>

                <div className="divide-y divide-purple-900/30">
                  {group.customers.map((c) => (
                    <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{c.name}</div>
                        <div className="text-[11px] text-[#cfb7c8] flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{c.phone}</span>
                          {c.place && <span className="text-[#cfb7c8]">• Place: {c.place}</span>}
                          {c.referredBy && <span className="text-[#cfb7c8]">• Ref: {c.referredBy}</span>}
                          {c.email && <span>• {c.email}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditCustomer(c)}
                          className="px-3 py-1 text-[11px] font-semibold text-[#faeed4] bg-[#261327] hover:bg-[#281829] border border-[#482c40] rounded-lg transition-colors cursor-pointer"
                        >
                          Review & Merge
                        </button>
                        <button
                          onClick={() => onDeleteCustomer(c.id)}
                          className="p-1.5 text-[#dfb76c] hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete duplicate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-xs font-semibold text-white">No Duplicates Detected</h3>
            <p className="text-[11px] text-[#cfb7c8]">Your customer database has clean unique contacts.</p>
          </div>
        )}
      </div>
    </div>
  );
};
