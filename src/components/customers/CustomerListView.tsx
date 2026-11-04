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
  businessName = 'GIRI JEWELLERS'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc'>('newest');

  // Modals & Action States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    itemDetails?: { label: string; value: string }[];
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {}
  });

  // Admin permission override modal
  const [permissionModal, setPermissionModal] = useState<{
    isOpen: boolean;
    actionTitle: string;
    actionDescription: string;
    onAuthorizeOverride?: () => void;
  }>({
    isOpen: false,
    actionTitle: '',
    actionDescription: ''
  });

  const permissions = currentUser.permissions || {
    canViewCustomers: true,
    canAddEditCustomers: currentUser.role === 'admin',
    canDeleteCustomers: currentUser.role === 'admin',
    canExportData: true,
    canImportData: currentUser.role === 'admin',
    canPrintData: true
  };

  // Unique places/towns for filter dropdown
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      const loc = c.place || c.city;
      if (loc && loc.trim()) {
        set.add(loc.trim());
      }
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered & Sorted Customer Data
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = customer.name?.toLowerCase().includes(q);
          const matchesPhone = customer.phone?.includes(q);
          const matchesEmail = customer.email?.toLowerCase().includes(q);
          const matchesCity = customer.city?.toLowerCase().includes(q) || customer.place?.toLowerCase().includes(q);
          const matchesReferral = customer.referredBy?.toLowerCase().includes(q);
          const matchesCategory = customer.categoryName?.toLowerCase().includes(q);
          const matchesNotes = customer.notes?.toLowerCase().includes(q);
          if (!matchesName && !matchesPhone && !matchesEmail && !matchesCity && !matchesReferral && !matchesCategory && !matchesNotes) {
            return false;
          }
        }

        if (selectedCategory !== 'all' && customer.categoryId !== selectedCategory) {
          return false;
        }

        if (selectedStatus !== 'all' && customer.status !== selectedStatus) {
          return false;
        }

        if (selectedSource !== 'all' && customer.source !== selectedSource) {
          return false;
        }

        if (selectedCity !== 'all') {
          const loc = customer.place || customer.city;
          if (!loc || loc.trim().toLowerCase() !== selectedCity.toLowerCase()) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name_desc') {
          return (b.name || '').localeCompare(a.name || '');
        }
        return 0;
      });
  }, [customers, searchQuery, selectedCategory, selectedStatus, selectedSource, selectedCity, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    selectedSource !== 'all' ||
    selectedCity !== 'all' ||
    sortBy !== 'newest'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedCity('all');
    setSortBy('newest');
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  const handleDelete = (id: string, name: string, phone?: string) => {
    if (!permissions.canDeleteCustomers) {
      setPermissionModal({
        isOpen: true,
        actionTitle: 'Delete Customer Record',
        actionDescription: 'Administrator credentials are required to delete customer profiles.',
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
      description: `WARNING: This will permanently delete ALL customer records currently in the ${businessName} database. This operation CANNOT be undone!`,
      confirmText: 'Yes, Wipe Database',
      variant: 'danger',
      itemDetails: [
        { label: 'Total Customers to Delete', value: `${customers.length} records` },
        { label: 'Showroom Action', value: 'Complete Database Wipe' }
      ],
      onConfirm: async () => {
        await onClearAllCustomers();
      }
    });
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) return;
    setIsExportDropdownOpen(false);

    const rows = filteredCustomers.map((c, i) => {
      const cleanPhone = (c.phone || '').replace(/[^0-9]/g, '');
      return {
        'S.No': i + 1,
        'Customer Name': c.name,
        'Mobile Phone': cleanPhone.length === 10 ? `+91 ${cleanPhone}` : c.phone,
        'Customer Place / Town': c.place || c.city || '-',
        'Referred By / Contact': c.referredBy || 'Direct Walk-in',
        'Preferred Jewellery Category': c.categoryName || 'General',
        'Email Address': c.email || '-',
        'Registration Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-',
        'Customer Status': c.status === 'active' ? 'Active Client' : c.status === 'lead' ? 'Prospective Lead' : 'Inactive',
        'Intake Channel': c.source === 'walkin_qr' ? 'Showroom Counter QR' : c.source === 'import' ? 'Imported Data' : 'Counter Staff Entry',
        'Internal Staff Notes': c.notes || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 30 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer_Directory');
    XLSX.writeFile(workbook, `${businessName.replace(/\s+/g, '_')}_Customers_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    link.download = `${businessName.replace(/\s+/g, '_')}_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF / Printable view
  const handleExportPDF = () => {
    setIsExportDropdownOpen(false);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-5 font-sans max-w-7xl mx-auto">
      {/* Page Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#14221d] tracking-tight flex items-center gap-2">
            <span>Customer Directory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f5eee3] text-[#4d3a28] border border-[#e5d7c3] font-bold">
              {customers.length} total
            </span>
          </h1>
          <p className="text-xs text-[#718079]">
            Showroom client records with location place, referral attribution, category, and filtered export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print Customer Data Button */}
          {permissions.canPrintData && customers.length > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1c2823] bg-white hover:bg-[#f6eee0] border border-[#dfd3bd] rounded-full shadow-xs transition-colors cursor-pointer"
              title="Print Customer Data"
            >
              <Printer className="w-3.5 h-3.5 text-[#b08738]" />
              <span>Print Data</span>
            </button>
          )}

          {/* Prominent Export Filtered Data Button */}
          {permissions.canExportData && filteredCustomers.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1c2823] bg-white hover:bg-[#f6eee0] border border-[#dfd3bd] rounded-full shadow-xs transition-colors cursor-pointer"
                title={`Export ${filteredCustomers.length} filtered customer records`}
              >
                <Download className="w-3.5 h-3.5 text-[#b08738]" />
                <span>Export Filtered ({filteredCustomers.length})</span>
                <ChevronDown className="w-3 h-3 text-[#b08738]" />
              </button>
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white border border-[#ede3d3] rounded-2xl shadow-xl z-30 py-2 text-xs">
                  <div className="px-3.5 py-1 text-[11px] font-bold text-[#b08738] border-b border-[#f2ebd9]">
                    Export Filtered ({filteredCustomers.length} Records)
                  </div>
                  <button
                    onClick={handleExportExcel}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[#14221d] hover:bg-[#faf6ef] transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Excel Spreadsheet (.xlsx)</span>
                      <span className="text-[10px] text-[#718079]">Filtered records with place & referral</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[#14221d] hover:bg-[#faf6ef] transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-bold block">CSV Format (.csv)</span>
                      <span className="text-[10px] text-[#718079]">Universal comma-separated file</span>
                    </div>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-[#14221d] hover:bg-[#faf6ef] transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#b08738] shrink-0" />
                    <div>
                      <span className="font-bold block">Printable Roster / PDF</span>
                      <span className="text-[10px] text-[#718079]">Print layout formatted for paper</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1c2823] bg-white hover:bg-[#f6eee0] border border-[#dfd3bd] rounded-full shadow-xs transition-colors cursor-pointer"
              title="Import outside customer data from Excel or CSV"
            >
              <Upload className="w-3.5 h-3.5 text-[#b08738]" />
              <span>Import Data</span>
            </button>
          )}

          {/* Add Customer Button */}
          {permissions.canAddEditCustomers && (
            <button
              onClick={onAddCustomer}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#f7eedf] bg-[#0b241c] hover:bg-[#12362b] active:scale-95 rounded-full shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#f7eedf] stroke-[2.5]" />
              <span>+ Add Customer</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-[#ffffff] p-4 sm:p-5 rounded-2xl border border-[#ede3d3] shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#b08738]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, place/town, referred by, or category..."
              className="w-full pl-10 pr-9 py-2 text-xs bg-[#faf7f0] border border-[#e5dac7] rounded-full transition-colors focus:outline-none focus:border-[#b08738] text-[#1c2621] placeholder:text-[#8a9691] font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718079] hover:text-[#14221d] cursor-pointer"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-[#faf7f0] border border-[#e5dac7] rounded-full px-3 py-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-[#b08738]" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-[#14221d] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Place Filter */}
            {uniqueCities.length > 0 && (
              <div className="flex items-center gap-1.5 bg-[#faf7f0] border border-[#e5dac7] rounded-full px-3 py-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5 text-[#b08738]" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent text-[#14221d] font-medium focus:outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Places ({uniqueCities.length})</option>
                  {uniqueCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 bg-[#faf7f0] border border-[#e5dac7] rounded-full px-3 py-1.5 text-xs">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-transparent text-[#14221d] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="all">All Sources</option>
                <option value="walkin_qr">Showroom QR</option>
                <option value="manual">Staff Manual</option>
                <option value="import">Bulk Imported</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 bg-[#faf7f0] border border-[#e5dac7] rounded-full px-3 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#b08738]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[#14221d] font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#718079] hover:text-[#14221d] bg-[#f5eee3] hover:bg-[#eae0d2] rounded-full transition-colors cursor-pointer border border-[#e5dac7]"
                title="Reset all filter fields"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Status & Filtered Export Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#718079] pt-1 border-t border-[#f2ebd9]">
          <div className="flex items-center gap-2">
            <span>Showing <strong className="text-[#14221d] font-semibold">{filteredCustomers.length}</strong> of {customers.length} customer records</span>
            {hasActiveFilters && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5eee3] text-[#4d3a28] border border-[#e5d7c3]">
                Filtered Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {filteredCustomers.length > 0 && permissions.canExportData && (
              <button
                type="button"
                onClick={handleExportExcel}
                className="text-[#0b241c] hover:underline flex items-center gap-1 font-bold cursor-pointer"
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
                className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer font-medium"
              >
                Clear database
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOMER RECORDS TABLE */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#ede3d3] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f5eee3] border border-[#e5d7c3] flex items-center justify-center mx-auto text-[#0b241c]">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#14221d]">
              {hasActiveFilters ? 'No customers match your search criteria' : 'No customers in directory yet'}
            </h3>
            <p className="text-xs text-[#718079] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Try broadening your search term or clearing one of the active filters above.'
                : 'Customers who scan your Showroom QR code will automatically appear here, or you can add them manually.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-bold bg-[#e2c082] hover:bg-[#d6ad64] text-[#14201a] rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={onNavigateToQR}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#0b241c] hover:bg-[#12362b] text-[#f7eedf] rounded-full shadow-xs transition-all cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View Showroom QR</span>
                  </button>
                  {permissions.canAddEditCustomers && (
                    <button
                      onClick={onAddCustomer}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-[#f6eee0] text-[#1c2823] rounded-full border border-[#dfd3bd] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#b08738]" />
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
              <thead className="bg-[#faf6ef] text-[#718079] font-medium border-b border-[#ede3d3]">
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
              <tbody className="divide-y divide-[#f2ebd9]">
                {filteredCustomers.map((customer) => {
                  const customerPlace = customer.place || customer.city;
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-[#faf7f2] transition-colors group"
                    >
                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f5eee3] border border-[#e5d7c3] flex items-center justify-center text-[#0b241c] font-bold text-xs shrink-0">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-[#14221d] group-hover:text-[#0b241c] transition-colors">
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div className="text-[11px] text-[#718079] flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-[#b08738]" />
                                <span>{customer.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[#33413b] font-semibold">
                          {customer.phone || 'No phone'}
                        </span>
                      </td>

                      {/* Customer Place */}
                      <td className="py-3.5 px-4">
                        {customerPlace ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-[#4d3a28] bg-[#f5eee3] border border-[#e5d7c3]">
                            <MapPin className="w-3 h-3 text-[#b08738]" />
                            <span>{customerPlace}</span>
                          </span>
                        ) : (
                          <span className="text-[#8a9691] text-[11px] italic">Not specified</span>
                        )}
                      </td>

                      {/* Referred By */}
                      <td className="py-3.5 px-4">
                        {customer.referredBy ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#4d3a28] bg-[#f5eee3] border border-[#e5d7c3]">
                            <UserCheck className="w-3 h-3 text-[#b08738]" />
                            <span>{customer.referredBy}</span>
                          </span>
                        ) : (
                          <span className="text-[#8a9691] text-[11px]">Direct Walk-In</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5eee3] text-[#4d3a28] border border-[#e5d7c3]">
                          {customer.categoryName || 'General'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        {customer.source === 'walkin_qr' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fbf3e4] text-[#9a7228] border border-[#ebd8b7]">
                            <QrCode className="w-3 h-3" />
                            <span>QR Standee</span>
                          </span>
                        ) : customer.source === 'import' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#f0f4f8] text-[#334e68] border border-[#d9e2ec]">
                            <Upload className="w-3 h-3" />
                            <span>Imported</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e8f5ee] text-[#0f3d2e] border border-[#c2e5d3]">
                            <span>Manual Staff</span>
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-[#718079] text-[11px] font-mono">
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
                              className="p-1.5 text-[#718079] hover:text-[#0b241c] hover:bg-[#f0e8dc] rounded-full transition-colors cursor-pointer"
                              title="Edit customer details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(customer.id, customer.name, customer.phone)}
                            disabled={isDeletingId === customer.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
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
