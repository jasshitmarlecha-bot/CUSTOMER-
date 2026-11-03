import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { Customer, Category } from '../../types/index.ts';
import { ConfirmationModal } from '../common/ConfirmationModal.tsx';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer> & { allowDuplicate?: boolean; updateExisting?: boolean }) => Promise<void>;
  customer?: Customer | null;
  categories: Category[];
  existingCustomers?: Customer[];
  onCreateCategory: (cat: { name: string; color?: string; description?: string }) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = ['#9333ea', '#a855f7', '#c084fc', '#7e22ce', '#6366f1', '#ec4899'];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  categories,
  existingCustomers = [],
  onCreateCategory,
  onDeleteCategory
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'lead' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedExistingId, setLoadedExistingId] = useState<string | null>(null);
  const [allowDuplicateBypass, setAllowDuplicateBypass] = useState(false);

  // Quick inline category creator
  const [showQuickAddCat, setShowQuickAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setPlace(customer.place || customer.city || '');
      setReferredBy(customer.referredBy || '');
      setCategoryId(customer.categoryId || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
      setStatus(customer.status || 'active');
      setLoadedExistingId(customer.id);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setPlace('');
      setReferredBy('');
      setCategoryId(categories[0]?.id || '');
      setAddress('');
      setNotes('');
      setStatus('active');
      setLoadedExistingId(null);
    }
    setError(null);
    setAllowDuplicateBypass(false);
    setShowQuickAddCat(false);
  }, [customer, isOpen, categories]);

  // Live duplicate detection as staff types phone or email
  const duplicateMatch = React.useMemo(() => {
    if (customer || loadedExistingId) return null;
    const cleanP = phone.replace(/\D/g, '').slice(-10);
    const cleanE = email.trim().toLowerCase();

    if (cleanP && cleanP.length >= 7) {
      const match = existingCustomers.find(c => {
        const cPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
        return cPhone === cleanP;
      });
      if (match) return { match, reason: 'phone' as const };
    }

    if (cleanE && cleanE.includes('@')) {
      const match = existingCustomers.find(c => c.email && c.email.trim().toLowerCase() === cleanE);
      if (match) return { match, reason: 'email' as const };
    }

    return null;
  }, [customer, loadedExistingId, phone, email, existingCustomers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the customer name');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter the contact number');
      return;
    }

    if (duplicateMatch && !allowDuplicateBypass && !loadedExistingId) {
      setError(`Existing customer found for this ${duplicateMatch.reason} (${duplicateMatch.match.name}). Click "Load Existing Profile" below to update, or "Proceed as Separate".`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedCat = categories.find(c => c.id === categoryId);
      await onSave({
        id: loadedExistingId || undefined,
        updateExisting: Boolean(loadedExistingId),
        allowDuplicate: allowDuplicateBypass,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        place: place.trim(),
        city: place.trim(),
        referredBy: referredBy.trim(),
        categoryId,
        categoryName: selectedCat ? selectedCat.name : undefined,
        address: address.trim(),
        notes: notes.trim(),
        status
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadExistingCustomer = (existing: Customer) => {
    setName(existing.name);
    setPhone(existing.phone);
    setEmail(existing.email || '');
    setPlace(existing.place || existing.city || '');
    setReferredBy(existing.referredBy || '');
    setCategoryId(existing.categoryId || categories[0]?.id || '');
    setAddress(existing.address || '');
    setNotes(existing.notes || '');
    setStatus(existing.status || 'active');
    setLoadedExistingId(existing.id);
    setError(null);
  };

  const handleCreateQuickCategory = async () => {
    if (!newCatName.trim()) return;
    setIsCatSubmitting(true);
    try {
      const created = await onCreateCategory({
        name: newCatName.trim(),
        color: newCatColor
      });
      setCategoryId(created.id);
      setNewCatName('');
      setShowQuickAddCat(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleDeleteQuickCategory = (catId: string, catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCategoryConfirm({ id: catId, name: catName });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#160d16] border border-[#392233] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Header */}
        <div className="p-5 border-b border-[#392233] flex items-center justify-between bg-[#100911]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-[#cfb7c8] border border-purple-500/30 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                {customer ? 'Edit Customer Profile' : 'Register New Customer'}
              </h2>
              <p className="text-xs text-[#cfb7c8]">
                Showroom Client Intake & Referral Profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#cfb7c8] hover:text-white rounded-lg hover:bg-[#281829] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Customer Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Mobile Phone *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 98470 12345"
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono font-medium"
              />
            </div>
          </div>

          {/* NEW: Customer Place & Referred By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Customer Place / Location</span>
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Trivandrum, East Fort, Kollam"
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Referred By (Person / Source)</span>
              </label>
              <input
                type="text"
                value={referredBy}
                onChange={(e) => setReferredBy(e.target.value)}
                placeholder="e.g. Priya Sharma, Family friend, Walk-in"
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium"
              />
            </div>
          </div>

          {/* Email & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Email Address (Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@email.com"
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4]">
                Customer Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              >
                <option value="active">Active Customer</option>
                <option value="lead">Prospect / Walk-In Lead</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Live Duplicate Warning Box */}
          {duplicateMatch && !loadedExistingId && (
            <div className="p-3.5 bg-[#1f0a3d] border border-purple-500/60 rounded-xl space-y-2 shadow-lg animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#faeed4] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Existing Customer Found with matching {duplicateMatch.reason}</span>
                </span>
                <span className="text-[10px] text-[#cfb7c8] font-mono">
                  Registered {duplicateMatch.match.createdAt ? new Date(duplicateMatch.match.createdAt).toLocaleDateString() : 'earlier'}
                </span>
              </div>
              <div className="p-2.5 bg-black/60 rounded-lg border border-[#392233] flex items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-white">{duplicateMatch.match.name}</div>
                  <div className="text-[11px] text-[#cfb7c8] flex items-center gap-2 mt-0.5">
                    <span>{duplicateMatch.match.phone}</span>
                    {duplicateMatch.match.place && <span>• {duplicateMatch.match.place}</span>}
                    {duplicateMatch.match.referredBy && <span>• Ref: {duplicateMatch.match.referredBy}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadExistingCustomer(duplicateMatch.match)}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Load Profile</span>
                </button>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#cfb7c8]">
                <span>Want to avoid creating a duplicate entry?</span>
                <button
                  type="button"
                  onClick={() => setAllowDuplicateBypass(true)}
                  className="text-white hover:underline cursor-pointer"
                >
                  Proceed as Separate Family Member
                </button>
              </div>
            </div>
          )}

          {/* Badge when updating an existing customer */}
          {loadedExistingId && !customer && (
            <div className="p-2.5 bg-[#261327] border border-purple-600/70 rounded-xl text-xs text-[#faeed4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#dfb76c]" />
                <span>Enriching existing profile for <strong>{name}</strong> (No duplicate created)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoadedExistingId(null);
                  setName('');
                  setPhone('');
                  setEmail('');
                  setPlace('');
                  setReferredBy('');
                }}
                className="text-[11px] text-[#dfb76c] hover:text-white underline cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          )}

          {/* Category Picker */}
          <div className="space-y-2 pt-1 border-t border-[#392233]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Customer Category / Jewelry Tag</span>
              </label>
              <button
                type="button"
                onClick={() => setShowQuickAddCat(!showQuickAddCat)}
                className="text-[11px] text-[#cfb7c8] hover:text-white flex items-center gap-1 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showQuickAddCat ? 'Close Category Editor' : '+ Add New Category'}</span>
              </button>
            </div>

            {/* Quick Inline Category Creator */}
            {showQuickAddCat && (
              <div className="p-3 rounded-xl bg-[#100911] border border-purple-600/40 space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category (e.g. Bridal Jewellery, 22K Gold, VIP)..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-[#1d121c] border border-[#482c40] rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateQuickCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newCatName.trim() || isCatSubmitting}
                    onClick={handleCreateQuickCategory}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#cfb7c8]">Color:</span>
                  <div className="flex items-center gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                          newCatColor === c ? 'scale-125 border-white ring-1 ring-purple-400' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Interactive category buttons with delete capability */}
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-36 overflow-y-auto p-1.5 bg-[#100911] rounded-xl border border-[#392233]">
              {categories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-purple-600/30 text-[#faeed4] border-purple-500 font-bold shadow-xs'
                        : 'bg-[#1d121c] text-[#cfb7c8] border-[#392233] hover:border-[#482c40] hover:bg-[#200b45]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: c.color || '#9333ea' }}
                    />
                    <span>{c.name}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteQuickCategory(c.id, c.name, e)}
                      title={`Delete "${c.name}" category`}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded text-[#dfb76c] transition-opacity ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Street Address & Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#faeed4] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Showroom Staff Notes / Preferences</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Interested in wedding collections; anniversary in December; referred by uncle..."
              className="w-full px-3 py-2 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#392233] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#cfb7c8] bg-[#261327] hover:bg-[#281829] rounded-xl border border-[#482c40] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl shadow-lg shadow-purple-950/60 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : customer ? 'Update Profile' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>

      {/* Category Deletion Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteCategoryConfirm}
        onClose={() => setDeleteCategoryConfirm(null)}
        onConfirm={async () => {
          if (!deleteCategoryConfirm) return;
          try {
            await onDeleteCategory(deleteCategoryConfirm.id);
            if (categoryId === deleteCategoryConfirm.id) {
              setCategoryId(categories.filter(c => c.id !== deleteCategoryConfirm.id)[0]?.id || '');
            }
          } catch (err: any) {
            setError(err.message || 'Failed to delete category');
          } finally {
            setDeleteCategoryConfirm(null);
          }
        }}
        title={`Delete Category "${deleteCategoryConfirm?.name}"?`}
        description="Are you sure you want to delete this jewelry category tag from the system?"
        confirmText="Delete Tag"
        variant="danger"
        itemDetails={[
          { label: 'Category Tag', value: deleteCategoryConfirm?.name || '' },
          { label: 'Action', value: 'Remove from quick-tag dropdown' }
        ]}
      />
    </div>
  );
};
