import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Tag,
  MapPin,
  Calendar,
  Filter,
  RefreshCw,
  QrCode,
  Download,
  Upload,
  Printer,
  ChevronDown,
  X,
  FileSpreadsheet,
  FileText,
  User,
  ArrowUpDown,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Category, StaffUser } from '../../types/index.ts';
import { CustomerImportModal } from './CustomerImportModal.tsx';
import { CustomerPrintModal } from './CustomerPrintModal.tsx';
import { ConfirmationModal } from '../common/ConfirmationModal.tsx';
import { PermissionModal } from '../common/PermissionModal.tsx';

interface CustomerListViewProps {
  customers: Customer[];
  categories: Category[];
  currentUser: StaffUser;
  onAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => Promise<void>;
  onClearAllCustomers: () => Promise<void>;
  onNavigateToQR: () => void;
  onImportCustomers: (customers: any[]) => Promise<{ importedCount: number; errors: string[] }>;
  onNavigateToImport?: () => void;
  businessName?: string;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  categories,
  currentUser,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onClearAllCustomers,
  onNavigateToQR,
  onImportCustomers,
  onNavigateToImport,
  businessName = 'Giri Jewels'
}) => {
  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Modals state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  // Reusable Confirmation & Permission Dialogues
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

  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean;
    actionTitle: string;
    actionDescription?: string;
    onAuthorizeOverride?: () => void;
  }>({
    isOpen: false,
    actionTitle: ''
  });

  const permissions = currentUser.permissions || {
    canViewCustomers: true,
    canAddEditCustomers: currentUser.role === 'admin',
    canDeleteCustomers: currentUser.role === 'admin',
    canExportData: true,
    canImportData: currentUser.role === 'admin',
    canPrintData: true,
    canManageCategories: currentUser.role === 'admin',
    canRunCleaning: currentUser.role === 'admin',
    canViewAnalytics: true,
    canViewCommonQR: true
  };

  // Distinct cities/places extracted for dynamic location filter
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach(c => {
      const loc = c.place || c.city;
      if (loc && loc.trim()) set.add(loc.trim());
    });
    return Array.from(set).sort();
  }, [customers]);

  // Real-time comprehensive filtering & search logic
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = customers.filter((customer) => {
      const matchesSearch =
        !query ||
        (customer.name && customer.name.toLowerCase().includes(query)) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.phone && customer.phone.includes(query)) ||
        (customer.place && customer.place.toLowerCase().includes(query)) ||
        (customer.city && customer.city.toLowerCase().includes(query)) ||
        (customer.referredBy && customer.referredBy.toLowerCase().includes(query)) ||
        (customer.address && customer.address.toLowerCase().includes(query)) ||
        (customer.categoryName && customer.categoryName.toLowerCase().includes(query)) ||
        (customer.notes && customer.notes.toLowerCase().includes(query));

      const matchesCategory =
        selectedCategory === 'all' || customer.categoryId === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || customer.status === selectedStatus;

      const matchesSource =
        selectedSource === 'all' || customer.source === selectedSource;

      const customerPlace = (customer.place || customer.city || '').toLowerCase();
      const matchesCity =
        selectedCity === 'all' || customerPlace === selectedCity.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus && matchesSource && matchesCity;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'name_desc') {
        return (b.name || '').localeCompare(a.name || '');
      }
      // default: newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [customers, searchQuery, selectedCategory, selectedStatus, selectedSource, selectedCity, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    selectedSource !== 'all' ||
    selectedCity !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedCity('all');
    setSortBy('newest');
  };

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);

  const handleDelete = (id: string, name: string, phone: string = '') => {
    if (!permissions.canDeleteCustomers) {
      setPermissionModal({
        isOpen: true,
        actionTitle: 'Delete Customer Record',
        actionDescription: 'Administrator credentials are required to delete customer profiles from the showroom roster.',
        onAuthorizeOverride: () => {
          promptDeleteConfirmation(id, name, phone);
        }
      });
      return;
    }
    promptDeleteConfirmation(id, name, phone);
  };

  const promptDeleteConfirmation = (id: string, name: string, phone: string = '') => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Customer Record?',
      description: `Are you sure you want to permanently delete "${name}"? Their contact details, place, referral notes, and purchase history will be removed.`,
      confirmText: 'Delete Customer',
      variant: 'danger',
      itemDetails: [
        { label: 'Customer Name', value: name },
        ...(phone ? [{ label: 'Mobile Number', value: phone }] : [])
      ],
      onConfirm: async () => {
        setIsDeletingId(id);
        try {
          await onDeleteCustomer(id);
        } finally {
          setIsDeletingId(null);
        }
      }
    });
  };

  const handleClearAll = () => {
    if (!permissions.canDeleteCustomers) {
      setPermissionModal({
        isOpen: true,
        actionTitle: 'Wipe Entire Customer Database',
        actionDescription: 'Administrator credentials are required to clear customer records.',
        onAuthorizeOverride: () => {
          promptClearAllConfirmation();
        }
      });
      return;
    }
    promptClearAllConfirmation();
  };

  const promptClearAllConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Wipe All Customer Records?',
      description: 'WARNING: This will permanently delete ALL customer records currently in the Giri Jewels database. This operation CANNOT be undone!',
      confirmText: 'Yes, Wipe Database',
      variant: 'danger',
      itemDetails: [
        { label: 'Total Records to Delete', value: String(customers.length) },
        { label: 'Target Store', value: businessName || 'Giri Jewels' }
      ],
      onConfirm: async () => {
        await onClearAllCustomers();
      }
    });
  };

  // Export to Excel (.xlsx) including Place and Referred By
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) return;
    setIsExportDropdownOpen(false);

    const dataToExport = filteredCustomers.map((c, index) => {
      const cleanPhone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
      return {
        'S.No': index + 1,
        'Customer Name': c.name || '',
        'Mobile Phone': cleanPhone.length === 10 ? `91${cleanPhone}` : c.phone || '',
        'Customer Place / Location': c.place || c.city || '',
        'Referred By': c.referredBy || 'Direct Walk-in',
        'Category': c.categoryName || 'General',
        'Email Address': c.email || '',
        'Status': c.status,
        'Source': c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Staff Manual',
        'Registered Date': new Date(c.createdAt).toLocaleDateString('en-IN')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Auto-fit column widths
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 24 },
      { wch: 10 },
      { wch: 16 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    XLSX.writeFile(workbook, `giri_jewels_customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;
    setIsExportDropdownOpen(false);

    const headers = ['Name', 'Phone', 'Place', 'Referred By', 'Category', 'Email', 'Status', 'Source', 'Registered Date'];
    const rows = filteredCustomers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.place || c.city || '').replace(/"/g, '""')}"`,
      `"${(c.referredBy || 'Direct Walk-in').replace(/"/g, '""')}"`,
      `"${(c.categoryName || 'General').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${c.source === 'walkin_qr' ? 'Showroom QR' : c.source === 'import' ? 'Imported' : 'Staff Manual'}"`,
      `"${new Date(c.createdAt).toLocaleDateString('en-IN')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giri_jewels_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF / Printable view
  const handleExportPDF = () => {
    setIsExportDropdownOpen(false);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Page Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-800 font-bold">
              {customers.length} total
            </span>
          </h1>
          <p className="text-xs text-[#cfb7c8]">
            Showroom client records with location place, referral attribution, category, and filtered export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Customer Data Button */}
          {permissions.canPrintData && customers.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#faeed4] bg-[#1d121c] hover:bg-[#281928] border border-[#482c40] rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Print Customer Data"
            >
              <Printer className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Print Data</span>
            </button>
          )}

          {/* Prominent Export Filtered Data Button */}
          {permissions.canExportData && filteredCustomers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#faeed4] bg-[#261327] hover:bg-[#2e162f] border border-[#dfb76c]/60 rounded-xl shadow-sm transition-colors cursor-pointer"
                title={`Export ${filteredCustomers.length} filtered customer records`}
              >
                <Download className="w-3.5 h-3.5 text-[#dfb76c]" />
                <span>Export Filtered ({filteredCustomers.length})</span>
                <ChevronDown className="w-3 h-3 text-[#dfb76c]" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-[#180f18] border border-[#482c40] rounded-2xl shadow-2xl z-30 py-2 text-xs">
                  <div className="px-3.5 py-1 text-[11px] font-bold text-[#dfb76c] border-b border-[#2d1b28]">
                    Export Filtered ({filteredCustomers.length} Records)
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-[#261327] transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Excel Spreadsheet (.xlsx)</span>
                      <span className="text-[10px] text-[#cfb7c8]">Filtered records with place & referral</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-[#261327] transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="font-bold block">CSV Format (.csv)</span>
                      <span className="text-[10px] text-[#cfb7c8]">Universal comma-separated file</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-white hover:bg-[#261327] transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#dfb76c] shrink-0" />
                    <div>
                      <span className="font-bold block">Printable Roster / PDF</span>
                      <span className="text-[10px] text-[#cfb7c8]">Print layout formatted for paper</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Import Customers Button */}
          {permissions.canImportData && (
            <button
              onClick={() => {
                if (onNavigateToImport) {
                  onNavigateToImport();
                } else {
                  setIsImportModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#faeed4] hover:text-white bg-[#1d121c] hover:bg-[#281928] border border-[#482c40] rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Import outside customer data from Excel or CSV"
            >
              <Upload className="w-3.5 h-3.5 text-[#dfb76c]" />
              <span>Import Data</span>
            </button>
          )}

          {/* Add Customer (Champagne Gold Button) */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#1c1206] bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-95 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#1c1206] stroke-[3]" />
              <span>+ Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FILTER SEARCH PANEL                                                       */}
      {/* ========================================================================= */}
      <div className="bg-[#160d16] p-4 sm:p-5 rounded-2xl border border-[#392233] shadow-xl space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#dfb76c]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, place/town, referred by, or category..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-[#100911] border border-[#44283c] rounded-xl transition-colors focus:outline-none focus:ring-1 focus:ring-[#dfb76c] text-white placeholder:text-[#8f7488] font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#cfb7c8] hover:text-white cursor-pointer"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#100911] border border-[#44283c] rounded-xl px-2.5 py-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-[#dfb76c]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#faeed4] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-[#180f18] text-[#faeed4]">
                  All Categories ({categories.length})
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#180f18] text-[#faeed4]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Place Filter (if places exist) */}
            {uniqueCities.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#100911] border border-[#44283c] rounded-xl px-2.5 py-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#dfb76c]" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-[#faeed4] font-medium focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all" className="bg-[#180f18] text-[#faeed4]">All Places ({uniqueCities.length})</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city} className="bg-[#180f18] text-[#faeed4]">
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 bg-[#100911] border border-[#44283c] rounded-xl px-2.5 py-1.5 text-xs">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-transparent text-[#faeed4] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-[#180f18] text-[#faeed4]">All Sources</option>
                <option value="walkin_qr" className="bg-[#180f18] text-[#faeed4]">Showroom QR</option>
                <option value="manual" className="bg-[#180f18] text-[#faeed4]">Staff Manual</option>
                <option value="import" className="bg-[#180f18] text-[#faeed4]">Bulk Imported</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 bg-[#100911] border border-[#44283c] rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#dfb76c]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#faeed4] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="newest" className="bg-[#180f18] text-[#faeed4]">Newest First</option>
                <option value="oldest" className="bg-[#180f18] text-[#faeed4]">Oldest First</option>
                <option value="name_asc" className="bg-[#180f18] text-[#faeed4]">Name (A-Z)</option>
                <option value="name_desc" className="bg-[#180f18] text-[#faeed4]">Name (Z-A)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#cfb7c8] hover:text-white bg-[#1d121c] hover:bg-[#281928] rounded-xl transition-colors cursor-pointer border border-[#482c40]"
                title="Reset all filter fields"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2d1b28]">
            <span className="text-[11px] font-semibold text-[#cfb7c8] flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#dfb76c]" />
              <span>Active Filters:</span>
            </span>

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#261327] text-[#faeed4] border border-[#482c40]">
                <span>Keyword: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCity !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#261327] text-[#faeed4] border border-[#482c40]">
                <span>Place: {selectedCity}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#261327] text-[#faeed4] border border-[#482c40]">
                <span>Category: {selectedCategoryObj?.name || selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-[#dfb76c] hover:text-white underline cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Summary Status & Filtered Export Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#cfb7c8] pt-1 border-t border-[#2d1b28]">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-white font-semibold">{filteredCustomers.length}</strong> of {customers.length} customer records</span>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Filtered Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filteredCustomers.length > 0 && permissions.canExportData && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="text-[#dfb76c] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                title="Directly export these filtered customer records to Excel"
              >
                <Download className="w-3 h-3" />
                <span>Export Filtered ({filteredCustomers.length} rows to .xlsx)</span>
              </button>
            )}
            {customers.length > 0 && permissions.canDeleteCustomers && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                Clear database
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOMER RECORDS TABLE (Includes Place & Referred By)                     */}
      {/* ========================================================================= */}
      <div className="bg-[#160d16] rounded-2xl border border-[#392233] shadow-xl overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-800 flex items-center justify-center mx-auto text-purple-400">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {hasActiveFilters ? 'No customers match your search criteria' : 'No customers in directory yet'}
            </h3>
            <p className="text-xs text-purple-300/80 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try broadening your search term or clearing one of the active filters above.'
                : 'Customers who scan your Showroom QR code will automatically appear here, or you can add them manually.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-bold bg-[#fae2ab] hover:bg-[#f0cc85] text-[#1c1206] rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={onNavigateToQR}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#fae2ab] hover:bg-[#f0cc85] text-[#1c1206] rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Showroom QR</span>
                  </button>
                  {permissions.canAddEditCustomers && (
                    <button
                      onClick={onAddCustomer}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#1d121c] hover:bg-[#281928] text-[#faeed4] rounded-xl border border-[#482c40] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#dfb76c]" />
                      <span>Add Customer</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#120a13] text-[#dfb76c] font-semibold border-b border-[#2d1b28]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer Details</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Place / Location</th>
                  <th className="py-3.5 px-4 font-semibold">Referred By</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Intake</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d1b28]">
                {filteredCustomers.map((customer) => {
                  const customerPlace = customer.place || customer.city;
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#1d111d] transition-colors group"
                    >
                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#261327] border border-[#482c40] flex items-center justify-center text-[#dfb76c] font-bold text-xs shrink-0">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-white group-hover:text-[#faeed4] transition-colors">
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div className="text-[11px] text-[#cfb7c8] flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-[#dfb76c]" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[#faeed4] font-semibold">
                          {customer.phone || 'No phone'}
                        </span>
                      </td>

                      {/* Customer Place */}
                      <td className="py-3.5 px-4">
                        {customerPlace ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium text-[#faeed4] bg-[#261327] border border-[#482c40]">
                            <MapPin className="w-3 h-3 text-[#dfb76c]" />
                            <span>{customerPlace}</span>
                          </span>
                        ) : (
                          <span className="text-[#8f7488] text-[11px] italic">Not specified</span>
                        )}
                      </td>

                      {/* Referred By */}
                      <td className="py-3.5 px-4">
                        {customer.referredBy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold text-[#faeed4] bg-[#261327] border border-[#482c40]">
                            <UserCheck className="w-3 h-3 text-[#dfb76c]" />
                            <span>{customer.referredBy}</span>
                          </span>
                        ) : (
                          <span className="text-[#8f7488] text-[11px]">Direct Walk-In</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2a142c] text-[#dfb76c] border border-[#482c40]">
                          {customer.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        {customer.source === 'walkin_qr' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#331435] text-[#f0abfc] border border-[#522157]">
                            <QrCode className="w-3 h-3" />
                            <span>QR Standee</span>
                          </span>
                        ) : customer.source === 'import' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#331730] text-[#e8b5d8] border border-[#54254f]">
                            <Upload className="w-3 h-3" />
                            <span>Imported</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#261327] text-[#cfb7c8] border border-[#482c40]">
                            <span>Manual Staff</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-[#cfb7c8] text-[11px] font-mono">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {permissions.canAddEditCustomers && (
                            <button
                              onClick={() => onEditCustomer(customer)}
                              className="p-1.5 text-[#cfb7c8] hover:text-white hover:bg-[#281829] rounded-lg transition-colors cursor-pointer"
                              title="Edit customer details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(customer.id, customer.name, customer.phone)}
                            disabled={isDeletingId === customer.id}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete customer record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Import Modal */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={onImportCustomers}
      />

      {/* Customer Print Modal */}
      <CustomerPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        customers={filteredCustomers}
        businessName={businessName}
        filterSummary={
          hasActiveFilters
            ? `${selectedCategory !== 'all' ? `Category: ${selectedCategory}, ` : ''}${selectedStatus !== 'all' ? `Status: ${selectedStatus}, ` : ''}${selectedSource !== 'all' ? `Source: ${selectedSource}, ` : ''}${selectedCity !== 'all' ? `Place: ${selectedCity}` : ''}`
            : undefined
        }
      />

      {/* Confirmation Modal */}
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

      {/* Permission Modal */}
      <PermissionModal
        isOpen={permissionModal.isOpen}
        onClose={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))}
        actionTitle={permissionModal.actionTitle}
        actionDescription={permissionModal.actionDescription}
        currentUser={currentUser}
        onAuthorizeOverride={permissionModal.onAuthorizeOverride}
      />
    </div>
  );
};
