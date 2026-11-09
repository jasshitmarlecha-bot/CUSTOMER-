import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  ShieldCheck,
  QrCode,
  UserPlus,
  Upload,
  Store,
  Users,
  ChevronRight,
  Gem,
  LogOut
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
        return { section: 'Store Operations', page: 'Store Dashboard', icon: Store, parentTab: 'dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);
  const displayName = currentUser?.name || 'Store Manager';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="bg-[rgba(255,248,242,0.85)] backdrop-blur-xl border-b border-[#ebd5c4] shadow-xs sticky top-0 z-30 transition-all select-none">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 gap-3">
        {/* Left Side: Mobile Menu Button & Breadcrumb Trail */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-full text-[#381504] hover:bg-[#faeee4] transition-colors cursor-pointer border border-[#ebd5c4] shrink-0"
            aria-label="Open mobile navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dashboard')}
            className="lg:hidden flex items-center space-x-2 text-left truncate cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0 shadow-xs">
              <Gem className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-cinzel font-bold text-xs tracking-wider text-[#381504] uppercase truncate">
              {businessName || 'GIRI JEWELLERS'}
            </span>
          </button>

          {/* Desktop Interactive Breadcrumb Trail */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#703816]">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 hover:text-[#b34710] transition-colors cursor-pointer group"
              title="Return to Store Dashboard"
            >
              <Store className="w-3.5 h-3.5 text-[#b34710] group-hover:scale-110 transition-transform" />
              <span className="font-cinzel font-bold tracking-wider text-[#381504] uppercase text-[11px]">
                {businessName}
              </span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-[#c49a82]" />
            <span className="text-[#8a5236] text-[11px] font-medium">{breadcrumb.section}</span>

            <ChevronRight className="w-3.5 h-3.5 text-[#c49a82]" />
            <button
              type="button"
              onClick={() => onNavigateTab(breadcrumb.parentTab)}
              className="text-[#381504] font-bold text-xs hover:text-[#b34710] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{breadcrumb.page}</span>
            </button>
          </div>
        </div>

        {/* Center: Global Instant Search with Keyboard Shortcut & Live Dropdown Preview */}
        <div className="relative flex-1 max-w-sm xl:max-w-md hidden md:block" ref={searchContainerRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8a5236]">
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
              className="w-full pl-9 pr-14 py-2 text-xs bg-white/95 border border-[#ebd5c4] hover:border-[#b34710] focus:border-[#b34710] rounded-full text-[#381504] placeholder-[#8a5236] shadow-xs focus:outline-none focus:ring-1 focus:ring-[#b34710]/20 transition-all font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8a5236] bg-[#faeee4] border border-[#ebd5c4] rounded-md">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Instant Search Dropdown Preview */}
          {isSearchFocused && searchValue.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 glass-panel border border-[#ebd5c4] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#f0ded2] text-[11px] text-[#8a5236]">
                <span>
                  {searchResults.length > 0
                    ? `Found ${searchResults.length} matching result(s)`
                    : 'No customer records match this search'}
                </span>
                <span className="font-mono text-[10px] text-[#8a5236]">Press Enter for Directory</span>
              </div>

              {searchResults.length > 0 && (
                <div className="divide-y divide-[#f0ded2] max-h-64 overflow-y-auto">
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
                      className="p-2.5 hover:bg-[#faeee4] rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#381504] group-hover:text-[#b34710] transition-colors truncate">
                          {cust.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#703816] mt-0.5">
                          <span className="font-mono text-[#b34710] font-bold">{cust.phone}</span>
                          {(cust.place || cust.city) && (
                            <span className="truncate">• {cust.place || cust.city}</span>
                          )}
                        </div>
                      </div>

                      {cust.categoryName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdeade] text-[#b34710] border border-[#f5c7a9] shrink-0">
                          {cust.categoryName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#f0ded2] px-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    onNavigateTab('customers');
                  }}
                  className="text-xs font-bold text-[#b34710] hover:underline cursor-pointer"
                >
                  View all results in Customer Directory →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Actions matching screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
          {/* Quick Jump: QR Standee Center */}
          <button
            type="button"
            onClick={() => onNavigateTab('qr_common')}
            className={`hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${activeTab === 'qr_common' || activeTab.startsWith('qr_')
                ? 'bg-[#381504] text-white border border-[#381504]'
                : 'text-[#381504] bg-white/90 hover:bg-[#faeee4] border border-[#ebd5c4]'
              }`}
            title="Open Showroom QR Center"
          >
            <QrCode className="w-3.5 h-3.5 text-[#b34710]" />
            <span>QR Center</span>
          </button>

          {/* Quick Jump: Import Outside Data */}
          {permissions.canImportData && (
            <button
              type="button"
              onClick={() => onNavigateTab('import')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${activeTab === 'import'
                  ? 'bg-[#381504] text-white border border-[#381504]'
                  : 'text-[#381504] bg-white/90 hover:bg-[#faeee4] border border-[#ebd5c4]'
                }`}
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className="w-3.5 h-3.5 text-[#b34710]" />
              <span>Import Data</span>
            </button>
          )}

          {/* Primary Quick Walk-In Button */}
          {permissions.canAddEditCustomers && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              className="glow-btn inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer"
              title="Register a new walk-in customer (Keyboard shortcut: N)"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.4]" />
              <span>Add Walk In</span>
            </button>
          )}

          {/* Staff Access Control shortcut button */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={onOpenStaffAccessModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#381504] bg-white/90 hover:bg-[#faeee4] border border-[#ebd5c4] shadow-xs cursor-pointer transition-all"
              title="Manage staff users, passwords, and permissions"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#b34710]" />
              <span>Staff Access Control</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={() => setShowNotificationMenu((prev) => !prev)}
              className="relative p-2 rounded-full bg-white/90 hover:bg-[#faeee4] border border-[#ebd5c4] text-[#381504] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Showroom Notifications & Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#381504]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#b34710] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                2
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 glass-panel border border-[#ebd5c4] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-[#381504]">
                <div className="flex items-center justify-between pb-2 border-b border-[#ebd5c4] px-1">
                  <span className="text-xs font-bold text-[#381504]">Showroom Alerts</span>
                  <span className="text-[10px] font-semibold text-white bg-[#b34710] px-2 py-0.5 rounded-full">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-[#ebd5c4] mt-1 text-xs">
                  <div
                    onClick={() => {
                      onNavigateTab('duplicates');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-[#faeee4] rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-[#381504] leading-tight">Data Hygiene Alert</p>
                    <p className="text-[11px] text-[#703816] mt-0.5">
                      Duplicate phone records detected. Click to resolve in Duplicate Manager.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onNavigateTab('qr_common');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-[#faeee4] rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-[#381504] leading-tight">Showroom QR Active</p>
                    <p className="text-[11px] text-[#703816] mt-0.5">
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
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/90 hover:bg-[#faeee4] border border-[#ebd5c4] transition-all cursor-pointer shadow-xs group active:scale-95"
              aria-label="User Profile Menu"
            >
              <div className="text-left hidden sm:block">
                <span className="block text-[9.5px] uppercase tracking-wider text-[#8a5236] font-bold">
                  Store Manager
                </span>
                <span className="block text-xs font-bold text-[#381504] leading-none">
                  Store Admin
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-[#8a5236] group-hover:text-[#381504] transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-panel border border-[#ebd5c4] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs text-[#381504]">
                <div className="p-2.5 pb-2 border-b border-[#ebd5c4]">
                  <p className="font-bold text-[#381504] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#703816] capitalize font-medium">
                    Store Administrator
                  </p>
                </div>

                <div className="p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenStaffAccessModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#381504] hover:bg-[#faeee4] font-medium transition-colors cursor-pointer text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#b34710]" />
                    <span>Staff Access Control</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('qr_common');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#381504] hover:bg-[#faeee4] font-medium transition-colors cursor-pointer text-left"
                  >
                    <QrCode className="w-4 h-4 text-[#b34710]" />
                    <span>Showroom QR Standee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#381504] hover:bg-[#faeee4] font-medium transition-colors cursor-pointer text-left"
                  >
                    <Store className="w-4 h-4 text-[#b34710]" />
                    <span>Store Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#ebd5c4]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#381504] hover:bg-[#faeee4] font-semibold transition-colors cursor-pointer text-left"
                  >
                    <Store className="w-4 h-4 text-[#b34710]" />
                    <span>Reload Store Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Log Out Button matching screenshot */}
          <button
            type="button"
            onClick={onLogout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#8a5236] bg-white/90 hover:bg-[#faeee4] hover:text-[#381504] border border-[#ebd5c4] shadow-xs cursor-pointer transition-all active:scale-95"
            title="Log Out of Showroom Suite"
          >
            <LogOut className="w-3.5 h-3.5 text-[#8a5236]" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
