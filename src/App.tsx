import React, { useState, useEffect } from 'react';
import { Store, Users, QrCode, UserPlus, Menu } from 'lucide-react';
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
import { VideoBackground } from './components/layout/VideoBackground.tsx';
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

const VALID_TABS = [
  'dashboard',
  'customers',
  'import',
  'duplicates',
  'qr_common',
  'intake',
  'qr_analytics',
  'qr_activity',
  'qr_print',
  'categories',
  'cleaning',
  'analytics',
  'settings'
];

const getTabFromHash = (): string => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
  return VALID_TABS.includes(hash) ? hash : 'dashboard';
};

export default function App() {
  // Check if visitor is scanning the QR code at the counter
  const isDirectQRScan = typeof window !== 'undefined' && window.location.search.includes('intake=qr');

  // Direct showroom access without login screen for both store admin and staff
  const [activeTab, setActiveTab] = useState<string>(() => getTabFromHash());
  const [currentUser, setCurrentUser] = useState<StaffUser>({
    id: 'user-admin-1',
    name: 'Giri Admin',
    email: 'admin@girijewels.com',
    role: 'admin',
    avatar: '💎',
    token: 'token-admin-giri',
    permissions: DEFAULT_ADMIN_PERMISSIONS
  });

  const [staffPermissions, setStaffPermissions] = useState<StaffPermissions>(DEFAULT_ADMIN_PERMISSIONS);
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
    if (!isDirectQRScan) {
      loadInitialData();
    } else {
      setIsLoading(false);
    }
  }, [isDirectQRScan]);

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

  // Synchronize activeTab with URL Hash for natural Back / Forward browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const currentHashTab = getTabFromHash();
      setActiveTab(currentHashTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    // If initial URL has no hash, set it without cluttering history
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.history.replaceState(null, '', `/#/${activeTab}`);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleNavigateTab = (tab: string, replace = false) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      const targetHash = `#/${tab}`;
      if (window.location.hash !== targetHash) {
        if (replace) {
          window.history.replaceState(null, '', targetHash);
        } else {
          window.history.pushState(null, '', targetHash);
        }
      }
    }
  };

  // Global Keyboard Shortcuts for Navigation
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName) || target?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleNavigateTab('dashboard');
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleNavigateTab('customers');
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        handleNavigateTab('qr_common');
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleNavigateTab('analytics');
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

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
    window.location.reload();
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

  // Direct Walk-in QR scan on customer's phone (No authentication required for public customers)
  if (isDirectQRScan) {
    return <PublicIntakeForm businessName={businessName} />;
  }

  // Open direct showroom access for both store admin and staff (no login barrier)
  const permissions = currentUser.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : (currentUser.permissions || DEFAULT_ADMIN_PERMISSIONS);

  return (
    <div className="min-h-screen bg-transparent text-neutral-100 flex flex-col lg:flex-row font-sans selection:bg-orange-500 selection:text-white relative z-10 overflow-x-hidden">
      {/* Luxury Gold Metallic Scrolling Video Background */}
      <VideoBackground />

      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        onOpenAddCustomer={handleOpenAddCustomer}
        onOpenStaffAccessModal={() => setIsStaffAccessModalOpen(true)}
        customerCount={customers.length}
        currentUser={currentUser}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
      />

      {/* Right Column: Top Navbar & Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenStaffAccessModal={() => setIsStaffAccessModalOpen(true)}
          onOpenAddCustomer={handleOpenAddCustomer}
          onNavigateTab={handleNavigateTab}
          businessName={businessName}
          onToggleMobileMenu={() => setIsMobileDrawerOpen(prev => !prev)}
          activeTab={activeTab}
          customers={customers}
          onSelectCustomer={handleEditCustomer}
        />

        {/* Dynamic Content Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-28 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              categories={categories}
              currentUser={currentUser}
              businessName={businessName}
              storeSettings={storeSettings}
              onNavigateTab={handleNavigateTab}
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
                onNavigateToQR={() => handleNavigateTab('qr_common')}
                onImportCustomers={handleImportCustomers}
                onNavigateToImport={() => handleNavigateTab('import')}
                businessName={businessName}
              />
            ) : (
              <div className="glass-panel border border-orange-500/20 rounded-2xl p-8 text-center space-y-3 shadow-xl">
                <p className="text-amber-400 font-bold">Access Restricted</p>
                <p className="text-xs text-neutral-400">You do not have permission to view the Customer Directory. Please request access from the Store Admin.</p>
              </div>
            )
          )}

          {/* Import Data: Dedicated Menu Operation */}
          {activeTab === 'import' && (
            permissions.canImportData ? (
              <CustomerImportView
                existingCustomers={customers}
                onImportComplete={handleImportCustomers}
                onNavigateToDirectory={() => handleNavigateTab('customers')}
                totalCustomersCount={customers.length}
              />
            ) : (
              <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <p className="text-[#b08738] font-bold">Access Restricted</p>
                <p className="text-xs text-[#718079]">You do not have permission to import customer records. Please contact Store Admin.</p>
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
                onNavigateToDirectory={() => handleNavigateTab('customers')}
              />
            ) : (
              <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <p className="text-[#b08738] font-bold">Access Restricted</p>
                <p className="text-xs text-[#718079]">You do not have permission to manage duplicates. Please contact Store Admin.</p>
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
                <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                  <p className="text-[#b08738] font-bold">Access Restricted</p>
                  <p className="text-xs text-[#718079]">Common QR portal is restricted for your account.</p>
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
              <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <p className="text-[#b08738] font-bold">Access Restricted</p>
                <p className="text-xs text-[#718079]">Category management is restricted to Store Admin.</p>
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
              <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <p className="text-[#b08738] font-bold">Access Restricted</p>
                <p className="text-xs text-[#718079]">Data quality & duplicate analysis is reserved for Store Admin.</p>
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
              <div className="bg-[#fffcf7] border border-[#ede3d3] rounded-2xl p-8 text-center space-y-3 shadow-xs">
                <p className="text-[#b08738] font-bold">Access Restricted</p>
                <p className="text-xs text-[#718079]">Store intelligence & scan analytics are restricted.</p>
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

      {/* Mobile & Tablet Bottom Navigation Bar (1-Thumb Ergonomic Quick Access) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel bg-neutral-950/90 backdrop-blur-2xl border-t border-orange-500/20 shadow-[0_-4px_25px_rgba(0,0,0,0.7)] px-2 py-1.5 flex items-center justify-around"
      >
        {/* 1. Dashboard */}
        <button
          type="button"
          onClick={() => handleNavigateTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${activeTab === 'dashboard'
            ? 'text-orange-400 font-bold'
            : 'text-neutral-400 hover:text-neutral-200'
            }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}`}>
            <Store className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Dashboard</span>
        </button>

        {/* 2. Customer Directory */}
        <button
          type="button"
          onClick={() => handleNavigateTab('customers')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative cursor-pointer ${activeTab === 'customers'
            ? 'text-orange-400 font-bold'
            : 'text-neutral-400 hover:text-neutral-200'
            }`}
        >
          <div className={`p-1 rounded-lg relative ${activeTab === 'customers' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}`}>
            <Users className="w-5 h-5" />
            {customers.length > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-orange-500 text-white text-[9px] font-black rounded-full shadow-xs">
                {customers.length}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Customers</span>
        </button>

        {/* 3. Center Elevated + Walk-In Button */}
        {permissions.canAddEditCustomers && (
          <button
            type="button"
            onClick={handleOpenAddCustomer}
            className="glow-btn flex flex-col items-center justify-center -translate-y-3 px-3.5 py-2 rounded-2xl text-white font-bold shadow-lg shadow-orange-500/40 border border-orange-400/50 active:scale-95 transition-transform cursor-pointer"
            title="Add Walk-In Customer"
          >
            <UserPlus className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide mt-0.5">+ Walk-In</span>
          </button>
        )}

        {/* 4. Showroom QR Portal */}
        <button
          type="button"
          onClick={() => handleNavigateTab('qr_common')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${activeTab.startsWith('qr') || activeTab === 'intake'
            ? 'text-orange-400 font-bold'
            : 'text-neutral-400 hover:text-neutral-200'
            }`}
        >
          <div className={`p-1 rounded-lg ${activeTab.startsWith('qr') || activeTab === 'intake' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}`}>
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">QR Center</span>
        </button>

        {/* 5. More / Menu Drawer */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(prev => !prev)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${isMobileDrawerOpen ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          title="Open Operations Menu"
        >
          <div className={`p-1 rounded-lg ${isMobileDrawerOpen ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Menu</span>
        </button>
      </nav>

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
