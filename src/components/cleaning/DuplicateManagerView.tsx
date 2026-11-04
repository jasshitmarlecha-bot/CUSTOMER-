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

    // Collect best non-empty values
    const allNotes = group.customers
      .map(c => c.notes?.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(' | ');

    const bestPlace = group.customers.find(c => (c.place || c.city)?.trim())?.place ||
      group.customers.find(c => c.city?.trim())?.city || '';

    const bestReferredBy = group.customers.find(c => c.referredBy?.trim())?.referredBy || '';
    const bestEmail = group.customers.find(c => c.email?.trim())?.email || '';
    const bestCategory = group.customers.find(c => c.categoryName?.trim())?.categoryName || '';

    setResolvedFields({
      name: primary.name,
      place: bestPlace,
      referredBy: bestReferredBy,
      email: bestEmail,
      categoryName: bestCategory,
      notes: allNotes
    });

    setActiveConflictGroup(group);
  };

  // Execute manual resolution merge
  const handleSaveResolution = async () => {
    if (!activeConflictGroup) return;

    const sorted = [...activeConflictGroup.customers].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const primary = sorted[0];
    const duplicateIds = sorted.slice(1).map(c => c.id);

    setIsMerging(true);
    try {
      await mergeCustomers(primary.id, duplicateIds, {
        name: resolvedFields.name.trim(),
        place: resolvedFields.place.trim(),
        city: resolvedFields.place.trim(),
        referredBy: resolvedFields.referredBy.trim(),
        email: resolvedFields.email.trim() || undefined,
        categoryName: resolvedFields.categoryName.trim() || undefined,
        notes: resolvedFields.notes.trim() || undefined
      });

      setStatusMessage({
        type: 'success',
        text: `Conflict successfully resolved! Customer profile ${resolvedFields.name} unified with full preserved history.`
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
      <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <CopyCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b241c] tracking-tight">
              Duplicate Conflict & Merge Manager
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
              Data Hygiene
            </span>
          </div>
          <p className="text-xs text-[#718079]">
            Preview conflicting customer names, places, and referrals, and choose which details to update and unify.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadDuplicateData}
            disabled={isLoading}
            className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#faf7f0] text-[#0b241c] border border-[#ded7ca] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#b08738]" />
            <span>Scan Database</span>
          </button>

          {duplicateGroups.length > 0 && (
            <button
              onClick={handleAutoMergeAll}
              disabled={isMerging}
              className="px-4 py-2 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] border border-[#dfb76c]/40 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Merge className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Auto-Merge ({duplicateGroups.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 shadow-xs ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
            : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* 2. Audit Pulse Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#ffffff] border border-[#ede3d3] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-[#718079] uppercase tracking-wider block">Duplicate Clusters</span>
            <span className="text-2xl font-black text-[#0b241c] mt-1 block">{duplicateGroups.length}</span>
            <span className="text-[11px] text-[#718079]">
              {duplicateGroups.length === 0 ? 'Zero conflicts' : 'Requires review'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#faf7f0] text-[#0b241c] border border-[#ede3d3] flex items-center justify-center">
            <CopyCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#ede3d3] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-[#718079] uppercase tracking-wider block">Conflicting Records</span>
            <span className="text-2xl font-black text-[#0b241c] mt-1 block">{totalDuplicateRecords}</span>
            <span className="text-[11px] text-[#718079]">Customer profiles involved</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#faf7f0] text-[#0b241c] border border-[#ede3d3] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#ede3d3] p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-[#718079] uppercase tracking-wider block">Directory Health</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {customers.length > 0
                ? `${Math.max(0, Math.round(((customers.length - totalDuplicateRecords) / customers.length) * 100))}%`
                : '100%'}
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">Unique customer profiles</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#ffffff] p-3 rounded-2xl border border-[#ede3d3] shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-[#718079] font-semibold px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#b08738]" />
            <span>Filter:</span>
          </span>
          <button
            onClick={() => setFilterReason('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filterReason === 'all'
                ? 'bg-[#0b241c] text-[#f7eedf]'
                : 'bg-[#faf7f0] text-[#4b5a54] hover:bg-[#ede3d3] border border-[#ded7ca]'
            }`}
          >
            All Clusters ({duplicateGroups.length})
          </button>
          <button
            onClick={() => setFilterReason('conflicts')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filterReason === 'conflicts'
                ? 'bg-[#0b241c] text-[#f7eedf]'
                : 'bg-[#faf7f0] text-[#4b5a54] hover:bg-[#ede3d3] border border-[#ded7ca]'
            }`}
          >
            Differing Data Only
          </button>
          <button
            onClick={() => setFilterReason('phone')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
              filterReason === 'phone'
                ? 'bg-[#0b241c] text-[#f7eedf]'
                : 'bg-[#faf7f0] text-[#4b5a54] hover:bg-[#ede3d3] border border-[#ded7ca]'
            }`}
          >
            Phone Matches
          </button>
        </div>

        <button
          onClick={onNavigateToDirectory}
          className="text-xs text-[#0b241c] hover:underline font-bold whitespace-nowrap cursor-pointer px-2"
        >
          View Full Directory →
        </button>
      </div>

      {/* 4. Duplicates Groups Comparison Cards */}
      {visibleGroups.length > 0 ? (
        <div className="space-y-4">
          {visibleGroups.map((group) => {
            const sortedCusts = [...group.customers].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            const diffs = detectConflicts(group);
            const activeConflicts = diffs.filter(d => d.isConflicting);

            return (
              <div
                key={group.id}
                className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ede3d3]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#dfb76c] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#718079]">
                      {group.reason === 'phone' ? 'Phone Match' : 'Email Match'}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#faf7f0] border border-[#ede3d3] text-[#0b241c] font-bold">
                      {group.key}
                    </span>
                    <span className="text-xs text-[#718079]">
                      ({group.customers.length} records)
                    </span>

                    {/* Conflict Indicators */}
                    {activeConflicts.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Conflicting: {activeConflicts.map(c => c.label).join(', ')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Identical profile details</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDismissGroup(group.id)}
                      className="px-3 py-1.5 text-xs text-[#4b5a54] hover:text-[#0b241c] bg-[#ffffff] hover:bg-[#faf7f0] rounded-xl border border-[#ded7ca] transition-colors cursor-pointer"
                    >
                      Keep Separate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenConflictResolution(group)}
                      className="px-4 py-1.5 bg-[#0b241c] hover:bg-[#12362b] active:scale-95 text-[#f7eedf] border border-[#dfb76c]/40 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#dfb76c]" />
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
                            ? 'bg-[#faf7f0] border-[#dfb76c]/60 shadow-xs'
                            : 'bg-[#ffffff] border-[#ede3d3]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0b241c]">{cust.name}</span>
                            {isPrimary && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/50">
                                Master Record (Oldest)
                              </span>
                            )}
                          </div>
                          {onEditCustomer && (
                            <button
                              type="button"
                              onClick={() => onEditCustomer(cust)}
                              className="text-[11px] text-[#0b241c] font-semibold hover:underline cursor-pointer"
                            >
                              Edit Profile
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-[#4b5a54]">
                          <div className="flex items-center gap-2 font-mono text-[#0b241c]">
                            <Phone className="w-3.5 h-3.5 text-[#b08738]" />
                            <span className="font-semibold">{cust.phone}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#b08738]" />
                            <span className={custPlace ? 'text-[#0b241c] font-medium' : 'text-gray-400 italic'}>
                              {custPlace || 'No place recorded'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserCheck className="w-3.5 h-3.5 text-[#b08738]" />
                            <span className={cust.referredBy ? 'text-[#0b241c] font-medium' : 'text-gray-400 italic'}>
                              Referred by: {cust.referredBy || 'Direct Walk-in'}
                            </span>
                          </div>

                          {cust.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-[#b08738]" />
                              <span>{cust.email}</span>
                            </div>
                          )}

                          {cust.notes && (
                            <div className="p-2.5 bg-[#ffffff] rounded-xl border border-[#ede3d3] text-[11px] text-[#4b5a54] mt-1">
                              <strong className="text-[#0b241c]">Notes:</strong> {cust.notes}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            {cust.categoryName && (
                              <span className="px-2 py-0.5 rounded-md bg-[#faf7f0] border border-[#ded7ca] text-[#0b241c] font-medium">
                                {cust.categoryName}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#718079]">
                              <Calendar className="w-3 h-3 text-[#b08738]" />
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
        <div className="bg-[#ffffff] border border-[#ede3d3] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-[#0b241c]">Database 100% Clean & Deduplicated</h3>
            <p className="text-xs text-[#718079] max-w-md mx-auto">
              Zero conflicting customer records found. All phone numbers and profiles in GIRI JEWELLERS are unified.
            </p>
          </div>
          <button
            onClick={onNavigateToDirectory}
            className="px-5 py-2.5 bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer border border-[#dfb76c]/40"
          >
            Open Customer Directory
          </button>
        </div>
      )}

      {/* CONFLICT RESOLUTION & UPDATE MODAL */}
      {activeConflictGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#040e0b]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] border border-[#ede3d3] w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#0b241c] font-sans">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#ede3d3] flex items-center justify-between bg-[#faf7f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#0b241c] text-[#dfb76c] flex items-center justify-center shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#0b241c] flex items-center gap-2">
                    <span>Resolve Conflicting Data & Update</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f4ece1] text-[#785b1f] border border-[#dfb76c]/50">
                      {activeConflictGroup.key}
                    </span>
                  </h2>
                  <p className="text-xs text-[#718079]">
                    Select which value to keep for each field, or customize the master profile before unifying.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveConflictGroup(null)}
                className="p-2 text-[#718079] hover:text-[#0b241c] hover:bg-[#ede3d3] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              <div className="space-y-4">
                {/* 1. Customer Name */}
                <div className="bg-[#faf7f0] border border-[#ede3d3] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b241c]">Unified Customer Name</label>
                    <span className="text-[11px] text-[#b08738] font-medium">Select or edit final value</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {activeConflictGroup.customers.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setResolvedFields(prev => ({ ...prev, name: c.name }))}
                        className={`px-3 py-1 text-xs rounded-xl border transition-colors cursor-pointer ${
                          resolvedFields.name === c.name
                            ? 'bg-[#0b241c] border-[#0b241c] text-[#f7eedf] font-bold'
                            : 'bg-[#ffffff] border-[#ded7ca] text-[#4b5a54] hover:bg-[#ede3d3]'
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
                    className="w-full text-xs px-3.5 py-2.5 bg-[#ffffff] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] focus:outline-none font-medium"
                  />
                </div>

                {/* 2. Place / Location */}
                <div className="bg-[#faf7f0] border border-[#ede3d3] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b241c]">Customer Place / Location</label>
                    <span className="text-[11px] text-[#b08738] font-medium">Native town / city</span>
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
                              ? 'bg-[#0b241c] border-[#0b241c] text-[#f7eedf] font-bold'
                              : 'bg-[#ffffff] border-[#ded7ca] text-[#4b5a54] hover:bg-[#ede3d3]'
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
                    className="w-full text-xs px-3.5 py-2.5 bg-[#ffffff] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] focus:outline-none font-medium"
                  />
                </div>

                {/* 3. Referred By */}
                <div className="bg-[#faf7f0] border border-[#ede3d3] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0b241c]">Referred By</label>
                    <span className="text-[11px] text-[#b08738] font-medium">Referral attribution</span>
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
                              ? 'bg-[#0b241c] border-[#0b241c] text-[#f7eedf] font-bold'
                              : 'bg-[#ffffff] border-[#ded7ca] text-[#4b5a54] hover:bg-[#ede3d3]'
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
                    className="w-full text-xs px-3.5 py-2.5 bg-[#ffffff] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] focus:outline-none font-medium"
                  />
                </div>

                {/* 4. Notes (Consolidated) */}
                <div className="bg-[#faf7f0] border border-[#ede3d3] p-4 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-[#0b241c] block">Consolidated Customer Notes</label>
                  <textarea
                    rows={3}
                    value={resolvedFields.notes}
                    onChange={(e) => setResolvedFields(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Merged jewelry preferences, purchase history, family notes..."
                    className="w-full text-xs px-3.5 py-2.5 bg-[#ffffff] border border-[#ded7ca] focus:border-[#0b241c] rounded-xl text-[#0b241c] focus:outline-none font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#ede3d3] bg-[#faf7f0] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveConflictGroup(null)}
                className="px-4 py-2 bg-[#ffffff] hover:bg-[#ede3d3] text-[#4b5a54] border border-[#ded7ca] rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveResolution}
                disabled={isMerging || !resolvedFields.name.trim()}
                className="px-6 py-2.5 bg-[#0b241c] hover:bg-[#12362b] active:scale-95 text-[#f7eedf] border border-[#dfb76c]/40 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
              >
                <Merge className="w-4 h-4 text-[#dfb76c]" />
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
