import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Category, Customer } from '../../types/index.ts';
import { ConfirmationModal } from '../common/ConfirmationModal.tsx';

interface CategoryViewProps {
  categories: Category[];
  customers: Customer[];
  onCreateCategory: (cat: { name: string; color?: string; description?: string }) => Promise<Category>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#9333ea', // Vivid Purple
  '#a855f7', // Lavender
  '#c084fc', // Soft Violet
  '#7e22ce', // Deep Purple
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber / Gold
  '#10b981'  // Emerald
];

export const CategoryView: React.FC<CategoryViewProps> = ({
  categories,
  customers,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    customerCount: number;
  } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Please enter a category name');
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      await onCreateCategory({
        name: newCatName.trim(),
        color: newCatColor,
        description: newCatDesc.trim()
      });
      setNewCatName('');
      setNewCatDesc('');
      setNewCatColor(PRESET_COLORS[0]);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color || PRESET_COLORS[0]);
    setEditDesc(cat.description || '');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdateCategory(id, {
        name: editName.trim(),
        color: editColor,
        description: editDesc.trim()
      });
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    }
  };

  const handleDelete = (id: string, name: string) => {
    const count = customers.filter(c => c.categoryId === id).length;
    setDeleteConfirm({
      isOpen: true,
      id,
      name,
      customerCount: count
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Showroom Jewelry Categories</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#261327] text-[#faeed4] border border-[#482c40]">
              {categories.length} Tags
            </span>
          </h1>
          <p className="text-xs text-[#cfb7c8]">
            Create, edit, and organize customer jewelry interest tags (e.g. 22K Gold, Diamond, Bridal, Silver, VIP Clients).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Column Layout: Add Category Form & Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Category */}
        <div className="bg-[#160d16] border border-[#392233] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Plus className="w-4 h-4 text-[#dfb76c]" />
            <span>Create New Category</span>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4]">Category Name *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. 22K Gold Jewellery"
                className="w-full px-3.5 py-2.5 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#faeed4]">Description (Optional)</label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="e.g. Customers interested in bridal & necklaces"
                className="w-full px-3.5 py-2.5 text-xs bg-[#100911] border border-[#392233] rounded-xl text-white placeholder-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#faeed4] flex items-center justify-between">
                <span>Color Tag</span>
                <span className="text-[10px] font-mono text-[#dfb76c]">{newCatColor}</span>
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform border cursor-pointer ${
                      newCatColor === color ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newCatName.trim()}
              className="w-full py-2.5 px-3 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl shadow-md shadow-purple-950/60 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? 'Adding...' : 'Add Category'}</span>
            </button>
          </form>
        </div>

        {/* Right: Existing Categories List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((cat) => {
              const count = customers.filter(c => c.categoryId === cat.id).length;
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-[#100911] border border-purple-500/70 shadow-lg space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-[#1d121c] border border-[#482c40] rounded-lg text-white"
                        placeholder="Category name"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1 text-emerald-400 hover:bg-[#261327] rounded cursor-pointer"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-[#dfb76c] hover:bg-[#261327] rounded cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border cursor-pointer ${
                            editColor === c ? 'scale-125 border-white ring-1 ring-purple-400' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Optional description"
                      className="w-full px-3 py-1.5 text-[11px] bg-[#1d121c] border border-[#482c40] rounded-lg text-white"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-[#160d16] border border-[#392233] hover:border-purple-600 transition-all flex flex-col justify-between shadow-md group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color || '#9333ea' }}
                      />
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-[#cfb7c8] transition-colors">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-[11px] text-[#cfb7c8] mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1 text-[#dfb76c] hover:text-white rounded hover:bg-[#261327] transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 text-[#dfb76c] hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-[#392233] flex items-center justify-between text-[11px] text-[#cfb7c8]">
                    <span>{count} customers registered</span>
                    <span className="text-[10px] text-purple-500">ID: {cat.id.slice(0, 8)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Showroom Category Deletion Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirm?.isOpen}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (deleteConfirm) {
            try {
              await onDeleteCategory(deleteConfirm.id);
            } catch (err: any) {
              setError(err.message || 'Failed to delete category');
            }
          }
        }}
        title={`Delete Category "${deleteConfirm?.name}"?`}
        description="Are you sure you want to delete this jewelry category tag? Customers currently tagged with this category will automatically be labeled as General without losing their profiles."
        confirmText="Delete Category"
        variant="danger"
        itemDetails={[
          { label: 'Category Tag', value: deleteConfirm?.name || '' },
          { label: 'Current Customers', value: `${deleteConfirm?.customerCount || 0} customer(s)` }
        ]}
      />
    </div>
  );
};
