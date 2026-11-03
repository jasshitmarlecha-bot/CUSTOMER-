import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { DashboardView } from './components/dashboard/DashboardView.tsx';
import { CustomerListView } from './components/customers/CustomerListView.tsx';
import { CustomerImportView } from './components/customers/CustomerImportView.tsx';
import { CategoryView } from './components/categories/CategoryView.tsx';
import { QRIntakePortalView } from './components/intake/QRIntakePortalView.tsx';
import { PublicIntakeForm } from './components/intake/PublicIntakeForm.tsx';
import { DuplicateManagerView } from './components/cleaning/DuplicateManagerView.tsx';
import { UnifiedAnalysisCenter } from './components/analytics/UnifiedAnalysisCenter.tsx';
import { SettingsView } from './components/settings/SettingsView.tsx';
import { CustomerModal } from './components/customers/CustomerModal.tsx';
import { AuthPortal } from './components/auth/AuthPortal.tsx';
import { StaffAccessModal } from './components/admin/StaffAccessModal.tsx';
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  getStaffPermissions,
  updateStaffPermissions,
  updateUserPassword,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  clearAllCustomers,
  importCustomers,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSettings,
  updateSettings,
  clearAllQRScans
} from './api/client.ts';
import { Customer, Category, StaffUser, StaffPermissions, StoreSettings } from './types/index.ts';

const DEFAULT_ADMIN_PERMISSIONS: StaffPermissions = {
  canViewCustomers: true,
  canAddEditCustomers: true,
  canDeleteCustomers: true,
  canExportData: true,
  canImportData: true,
  canPrintData: true,
  canManageCategories: true,
  canRunCleaning: true,
  canViewAnalytics: true,
  canViewCommonQR: true
};

const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  canViewCustomers: true,
  canAddEditCustomers: true,
  canDeleteCustomers: false,
  canExportData: true,
  canImportData: false,
  canPrintData: true,
  canManageCategories: false,
  canRunCleaning: false,
  canViewAnalytics: true,
  canViewCommonQR: true
};

export default function App() {
  // Check if visitor is scanning the QR code at the counter
  const isDirectQRScan = typeof window !== 'undefined' && window.location.search.includes('intake=qr');

  // Authentication State: Require staff/admin password login to access database
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('custpro_staff_token');
      return Boolean(stored && stored !== 'logged_out');
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<StaffUser>({
    id: 'user-admin-1',
    name: 'Giri Admin',
    email: 'admin@girijewels.com',
    role: 'admin',
    avatar: '💎',
    token: 'token-admin-giri',
    permissions: DEFAULT_ADMIN_PERMISSIONS
  });

  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(DEFAULT_STAFF_PERMISSIONS);
  const [businessName, setBusinessName] = useState<string>('GIRI JEWELLERS');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isStaffAccessModalOpen, setIsStaffAccessModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!isDirectQRScan && isAuthenticated) {
      loadInitialData();
    } else {
      setIsLoading(false);
    }
  }, [isDirectQRScan, isAuthenticated]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [user, perms, custList, catList, settings] = await Promise.all([
        getCurrentUser().catch(() => currentUser),
        getStaffPermissions().catch(() => DEFAULT_STAFF_PERMISSIONS),
        getCustomers().catch(() => []),
        getCategories().catch(() => []),
        getSettings().catch(() => undefined)
      ]);

      if (user) setCurrentUser(user);
      if (perms) setStaffPermissions(perms);
      if (custList) setCustomers(custList);
      if (catList) setCategories(catList);
      if (settings) {
        setStoreSettings(settings);
        if (settings.businessName) setBusinessName(settings.businessName);
      }
    } catch (err) {
      console.warn('Initial data load notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Handlers
  const handleLoginSubmit = async (email: string, password?: string) => {
    return loginUser(email, password);
  };

  const handleLoginSuccess = async (user: StaffUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const perms = await getStaffPermissions().catch(() => DEFAULT_STAFF_PERMISSIONS);
    setStaffPermissions(perms);
    loadInitialData();
  };

  const handleLogout = () => {
    logoutUser();
    try {
      localStorage.setItem('custpro_staff_token', 'logged_out');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const handleSaveStaffPermissions = async (perms: StaffPermissions) => {
    const updated = await updateStaffPermissions(perms);
    setStaffPermissions(updated);
    if (currentUser.role === 'staff') {
      setCurrentUser(prev => ({ ...prev, permissions: updated }));
    }
  };

  const handleUpdatePassword = async (role: 'admin' | 'staff', newPass: string) => {
    await updateUserPassword(role, newPass);
  };

  // Customer Handlers
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (data: Partial<Customer> & { allowDuplicate?: boolean; updateExisting?: boolean }) => {
    if (data.id && data.updateExisting) {
      const updated = await updateCustomer(data.id, data);
      setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } else if (editingCustomer) {
      const updated = await updateCustomer(editingCustomer.id, data);
      setCustomers(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } else {
      const created = await createCustomer(data);
      setCustomers(prev => [created, ...prev]);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleClearAllCustomers = async () => {
    await clearAllCustomers();
    setCustomers([]);
  };

  const handleImportCustomers = async (items: any[], strategy: 'skip' | 'update' | 'all' = 'skip') => {
    const result = await importCustomers(items, strategy);
    const refreshed = await getCustomers();
    setCustomers(refreshed);
    return {
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      skippedCount: result.skippedCount,
      errors: result.errors
    };
  };

  // Category Handlers
  const handleCreateCategory = async (catData: { name: string; color?: string; description?: string }) => {
    const created = await createCategory(catData);
    setCategories(prev => [...prev, created]);
    return created;
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    const updated = await updateCategory(id, updates);
    setCategories(prev => prev.map(c => (c.id === id ? updated : c)));
    const refreshed = await getCustomers();
    setCustomers(refreshed);
    return updated;
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    const refreshed = await getCustomers();
    setCustomers(refreshed);
  };

  const handleUpdateBusinessName = async (name: string) => {
    setBusinessName(name);
    try {
      const updated = await updateSettings({ businessName: name });
      setStoreSettings(updated);
    } catch (err) {
      console.warn('Update settings error:', err);
    }
  };

  const handleUpdateStoreSettings = async (updates: Partial<StoreSettings>) => {
    try {
      const updated = await updateSettings(updates);
      setStoreSettings(updated);
      if (updated.businessName) {
        setBusinessName(updated.businessName);
      }
    } catch (err) {
      console.warn('Update store settings error:', err);
      throw err;
    }
  };

  const handleClearAllQRData = async () => {
    await clearAllQRScans();
    await loadInitialData();
  };

  // 1. Direct Walk-in QR scan on customer's phone (No authentication required for public customers)
  if (isDirectQRScan) {
    return <PublicIntakeForm businessName={businessName} />;
  }

  // 2. Management System Login Portal (Password protected entrance & reset flow)
  if (!isAuthenticated) {
    return (
      <AuthPortal
        onLoginSubmit={handleLoginSubmit}
        onLoginSuccess={handleLoginSuccess}
        businessName={businessName}
      />
    );
  }

  const permissions = currentUser.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : (currentUser.permissions || staffPermissions);

  return (
    <div className="min-h-screen bg-[#0c070e] text-white flex flex-col font-sans selection:bg-[#dfb76c] selection:text-[#1a1104]">
      {/* Top Navbar with Giri Jewels branding, staff role indicator and mobile operations drawer toggle */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenStaffAccessModal={() => setIsStaffAccessModalOpen(true)}
        onOpenAddCustomer={handleOpenAddCustomer}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsMobileDrawerOpen(false);
        }}
        businessName={businessName}
        onToggleMobileMenu={() => setIsMobileDrawerOpen(prev => !prev)}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto relative">
        {/* Left Navigation Sidebar with Showroom QR Center, Desktop persistent view & Mobile slide-over drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileDrawerOpen(false);
          }}
          onOpenAddCustomer={handleOpenAddCustomer}
          onOpenStaffAccessModal={() => setIsStaffAccessModalOpen(true)}
          customerCount={customers.length}
          currentUser={currentUser}
          isMobileOpen={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Floating Operations Drawer Trigger for Mobile & Tablet */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="lg:hidden fixed bottom-6 left-4 z-40 px-3.5 py-2.5 rounded-full bg-[#1e1120] text-[#faeed4] hover:bg-[#2b172d] border border-[#dfb76c]/70 shadow-2xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all backdrop-blur-md"
          title="Open Operations Drawer"
        >
          <span className="w-2 h-2 rounded-full bg-[#dfb76c] animate-pulse" />
          <span className="text-xs font-bold">Operations</span>
        </button>

        {/* Dynamic Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              categories={categories}
              currentUser={currentUser}
              businessName={businessName}
              storeSettings={storeSettings}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenAddCustomer={handleOpenAddCustomer}
              onSelectCustomer={handleEditCustomer}
            />
          )}

          {activeTab === 'customers' && (
            permissions.canViewCustomers ? (
              <CustomerListView
                customers={customers}
                categories={categories}
                currentUser={currentUser}
                onAddCustomer={handleOpenAddCustomer}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
                onClearAllCustomers={handleClearAllCustomers}
                onNavigateToQR={() => setActiveTab('qr_common')}
                onImportCustomers={handleImportCustomers}
                onNavigateToImport={() => setActiveTab('import')}
                businessName={businessName}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">You do not have permission to view the Customer Directory. Please request access from the Store Admin.</p>
              </div>
            )
          )}

          {/* Import Data: Dedicated Menu Operation */}
          {activeTab === 'import' && (
            permissions.canImportData ? (
              <CustomerImportView
                existingCustomers={customers}
                onImportComplete={handleImportCustomers}
                onNavigateToDirectory={() => setActiveTab('customers')}
                totalCustomersCount={customers.length}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">You do not have permission to import customer records. Please contact Store Admin.</p>
              </div>
            )
          )}

          {/* Duplicate Manager: Dedicated Store Operation */}
          {activeTab === 'duplicates' && (
            permissions.canRunCleaning ? (
              <DuplicateManagerView
                customers={customers}
                onRefreshAll={async () => {
                  const refreshed = await getCustomers();
                  setCustomers(refreshed);
                }}
                onEditCustomer={handleEditCustomer}
                onNavigateToDirectory={() => setActiveTab('customers')}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">You do not have permission to manage duplicates. Please contact Store Admin.</p>
              </div>
            )
          )}

          {/* Showroom QR Portal: Clean 2-Tab View (Counter Standee & Activity) */}
          {(activeTab === 'intake' ||
            activeTab === 'qr_common' ||
            activeTab === 'qr_analytics' ||
            activeTab === 'qr_activity' ||
            activeTab === 'qr_print') && (
            permissions.canViewCommonQR ? (
              <QRIntakePortalView
                businessName={businessName}
                categories={categories}
                initialSubTab={
                  activeTab === 'qr_activity'
                    ? 'activity'
                    : 'common_qr'
                }
                onRefreshData={loadInitialData}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">Common QR portal is restricted for your account.</p>
              </div>
            )
          )}

          {activeTab === 'categories' && (
            permissions.canManageCategories ? (
              <CategoryView
                categories={categories}
                customers={customers}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">Category management is restricted to Store Admin.</p>
              </div>
            )
          )}

          {activeTab === 'cleaning' && (
            permissions.canRunCleaning ? (
              <UnifiedAnalysisCenter
                customers={customers}
                categories={categories}
                initialSection="quality"
                onRefreshData={loadInitialData}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">Data quality & duplicate analysis is reserved for Store Admin.</p>
              </div>
            )
          )}

          {activeTab === 'analytics' && (
            permissions.canViewAnalytics ? (
              <UnifiedAnalysisCenter
                customers={customers}
                categories={categories}
                initialSection="scans"
                onRefreshData={loadInitialData}
                onEditCustomer={handleEditCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            ) : (
              <div className="bg-[#160d16] border border-[#392233] rounded-2xl p-8 text-center space-y-3">
                <p className="text-[#dfb76c] font-bold">Access Restricted</p>
                <p className="text-xs text-purple-300/70">Store intelligence & scan analytics are restricted.</p>
              </div>
            )
          )}

          {activeTab === 'settings' && (
            <SettingsView
              businessName={businessName}
              onUpdateBusinessName={handleUpdateBusinessName}
              customers={customers}
              categories={categories}
              storeSettings={storeSettings}
              onUpdateSettings={handleUpdateStoreSettings}
              onClearAllCustomers={handleClearAllCustomers}
              onClearAllQRData={handleClearAllQRData}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customer={editingCustomer}
        categories={categories}
        existingCustomers={customers}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* Admin Staff Access & Permissions Modal */}
      <StaffAccessModal
        isOpen={isStaffAccessModalOpen}
        onClose={() => setIsStaffAccessModalOpen(false)}
        currentPermissions={staffPermissions}
        onSavePermissions={handleSaveStaffPermissions}
        onUpdatePassword={handleUpdatePassword}
      />
    </div>
  );
}
