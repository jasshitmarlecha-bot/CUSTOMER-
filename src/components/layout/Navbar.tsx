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
  User,
  X,
  ExternalLink,
  Store,
  Users,
  CopyCheck,
  BarChart3,
  Tags,
  Settings,
  ChevronRight,
  Phone,
  MapPin,
  Sparkles
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
        return { section: 'Store Operations', page: 'Import Customer Data', icon: Upload, parentTab: 'import' };
      case 'duplicates':
        return { section: 'Store Operations', page: 'Duplicate Manager', icon: CopyCheck, parentTab: 'duplicates' };
      case 'qr_common':
      case 'intake':
      case 'qr_print':
      case 'qr_activity':
        return { section: 'Store Operations', page: 'Showroom QR Standee', icon: QrCode, parentTab: 'qr_common' };
      case 'analytics':
      case 'cleaning':
        return { section: 'Store Analytics', page: 'Footfall & Performance', icon: BarChart3, parentTab: 'analytics' };
      case 'categories':
        return { section: 'Showroom Setup', page: 'Jewellery Categories', icon: Tags, parentTab: 'categories' };
      case 'settings':
        return { section: 'Showroom Setup', page: 'Settings & Backups', icon: Settings, parentTab: 'settings' };
      case 'dashboard':
      default:
        return { section: 'Store Operations', page: 'Store Dashboard', icon: Store, parentTab: 'dashboard' };
    }
  };

  const breadcrumb = getBreadcrumb(activeTab);

  // User display name & initials (defaults to Jatin / JD from design mockup)
  const displayName = currentUser.name && currentUser.name !== 'Giri Admin' ? currentUser.name : 'Jatin';
  const displayFirstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'JD';

  return (
    <header className="bg-[#fcf8f4]/95 backdrop-blur-md border-b border-[#ebdcd3] sticky top-0 z-30 shadow-xs select-none">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button + Clickable Breadcrumbs Wayfinding */}
        <div className="flex items-center gap-3 min-w-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-full bg-[#ffffff] text-[#2a0717] hover:bg-[#faede6] border border-[#ebdcd3] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all shrink-0 active:scale-95"
              title="Open Navigation Menu"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5 text-[#3d0c22]" />
            </button>
          )}

          {/* Mobile visible logo */}
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="lg:hidden flex items-center gap-2 text-left focus:outline-none cursor-pointer truncate"
          >
            <div className="w-6 h-6 shrink-0 text-[#dfb76c]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 3h12l4 6-10 12L2 9z" />
                <path d="M11 3v18" />
                <path d="M2 9h20" />
              </svg>
            </div>
            <span className="font-cinzel text-xs font-black tracking-wider text-[#2a0717] uppercase truncate">
              {businessName || 'GIRI JEWELLERS'}
            </span>
          </button>

          {/* Desktop Interactive Breadcrumb Trail */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#876876]">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="flex items-center gap-1.5 hover:text-[#2a0717] transition-colors cursor-pointer group"
              title="Return to Store Dashboard"
            >
              <Store className="w-3.5 h-3.5 text-[#3d0c22] group-hover:scale-110 transition-transform" />
              <span className="font-cinzel text-[11px] font-bold uppercase tracking-wider text-[#2a0717]">
                {businessName}
              </span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-[#cfb6c2]" />
            <span className="text-[#8a6877] text-[11px] font-medium">{breadcrumb.section}</span>

            <ChevronRight className="w-3.5 h-3.5 text-[#cfb6c2]" />
            <button
              type="button"
              onClick={() => onNavigateTab(breadcrumb.parentTab)}
              className="text-[#2a0717] font-bold text-xs hover:underline transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{breadcrumb.page}</span>
            </button>
          </div>
        </div>

        {/* Center: Global Instant Search with Keyboard Shortcut & Live Dropdown Preview */}
        <div className="relative flex-1 max-w-sm xl:max-w-md hidden md:block" ref={searchContainerRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#876876]">
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
              className="w-full pl-9 pr-14 py-2 text-xs bg-[#ffffff] border border-[#ede0d6] hover:border-[#dfb76c]/60 focus:border-[#3d0c22] rounded-full text-[#2a0717] placeholder-[#a48897] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#3d0c22]/15 transition-all font-medium"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
              <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#876876] bg-[#fbf5f0] border border-[#ebdcd3] rounded-md shadow-2xs">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Instant Search Dropdown Preview */}
          {isSearchFocused && searchValue.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#ffffff] border border-[#ede0d6] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#f5ebe4] text-[11px] text-[#876876]">
                <span>
                  {searchResults.length > 0
                    ? `Found ${searchResults.length} matching result(s)`
                    : 'No customer records match this search'}
                </span>
                <span className="font-mono text-[10px]">Press Enter for Directory</span>
              </div>

              {searchResults.length > 0 && (
                <div className="divide-y divide-[#f5ebe4] max-h-64 overflow-y-auto">
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
                      className="p-2.5 hover:bg-[#fcf8f6] rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2a0717] group-hover:text-[#3d0c22] transition-colors truncate">
                          {cust.name}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#876876] mt-0.5">
                          <span className="font-mono text-[#3d0c22] font-semibold">{cust.phone}</span>
                          {(cust.place || cust.city) && (
                            <span className="truncate">• {cust.place || cust.city}</span>
                          )}
                        </div>
                      </div>

                      {cust.categoryName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fae8dc] text-[#3d0c22] shrink-0">
                          {cust.categoryName}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-[#f5ebe4] px-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchFocused(false);
                    onNavigateTab('customers');
                  }}
                  className="text-xs font-bold text-[#3d0c22] hover:underline cursor-pointer"
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
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'qr_common' || activeTab.startsWith('qr_')
                ? 'bg-[#3d0c22] text-[#ffffff] border border-[#dfb76c]/40 font-bold shadow-xs'
                : 'text-[#2a0717] bg-[#ffffff] hover:bg-[#faede6] border border-[#ebdcd3]'
            }`}
            title="Open Showroom QR Center"
          >
            <QrCode className={`w-3.5 h-3.5 ${activeTab === 'qr_common' || activeTab.startsWith('qr_') ? 'text-[#dfb76c]' : 'text-[#3d0c22]'}`} />
            <span>QR Center</span>
          </button>

          {/* Quick Jump: Import Outside Data */}
          {permissions.canImportData && (
            <button
              type="button"
              onClick={() => onNavigateTab('import')}
              className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                activeTab === 'import'
                  ? 'bg-[#3d0c22] text-[#ffffff] border border-[#dfb76c]/40 font-bold shadow-xs'
                  : 'text-[#2a0717] bg-[#ffffff] hover:bg-[#faede6] border border-[#ebdcd3]'
              }`}
              title="Import outside customer data (Excel & CSV)"
            >
              <Upload className={`w-3.5 h-3.5 ${activeTab === 'import' ? 'text-[#dfb76c]' : 'text-[#3d0c22]'}`} />
              <span>Import</span>
            </button>
          )}

          {/* Primary Quick Walk-In Button */}
          {permissions.canAddEditCustomers && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold text-[#ffffff] bg-[#3d0c22] hover:bg-[#521130] active:scale-95 border border-[#5c1334] shadow-md shadow-[#3d0c22]/20 transition-all cursor-pointer"
              title="Register a new walk-in customer (Keyboard shortcut: N)"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#dfb76c] stroke-[2.4]" />
              <span>Add Walk-In</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <div className="relative" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={() => setShowNotificationMenu((prev) => !prev)}
              className="relative p-2 rounded-full bg-[#ffffff] hover:bg-[#faede6] border border-[#ebdcd3] text-[#2a0717] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Showroom Notifications & Alerts"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-[#2a0717]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#ffffff] shadow-xs">
                2
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-[#ffffff] border border-[#ede0d6] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#ebdcd3] px-1">
                  <span className="text-xs font-bold text-[#2a0717]">Showroom Alerts</span>
                  <span className="text-[10px] font-semibold text-[#dfb76c] bg-[#3d0c22] px-2 py-0.5 rounded-full">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-[#f5ebe4] mt-1 text-xs">
                  <div
                    onClick={() => {
                      onNavigateTab('duplicates');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-[#fcf8f6] rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-[#2a0717] leading-tight">Data Hygiene Alert</p>
                    <p className="text-[11px] text-[#876876] mt-0.5">
                      Duplicate phone records detected. Click to resolve in Duplicate Manager.
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onNavigateTab('qr_common');
                      setShowNotificationMenu(false);
                    }}
                    className="py-2.5 px-2 hover:bg-[#fcf8f6] rounded-xl cursor-pointer transition-colors"
                  >
                    <p className="font-bold text-[#2a0717] leading-tight">Showroom QR Active</p>
                    <p className="text-[11px] text-[#876876] mt-0.5">
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
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-[#ffffff] hover:bg-[#faede6] border border-[#ebdcd3] transition-all cursor-pointer shadow-xs group active:scale-95"
              aria-label="User Profile Menu"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3d0c22] to-[#250514] text-[#faead1] font-bold text-[11px] flex items-center justify-center shadow-xs">
                {initials}
              </div>

              <span className="text-xs font-bold text-[#2a0717] tracking-tight hidden sm:inline">
                Hello, {displayFirstName}
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-[#876876] group-hover:text-[#2a0717] transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#ffffff] border border-[#ede0d6] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                <div className="p-2.5 pb-2 border-b border-[#f5ebe4]">
                  <p className="font-bold text-[#2a0717] truncate">{displayName}</p>
                  <p className="text-[11px] text-[#876876] capitalize font-medium">
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
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#2a0717] hover:bg-[#faede6] font-medium transition-colors cursor-pointer text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#3d0c22]" />
                      <span>Staff Access Control</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('qr_common');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#2a0717] hover:bg-[#faede6] font-medium transition-colors cursor-pointer text-left"
                  >
                    <QrCode className="w-4 h-4 text-[#3d0c22]" />
                    <span>Showroom QR Standee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onNavigateTab('settings');
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#2a0717] hover:bg-[#faede6] font-medium transition-colors cursor-pointer text-left"
                  >
                    <Settings className="w-4 h-4 text-[#3d0c22]" />
                    <span>Store Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-[#f5ebe4]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-700 hover:bg-rose-50 font-semibold transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
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
