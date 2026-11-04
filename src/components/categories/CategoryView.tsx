import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
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
  '#dfb76c', // Champagne Gold
  '#3d0c22', // Deep Emerald
  '#164436', // Forest Jade
  '#b08738', // Heritage Gold
  '#1d3557', // Royal Sapphire
  '#9b2226', // Deep Ruby
  '#d4a373', // Warm Ochre
  '#4a5568'  // Platinum Slate
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
      <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3d0c22] text-[#dfb76c] flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#3d0c22] tracking-tight flex items-center gap-2">
              <span>Showroom Jewellery Categories</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fae8dc] text-[#785b1f] border border-[#dfb76c]/40 font-mono">
                {categories.length} Tags
              </span>
            </h1>
          </div>
          <p className="text-xs text-[#876876] mt-1">
            Organize customer jewellery interests and purchase preferences (e.g. 22K Gold, Heritage Bridal, Solitaire Diamonds, Silver).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Column Layout: Add Category Form & Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add New Category */}
        <div className="bg-[#ffffff] border border-[#ede0d6] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#3d0c22] font-bold text-sm border-b border-[#ede0d6] pb-3">
            <Plus className="w-4 h-4 text-[#b08738]" />
            <span>Create New Category</span>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2a0717]">Category Name *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. 22K Antique Gold"
                className="w-full px-3.5 py-2.5 text-xs bg-[#fcf8f6] border border-[#edd4c8] rounded-xl text-[#3d0c22] placeholder-[#a88d9c] focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#2a0717]">Description (Optional)</label>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="e.g. Bridal necklaces, sets, & bangles"
                className="w-full px-3.5 py-2.5 text-xs bg-[#fcf8f6] border border-[#edd4c8] rounded-xl text-[#3d0c22] placeholder-[#a88d9c] focus:outline-none focus:ring-2 focus:ring-[#dfb76c]/40 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2a0717] flex items-center justify-between">
                <span>Color Tag</span>
                <span className="text-[10px] font-mono text-[#b08738]">{newCatColor}</span>
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCatColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform border cursor-pointer ${newCatColor === color ? 'scale-125 border-[#3d0c22] ring-2 ring-[#dfb76c]' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newCatName.trim()}
              className="w-full py-2.5 px-3 text-xs font-bold text-[#ffffff] bg-[#3d0c22] hover:bg-[#521130] active:scale-95 rounded-xl shadow-md shadow-[#3d0c22]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer border border-[#5c1334]"
            >
              <Plus className="w-3.5 h-3.5 text-[#dfb76c]" />
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
                    className="p-4 rounded-2xl bg-[#fcf8f6] border border-[#dfb76c] shadow-md space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#edd4c8] rounded-lg text-[#3d0c22] font-medium"
                        placeholder="Category name"
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full border cursor-pointer ${editColor === c ? 'scale-125 border-[#3d0c22] ring-1 ring-[#dfb76c]' : 'border-transparent'
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
                      className="w-full px-3 py-1.5 text-[11px] bg-white border border-[#edd4c8] rounded-lg text-[#3d0c22]"
                    />
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-[#ffffff] border border-[#ede0d6] hover:border-[#dfb76c] transition-all flex flex-col justify-between shadow-xs group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#dfb76c' }}
                      />
                      <div>
                        <h3 className="text-xs font-bold text-[#3d0c22]">
                          {cat.name}
                        </h3>
                        {cat.description && (
                          <p className="text-[11px] text-[#876876] mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1 text-[#876876] hover:text-[#3d0c22] rounded hover:bg-[#fcf8f6] transition-colors cursor-pointer"
                        title="Edit category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1 text-[#876876] hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-[#ede0d6] flex items-center justify-between text-[11px] text-[#876876]">
                    <span>{count} customers registered</span>
                    <span className="text-[10px] font-mono text-[#b08738]">ID: {cat.id.slice(0, 8)}</span>
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
