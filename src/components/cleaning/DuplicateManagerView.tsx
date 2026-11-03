import React, { useState, useEffect } from 'react';
import {
  CopyCheck,
  CheckCircle2,
  AlertTriangle,
  Merge,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Users,
  Filter,
  UserCheck,
  Edit3,
  X,
  Check,
  ArrowRight
} from 'lucide-react';
import { Customer, DuplicateGroup } from '../../types/index.ts';
import { getDuplicates, mergeCustomers, autoMergeDuplicates } from '../../api/client.ts';
import { ConfirmationModal } from '../common/ConfirmationModal.tsx';

interface DuplicateManagerViewProps {
  customers: Customer[];
  onRefreshAll: () => Promise<void>;
  onEditCustomer?: (customer: Customer) => void;
  onNavigateToDirectory: () => void;
}

interface ConflictFieldDiff {
  fieldName: 'name' | 'place' | 'referredBy' | 'email' | 'categoryName' | 'notes';
  label: string;
  isConflicting: boolean;
  values: Array<{ customerId: string; customerName: string; value: string }>;
}

export const DuplicateManagerView: React.FC<DuplicateManagerViewProps> = ({
  customers,
  onRefreshAll,
  onEditCustomer,
  onNavigateToDirectory
}) => {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [filterReason, setFilterReason] = useState<'all' | 'phone' | 'email' | 'conflicts'>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dismissedGroupIds, setDismissedGroupIds] = useState<Set<string>>(new Set());

  // Conflicting Data Preview & Resolution Modal State
  const [activeConflictGroup, setActiveConflictGroup] = useState<DuplicateGroup | null>(null);
  const [resolvedFields, setResolvedFields] = useState<{
    name: string;
    place: string;
    referredBy: string;
    email: string;
    categoryName: string;
    notes: string;
  }>({
    name: '',
    place: '',
    referredBy: '',
    email: '',
    categoryName: '',
    notes: ''
  });

  // Showroom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    itemDetails?: Array<{ label: string; value: string }>;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const loadDuplicateData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const groups = await getDuplicates();
      setDuplicateGroups(groups);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to scan duplicates: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDuplicateData();
  }, [customers]);

  // Compute field conflicts for any duplicate group
  const detectConflicts = (group: DuplicateGroup): ConflictFieldDiff[] => {
    const list = group.customers;
    if (list.length <= 1) return [];

    const checkField = (
      fieldName: 'name' | 'place' | 'referredBy' | 'email' | 'categoryName' | 'notes',
      label: string
    ): ConflictFieldDiff => {
      const values = list.map(c => {
        let val = '';
        if (fieldName === 'place') val = (c.place || c.city || '').trim();
        else val = (c[fieldName] || '').trim();
        return { customerId: c.id, customerName: c.name, value: val };
      });

      const uniqueNonEmpty = Array.from(new Set(values.map(v => v.value.toLowerCase()).filter(Boolean)));
      const isConflicting = uniqueNonEmpty.length > 1;

      return {
        fieldName,
        label,
        isConflicting,
        values
      };
    };

    return [
      checkField('name', 'Customer Name'),
      checkField('place', 'Place / Location'),
      checkField('referredBy', 'Referred By'),
      checkField('categoryName', 'Category'),
      checkField('email', 'Email Address'),
      checkField('notes', 'Notes')
    ];
  };

  // Open the side-by-side Conflict Resolution & Update modal
  const handleOpenConflictResolution = (group: DuplicateGroup) => {
    const sorted = [...group.customers].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const primary = sorted[0];
    const secondary = sorted[1] || sorted[0];

    // Initialize resolution with longest/best values
    const pickBest = (val1: string = '', val2: string = '') => {
      if (!val1.trim()) return val2.trim();
      if (!val2.trim()) return val1.trim();
      return val1.length >= val2.length ? val1.trim() : val2.trim();
    };

    const combinedNotes = [primary.notes, secondary.notes]
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(' | ');

    setResolvedFields({
      name: primary.name || secondary.name || '',
      place: pickBest(primary.place || primary.city, secondary.place || secondary.city),
      referredBy: pickBest(primary.referredBy, secondary.referredBy),
      email: pickBest(primary.email, secondary.email),
      categoryName: primary.categoryName || secondary.categoryName || 'Retail Walk-in',
      notes: combinedNotes
    });

    setActiveConflictGroup(group);
  };

  // Save the resolved fields and merge the duplicates
  const handleSaveResolution = async () => {
    if (!activeConflictGroup) return;

    const sorted = [...activeConflictGroup.customers].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const primary = sorted[0];
    const duplicates = sorted.slice(1);
    const dupIds = duplicates.map(d => d.id);

    setIsMerging(true);
    try {
      await mergeCustomers(primary.id, dupIds, {
        name: resolvedFields.name.trim(),
        place: resolvedFields.place.trim(),
        city: resolvedFields.place.trim(),
        referredBy: resolvedFields.referredBy.trim(),
        email: resolvedFields.email.trim() || undefined,
        categoryName: resolvedFields.categoryName.trim(),
        notes: resolvedFields.notes.trim() || undefined
      });

      setStatusMessage({
        type: 'success',
        text: `Conflict resolved & merged successfully! Customer profile updated with chosen details.`
      });

      setActiveConflictGroup(null);
      await onRefreshAll();
      await loadDuplicateData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to resolve and merge: ${err.message}` });
    } finally {
      setIsMerging(false);
    }
  };

  // Quick merge without manual field picker
  const handleQuickMerge = async (primary: Customer, duplicates: Customer[]) => {
    setIsMerging(true);
    setStatusMessage(null);
    try {
      const dupIds = duplicates.map(d => d.id);
      await mergeCustomers(primary.id, dupIds);
      setStatusMessage({
        type: 'success',
        text: `Successfully merged ${dupIds.length} duplicate record(s) into ${primary.name}. Contact details, place, and notes preserved!`
      });
      await onRefreshAll();
      await loadDuplicateData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Merge error: ${err.message}` });
    } finally {
      setIsMerging(false);
    }
  };

  const handleDismissGroup = (groupId: string) => {
    setDismissedGroupIds(prev => new Set([...prev, groupId]));
  };

  const handleAutoMergeAll = () => {
    const exactCount = duplicateGroups.filter(g => g.reason === 'phone').length;
    setConfirmModal({
      isOpen: true,
      title: `Auto-Merge ${exactCount} Duplicate Groups?`,
      description: 'Auto-merge will safely consolidate all matching phone number records into the earliest customer profiles. All notes, place, and referral info will be preserved.',
      variant: 'primary',
      confirmText: `Auto-Merge All (${exactCount} Groups)`,
      itemDetails: [
        { label: 'Groups to merge', value: `${exactCount} duplicate groups` },
        { label: 'Preservation Rule', value: 'Master ID retained, missing fields supplemented' }
      ],
      onConfirm: async () => {
        setIsMerging(true);
        try {
          const res = await autoMergeDuplicates();
          setStatusMessage({
            type: 'success',
            text: res.message || `Successfully auto-merged ${res.mergedGroupCount} duplicate group(s).`
          });
          await onRefreshAll();
          await loadDuplicateData();
        } catch (err: any) {
          setStatusMessage({ type: 'error', text: `Auto-merge error: ${err.message}` });
        } finally {
          setIsMerging(false);
        }
      }
    });
  };

  const totalDuplicateRecords = duplicateGroups.reduce((acc, g) => acc + g.customers.length, 0);
  const visibleGroups = duplicateGroups.filter(g => {
    if (dismissedGroupIds.has(g.id)) return false;
    if (filterReason === 'all') return true;
    if (filterReason === 'phone') return g.reason === 'phone';
    if (filterReason === 'email') return g.reason === 'email';
    if (filterReason === 'conflicts') {
      const diffs = detectConflicts(g);
      return diffs.some(d => d.isConflicting);
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-[#dfb76c]">
              <CopyCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Duplicate Conflict & Merge Manager
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#261327] text-[#faeed4] border border-[#482c40]">
              Data Hygiene
            </span>
          </div>
          <p className="text-xs text-[#cfb7c8]">
            Preview conflicting customer names, places, and referrals, and choose which details to update and unify.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDuplicateData}
            disabled={isLoading}
            className="px-3.5 py-2 bg-[#261327] hover:bg-[#2d1b28] text-[#faeed4] border border-[#482c40] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#dfb76c]" />
            <span>Scan Database</span>
          </button>

          {duplicateGroups.length > 0 && (
            <button
              onClick={handleAutoMergeAll}
              disabled={isMerging}
              className="px-4 py-2 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Merge className="w-3.5 h-3.5 text-[#1c1206] stroke-[2.5]" />
              <span>Auto-Merge ({duplicateGroups.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-md ${
          statusMessage.type === 'success'
            ? 'bg-[#261327] border-purple-500/60 text-[#faeed4]'
            : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#dfb76c] shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Audit Pulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#160d16] border border-[#392233] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider block">Duplicate Clusters</span>
            <span className="text-2xl font-black text-white mt-1 block">{duplicateGroups.length}</span>
            <span className="text-[11px] text-[#cfb7c8]">
              {duplicateGroups.length === 0 ? 'Zero conflicts' : 'Requires review'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#261327] text-[#cfb7c8] border border-[#482c40] flex items-center justify-center">
            <CopyCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#160d16] border border-[#392233] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider block">Conflicting Records</span>
            <span className="text-2xl font-black text-white mt-1 block">{totalDuplicateRecords}</span>
            <span className="text-[11px] text-[#cfb7c8]">Customer profiles involved</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#1d121c] text-[#cfb7c8] border border-[#482c40] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#160d16] border border-[#392233] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#cfb7c8] uppercase tracking-wider block">Directory Health</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {customers.length > 0
                ? `${Math.max(0, Math.round(((customers.length - totalDuplicateRecords) / customers.length) * 100))}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-emerald-400">Unique customer profiles</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#160d16] p-3 rounded-2xl border border-[#392233]">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-[#cfb7c8] font-semibold px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#dfb76c]" />
            <span>Filter:</span>
          </span>
          <button
            onClick={() => setFilterReason('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterReason === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-[#100911] text-[#cfb7c8] hover:text-white border border-[#482c40]'
            }`}
          >
            All Clusters ({duplicateGroups.length})
          </button>
          <button
            onClick={() => setFilterReason('conflicts')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterReason === 'conflicts'
                ? 'bg-purple-600 text-white'
                : 'bg-[#100911] text-[#cfb7c8] hover:text-white border border-[#482c40]'
            }`}
          >
            Differing Data Only
          </button>
          <button
            onClick={() => setFilterReason('phone')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterReason === 'phone'
                ? 'bg-purple-600 text-white'
                : 'bg-[#100911] text-[#cfb7c8] hover:text-white border border-[#482c40]'
            }`}
          >
            Phone Matches
          </button>
        </div>

        <button
          onClick={onNavigateToDirectory}
          className="text-xs text-[#cfb7c8] hover:text-white hover:underline font-bold whitespace-nowrap cursor-pointer px-2"
        >
          View Full Directory →
        </button>
      </div>

      {/* 4. Duplicates Groups Comparison & Conflict Cards */}
      {visibleGroups.length > 0 ? (
        <div className="space-y-4">
          {visibleGroups.map((group) => {
            const sortedCusts = [...group.customers].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            const primary = sortedCusts[0];
            const others = sortedCusts.slice(1);
            const diffs = detectConflicts(group);
            const activeConflicts = diffs.filter(d => d.isConflicting);

            return (
              <div
                key={group.id}
                className="bg-[#160d16] border border-[#392233] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#392233]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#cfb7c8]">
                      {group.reason === 'phone' ? 'Phone Match' : 'Email Match'}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#100911] border border-[#482c40] text-white font-bold">
                      {group.key}
                    </span>
                    <span className="text-xs text-[#cfb7c8]">
                      ({group.customers.length} records)
                    </span>

                    {/* Conflict Indicators */}
                    {activeConflicts.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Conflicting: {activeConflicts.map(c => c.label).join(', ')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Identical profile details</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDismissGroup(group.id)}
                      className="px-2.5 py-1.5 text-xs text-[#cfb7c8] hover:text-white bg-[#100911] hover:bg-[#261327] rounded-xl border border-[#482c40] transition-colors cursor-pointer"
                    >
                      Keep Separate
                    </button>

                    {/* Interactive Preview & Conflict Resolution Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenConflictResolution(group)}
                      className="px-4 py-1.5 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Preview & Update Conflict</span>
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Customer Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {sortedCusts.map((cust, idx) => {
                    const isPrimary = idx === 0;
                    const custPlace = cust.place || cust.city;

                    return (
                      <div
                        key={cust.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPrimary
                            ? 'bg-[#261327] border-purple-600/70 shadow-sm'
                            : 'bg-[#100911] border-[#392233]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{cust.name}</span>
                            {isPrimary && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900 text-[#faeed4] border border-[#482c40]">
                                Master Record (Oldest)
                              </span>
                            )}
                          </div>
                          {onEditCustomer && (
                            <button
                              type="button"
                              onClick={() => onEditCustomer(cust)}
                              className="text-[11px] text-[#dfb76c] hover:underline cursor-pointer"
                            >
                              Edit Profile
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-[#faeed4]">
                          <div className="flex items-center gap-2 font-mono">
                            <Phone className="w-3 h-3 text-[#dfb76c]" />
                            <span>{cust.phone}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[#dfb76c]" />
                            <span className={custPlace ? 'text-white font-medium' : 'text-gray-500 italic'}>
                              {custPlace || 'No place recorded'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3 h-3 text-[#dfb76c]" />
                            <span className={cust.referredBy ? 'text-white font-medium' : 'text-gray-500 italic'}>
                              Referred by: {cust.referredBy || 'Direct Walk-in'}
                            </span>
                          </div>

                          {cust.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-[#dfb76c]" />
                              <span>{cust.email}</span>
                            </div>
                          )}

                          {cust.notes && (
                            <div className="p-2 bg-[#100911] rounded-xl border border-[#392233] text-[11px] text-[#cfb7c8] mt-1">
                              <strong>Notes:</strong> {cust.notes}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#dfb76c]">
                            {cust.categoryName && (
                              <span className="px-2 py-0.5 rounded bg-[#261327] border border-[#482c40] text-[#cfb7c8]">
                                {cust.categoryName}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Calendar className="w-2.5 h-2.5 text-purple-400" />
                              <span>{cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white">Database 100% Clean & Deduplicated</h3>
            <p className="text-xs text-[#cfb7c8] max-w-md mx-auto">
              Zero conflicting customer records found. All phone numbers and profiles in GIRI JEWELLERS are unified.
            </p>
          </div>
          <button
            onClick={onNavigateToDirectory}
            className="px-5 py-2.5 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] text-[#1c1206] text-xs font-bold rounded-xl shadow-lg hover:brightness-105 transition-all cursor-pointer"
          >
            Open Customer Directory
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFLICT RESOLUTION & UPDATE MODAL                                        */}
      {/* ========================================================================= */}
      {activeConflictGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#130c15] border border-[#392233] w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white font-sans">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#2d1b28] flex items-center justify-between bg-gradient-to-r from-[#1a101c] to-[#130c15]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#261327] border border-[#482c40] flex items-center justify-center text-[#dfb76c]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <span>Resolve Conflicting Data & Update</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#261327] text-[#faeed4] border border-[#482c40]">
                      {activeConflictGroup.key}
                    </span>
                  </h2>
                  <p className="text-xs text-[#cfb7c8]">
                    Select which value to keep for each field, or customize the master profile before unifying.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveConflictGroup(null)}
                className="p-2 text-[#cfb7c8] hover:text-white hover:bg-[#261327] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* Conflicting Fields Form */}
              <div className="space-y-4">
                {/* 1. Customer Name */}
                <div className="bg-[#180f1a] border border-[#392233] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">Unified Customer Name</label>
                    <span className="text-[11px] text-[#dfb76c]">Select or edit final value</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeConflictGroup.customers.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setResolvedFields(prev => ({ ...prev, name: c.name }))}
                        className={`px-3 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                          resolvedFields.name === c.name
                            ? 'bg-[#261327] border-[#dfb76c] text-[#faeed4] font-bold'
                            : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
                        }`}
                      >
                        Option {i + 1}: "{c.name}"
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={resolvedFields.name}
                    onChange={(e) => setResolvedFields(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] focus:border-[#dfb76c] rounded-xl text-white focus:outline-none"
                  />
                </div>

                {/* 2. Place / Location */}
                <div className="bg-[#180f1a] border border-[#392233] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">Customer Place / Location</label>
                    <span className="text-[11px] text-[#dfb76c]">Native town / city</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeConflictGroup.customers.map((c, i) => {
                      const pl = c.place || c.city || '';
                      if (!pl) return null;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setResolvedFields(prev => ({ ...prev, place: pl }))}
                          className={`px-3 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                            resolvedFields.place === pl
                              ? 'bg-[#261327] border-[#dfb76c] text-[#faeed4] font-bold'
                              : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
                          }`}
                        >
                          Option {i + 1}: "{pl}"
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={resolvedFields.place}
                    onChange={(e) => setResolvedFields(prev => ({ ...prev, place: e.target.value }))}
                    placeholder="e.g. East Fort, Trivandrum"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] focus:border-[#dfb76c] rounded-xl text-white focus:outline-none"
                  />
                </div>

                {/* 3. Referred By */}
                <div className="bg-[#180f1a] border border-[#392233] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">Referred By</label>
                    <span className="text-[11px] text-[#dfb76c]">Referral attribution</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeConflictGroup.customers.map((c, i) => {
                      if (!c.referredBy) return null;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setResolvedFields(prev => ({ ...prev, referredBy: c.referredBy || '' }))}
                          className={`px-3 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                            resolvedFields.referredBy === c.referredBy
                              ? 'bg-[#261327] border-[#dfb76c] text-[#faeed4] font-bold'
                              : 'bg-[#100911] border-[#392233] text-[#cfb7c8] hover:text-white'
                          }`}
                        >
                          Option {i + 1}: "{c.referredBy}"
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    value={resolvedFields.referredBy}
                    onChange={(e) => setResolvedFields(prev => ({ ...prev, referredBy: e.target.value }))}
                    placeholder="e.g. Dr. Rajesh Nair, Walk-in Board"
                    className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] focus:border-[#dfb76c] rounded-xl text-white focus:outline-none"
                  />
                </div>

                {/* 4. Notes (Consolidated) */}
                <div className="bg-[#180f1a] border border-[#392233] p-4 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-white block">Consolidated Customer Notes</label>
                  <textarea
                    rows={3}
                    value={resolvedFields.notes}
                    onChange={(e) => setResolvedFields(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Merged jewelry preferences, purchase history, family notes..."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#100911] border border-[#392233] focus:border-[#dfb76c] rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer with Save & Unify Action */}
            <div className="p-4 sm:p-5 border-t border-[#2d1b28] bg-[#100911] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveConflictGroup(null)}
                className="px-4 py-2 bg-[#180f1a] hover:bg-[#261327] text-[#cfb7c8] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveResolution}
                disabled={isMerging || !resolvedFields.name.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 text-[#1c1206] font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Merge className="w-4 h-4 stroke-[2.5]" />
                <span>{isMerging ? 'Unifying Record...' : 'Save & Unify Customer Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        itemDetails={confirmModal.itemDetails}
      />
    </div>
  );
};
