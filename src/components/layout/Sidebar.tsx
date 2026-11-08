import React from 'react';
import {
  LayoutDashboard,
  Users,
  Tags,
  QrCode,
  BarChart3,
  Settings,
  UserPlus,
  ShieldCheck,
  Lock,
  Upload,
  CopyCheck,
  X,
  Gem
} from 'lucide-react';
import { StaffUser } from '../../types/index.ts';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAddCustomer: () => void;
  onOpenStaffAccessModal?: () => void;
  customerCount: number;
  currentUser: StaffUser;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddCustomer,
  onOpenStaffAccessModal,
  customerCount,
  currentUser,
  isMobileOpen = false,
  onCloseMobile
}) => {
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

  // Logically grouped navigation hierarchy matching all user features
  const menuSections = [
    {
      title: 'Store Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Store Dashboard',
          description: 'Key metrics, walk-ins, and health',
          icon: LayoutDashboard,
          badge: null,
          badgeType: 'home',
          isPermitted: true
        },
        {
          id: 'customers',
          label: 'Customer Directory',
          description: 'Customer records & WhatsApp outreach',
          icon: Users,
          badge: customerCount > 0 ? `${customerCount}` : null,
          badgeType: 'count',
          isPermitted: permissions.canViewCustomers
        },
        {
          id: 'import',
          label: 'Import Customer Data',
          description: 'Bulk upload Excel / CSV files',
          icon: Upload,
          badge: 'Excel',
          badgeType: 'import',
          isPermitted: permissions.canImportData
        },
        {
          id: 'duplicates',
          label: 'Duplicate Manager',
          description: 'Deduplication & phone hygiene',
          icon: CopyCheck,
          badge: null,
          badgeType: 'clean',
          isPermitted: permissions.canRunCleaning
        },
        {
          id: 'qr_common',
          label: 'Showroom QR Center',
          description: 'Counter standees & customer self-intake',
          icon: QrCode,
          badge: 'Live',
          badgeType: 'live',
          isPermitted: permissions.canViewCommonQR
        }
      ]
    },
    {
      title: 'Store Analytics',
      items: [
        {
          id: 'analytics',
          label: 'Performance & Footfall',
          description: 'Footfall trends & conversion hub',
          icon: BarChart3,
          badge: null,
          badgeType: 'default',
          isPermitted: permissions.canViewAnalytics
        }
      ]
    },
    {
      title: 'Showroom Setup',
      items: [
        {
          id: 'categories',
          label: 'Jewellery Categories',
          description: '22K Gold, Solitaire Diamonds & more',
          icon: Tags,
          badge: null,
          badgeType: 'default',
          isPermitted: permissions.canManageCategories
        },
        {
          id: 'settings',
          label: 'Settings & Backups',
          description: 'Showroom identity, BIS & backups',
          icon: Settings,
          badge: null,
          badgeType: 'default',
          isPermitted: currentUser.role === 'admin'
        }
      ]
    }
  ];

  const handleItemClick = (id: string) => {
    onSelectTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleQuickAddClick = () => {
    onOpenAddCustomer();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Reusable Sidebar Inner Content
  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full overflow-y-auto relative select-none p-4 justify-between">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <button
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center space-x-3 text-left group cursor-pointer focus:outline-none"
            title="Go to Store Dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0 group-hover:scale-105 transition-transform">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg tracking-wider gold-gradient-text leading-tight">
                GIRI JEWELLERS
              </h1>
              <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
                Showroom Suite
              </p>
            </div>
          </button>

          {isMobileView && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Action Walk-In Entry */}
        {permissions.canAddEditCustomers && (
          <button
            type="button"
            onClick={handleQuickAddClick}
            className="w-full glow-btn text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-xs sm:text-sm mb-6 cursor-pointer"
            title="Register a new walk-in customer (Shortcut: N)"
          >
            <UserPlus className="w-4 h-4 stroke-[2.2]" />
            <span>Quick Walk-In Entry</span>
          </button>
        )}

        {/* Navigation Sections */}
        <div className="space-y-6">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2.5 px-3">
                {section.title}
              </p>

              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    (item.id === 'qr_common' && (activeTab === 'intake' || activeTab.startsWith('qr_'))) ||
                    (item.id === 'analytics' && activeTab === 'cleaning');
                  const isPermitted = item.isPermitted;

                  return (
                    <button
                      key={item.id}
                      disabled={!isPermitted}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer group ${!isPermitted
                          ? 'opacity-35 cursor-not-allowed text-neutral-600'
                          : isActive
                            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)] font-semibold'
                            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon
                          className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-orange-400' : 'text-neutral-400'
                            }`}
                        />
                        <span className="truncate text-left">{item.label}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                        {!isPermitted && <Lock className="w-3 h-3 text-neutral-600" />}

                        {item.badge !== null && isPermitted && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${isActive
                                ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                                : item.badgeType === 'live'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : item.badgeType === 'import'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          {/* Security & Access Section */}
          {currentUser.role === 'admin' && onOpenStaffAccessModal && (
            <div className="space-y-1 pt-1">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold mb-2.5 px-3">
                Security & Access
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenStaffAccessModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/40 border border-orange-500/10 hover:border-orange-500/30 transition-all cursor-pointer group"
                title="Manage staff users, passwords, and permissions"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="truncate">Staff Access Control</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  Manage
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User / Shift Footer Card */}
      <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between border border-orange-500/15 mt-6">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-orange-400 font-bold text-xs shrink-0 shadow-inner">
            {currentUser.name
              ? currentUser.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()
              : 'GM'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-neutral-200 leading-tight truncate">
              {currentUser.name || 'Store Manager'}
            </h4>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentUser.role === 'admin' ? 'Admin Active' : 'Staff Active'}</span>
            </span>
          </div>
        </div>

        {currentUser.role === 'admin' && onOpenStaffAccessModal && (
          <button
            onClick={() => onOpenStaffAccessModal()}
            className="text-neutral-500 hover:text-orange-400 transition-colors p-1.5 rounded-lg hover:bg-neutral-800/50 cursor-pointer"
            title="Open Staff Settings"
          >
            <ShieldCheck className="w-4 h-4 text-neutral-400 hover:text-orange-400" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 glass-sidebar flex-col shrink-0 font-sans relative h-screen sticky top-0 z-20 shadow-2xl">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Left-to-Right Slide-Over Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          }`}
      >
        <div
          onClick={onCloseMobile}
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0'
            }`}
          aria-hidden="true"
        />

        <aside
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 glass-sidebar shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {renderSidebarContent(true)}
        </aside>
      </div>
    </>
  );
};
