import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  ShieldCheck,
  LogOut,
  QrCode,
  UserPlus,
  Upload,
  Store,
  Users,
  ChevronRight,
  Gem
} from 'lucide-react';
import { StaffUser, Customer } from '../../types/index.ts';

interface NavbarProps {
  currentUser: StaffUser;
  onLogout: () => void;
  onOpenStaffAccessModal: () => void;
  onOpenAddCustomer: () => void;
  onNavigateTab: (tab: string) => void;
  businessName: string;
  onToggleMobileMenu?: () => void;
  activeTab?: string;
  onSearchQuery?: (q: string) => void;
  customers?: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onOpenStaffAccessModal,
  onOpenAddCustomer,
  onNavigateTab,
  businessName,
  onToggleMobileMenu,
  activeTab = 'dashboard',
  onSearchQuery,
  customers = [],
  onSelectCustomer
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const permissions = currentUser.permissions || {
    canAddEditCustomers: currentUser.role === 'admin',
    canImportData: currentUser.role === 'admin',
    canViewCommonQR: true
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target as Node)) {
        setShowNotificationMenu(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setShowProfileMenu(false);
        setShowNotificationMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (onSearchQuery) {
      onSearchQuery(val);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsSearchFocused(false);
      onNavigateTab('customers');
    }
  };

  // Instant Search Results Dropdown Preview
  const searchResults = useMemo(() => {
    if (!searchValue.trim() || customers.length === 0) return [];
    const q = searchValue.toLowerCase().trim();
    return customers
      .filter((c) => {
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.place?.toLowerCase().includes(q) ||
          c.referredBy?.toLowerCase().includes(q) ||
          c.categoryName?.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }, [searchValue, customers]);

  // Clickable Breadcrumbs Wayfinding Info
  const getBreadcrumb = (tab: string) => {
    switch (tab) {
      case 'customers':
        return { section: 'Store Operations', page: 'Customer Directory', icon: Users, parentTab: 'customers' };
      case 'import':
        return { section: 'Store Operations', page: 'Import Data', icon: Upload, parentTab: 'import' };
      case 'duplicates':
        return { section: 'Store Operations', page: 'Duplicate Manager', icon: ShieldCheck, parentTab: 'duplicates' };
      case 'qr_common':
      case 'intake':
      case 'qr_activity':
      case 'qr_analytics':
      case 'qr_print':
        return { section: 'Store Operations', page: 'Showroom QR Center', icon: QrCode, parentTab: 'qr_common' };
      case 'analytics':
      case 'cleaning':
        return { section: 'Store Analytics', page: 'Performance & Footfall Hub', icon: Store, parentTab: 'analytics' };
      case 'categories':
        return { section: 'Showroom Setup', page: 'Jewellery Categories', icon: Gem, parentTab: 'categories' };
      case 'settings':
        return { section: 'Showroom Setup', page: 'Settings & Backups', icon: ShieldCheck, parentTab: 'settings' };
      default:
        return { section: 'Store Operations', page: 'Dashboard', icon: Store, parentTab: 'dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);
  const displayName = currentUser?.name || 'Store Manager';
  const displayFirstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="glass-panel border-x-0 border-t-0 rounded-none bg-neutral-950/75 backdrop-blur-2xl border-b border-orange-500/15 sticky top-0 z-30 transition-all select-none">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 gap-3">
        {/* Left Side: Mobile Menu Button & Breadcrumb Trail */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-800 shrink-0"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Name */}
          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            className="lg:hidden flex items-center space-x-2 text-left truncate cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0 shadow-xs">
              <Gem className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs tracking-wider gold-gradient-text uppercase truncate">
              {businessName || 'GIRI JEWELLERS'}
            </span>
          </button>

          {/* Desktop Interactive Breadcrumb Trail */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-neutral-400">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
              title="Return to Store Dashboard"
            >
              <Store className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-wider gold-gradient-text uppercase text-[11px]">
                {businessName}
              </span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-neutral-400 text-[11px] font-medium">{breadcrumb.section}</span>

            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
            <button
              type="button"
              onClick={() => onNavigateTab(breadcrumb.parentTab)}
              className="text-neutral-200 font-bold text-xs hover:text-orange-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{breadcrumb.page}</span>
            </button>
          </div>
        </div>

        {/* Center: Global Instant Search with Keyboard Shortcut & Live Dropdown Preview */}
        <div className="relative flex-1 max-w-sm xl:max-w-md hidden md:block" ref={searchContainerRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search customers, phones, places..."
              className="w-full pl-9 pr-14 py-2 text-xs bg-neutral-900/80 border border-neutral-700/60 hover:border-orange-500/40 focus:border-orange-500 rounded-xl text-neutral-100 placeholder-neutral-500 shadow-inner focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-md">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Instant Search Dropdown Preview */}
          {isSearchFocused && searchValue.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 glass-panel border border-orange-500/25 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-neutral-800 text-[11px] text-neutral-400">
                <span>
                  {searchResults.length > 0
                    ? `Found ${searchResults.length} matching result(s)`
                    : 'No customer records match this search'}
                </span>
                <span className="font-mono text-[10px] text-neutral-500">Press Enter for Directory</span>
              </div>

              {searchResults.length > 0 && (
                <div className="divide-y divide-neutral-800 max-h-64 overflow-y-auto">
                  {searchResults.map((cust) => (
                    <div
                      key={cust.id}
                      onClick={() => {
                        setIsSearchFocused(false);
                        if (onSelectCustomer) {
                          onSelectCustomer(cust);
                        } else {
                          onNavigateTab('customers');
                        }
                      }}
                      className="p-2.5 hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-200 group-hover:text-orange-400 transition-colors truncate">
                          {cust.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                          <span className="font-mono text-orange-400 font-semibold">{cust.phone}</span>
                          {(cust.place || cust.city) && (
                            <span className="truncate">• {cust.place || cust.city}</span>
                          )}
                        </div>
                      </div>

                      {cust.categoryName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
                          {cust.categoryName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-neutral-800 px-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    onNavigateTab('customers');
                  }}
                  className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                >
                  View all results in Customer Directory →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Fast 1-Click Action Buttons + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Quick Jump: QR Standee Center */}
          <button
            type="button"
            onClick={() => onNavigateTab('qr_common')}
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${activeTab === 'qr_common' || activeTab.startsWith('qr_')
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                : 'text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:text-white'
              }`}
            title="Open Showroom QR Center"
          >
            <QrCode className="w-3.5 h-3.5 text-orange-400" />
            <span>QR Center</span>
          </button>

          {/* Quick Jump: Import Outside Data */}
          {permissions.canImportData && (
            <button
              type="button"
              onClick={() => onNavigateTab('import')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${activeTab === 'import'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                  : 'text-neutral-300 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 hover:text-white'
                }`}
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Import</span>
            </button>
          )}

          {/* Primary Quick Walk-In Button */}
          {permissions.canAddEditCustomers && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              className="glow-btn inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-medium text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
              title="Register a new walk-in customer (Keyboard shortcut: N)"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Add Walk-In</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={() => setShowNotificationMenu((prev) => !prev)}
              className="relative p-2 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
              title="Showroom Notifications & Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-neutral-300" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-neutral-950 shadow-xs">
                2
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 glass-panel border border-orange-500/25 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-neutral-100">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 px-1">
                  <span className="text-xs font-bold text-neutral-200">Showroom Alerts</span>
                  <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-neutral-800 mt-1 text-xs">
                  <div
                    onClick={() => {
                      onNavigateTab('duplicates');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-neutral-200 leading-tight">Data Hygiene Alert</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Duplicate phone records detected. Click to resolve in Duplicate Manager.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onNavigateTab('qr_common');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-neutral-800/50 rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-neutral-200 leading-tight">Showroom QR Active</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Counter QR Standee ready for self-service walk-in registration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 transition-all cursor-pointer shadow-xs group active:scale-95"
              aria-label="User Profile Menu"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                {initials}
              </div>

              <span className="text-xs font-semibold text-neutral-200 tracking-tight hidden sm:inline">
                Hello, {displayFirstName}
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-panel border border-orange-500/25 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs text-neutral-200">
                <div className="p-2.5 pb-2 border-b border-neutral-800">
                  <p className="font-bold text-neutral-100 truncate">{displayName}</p>
                  <p className="text-[11px] text-neutral-400 capitalize font-medium">
                    {currentUser.role === 'admin' ? 'Store Administrator' : 'Counter Staff'}
                  </p>
                </div>

                <div className="p-1 space-y-0.5">
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onOpenStaffAccessModal();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 font-medium transition-colors cursor-pointer text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Staff Access Control</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('qr_common');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 font-medium transition-colors cursor-pointer text-left"
                  >
                    <QrCode className="w-4 h-4 text-orange-400" />
                    <span>Showroom QR Standee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 font-medium transition-colors cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                    <span>Store Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800/60 font-medium transition-colors cursor-pointer text-left"
                  >
                    <Store className="w-4 h-4 text-orange-400" />
                    <span>Reload Store Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
