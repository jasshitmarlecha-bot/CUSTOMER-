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
  X
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

  const menuSections = [
    {
      title: 'Store Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Store Dashboard',
          icon: LayoutDashboard,
          badge: null,
          badgeType: 'home',
          isPermitted: true
        },
        {
          id: 'customers',
          label: 'Customer Directory',
          icon: Users,
          badge: customerCount > 0 ? customerCount : null,
          badgeType: 'count',
          isPermitted: permissions.canViewCustomers
        },
        {
          id: 'import',
          label: 'Import Customer Data',
          icon: Upload,
          badge: 'Excel/CSV',
          badgeType: 'import',
          isPermitted: permissions.canImportData
        },
        {
          id: 'duplicates',
          label: 'Duplicate Manager',
          icon: CopyCheck,
          badge: null,
          badgeType: 'clean',
          isPermitted: permissions.canRunCleaning
        },
        {
          id: 'qr_common',
          label: 'Showroom QR Center',
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
          label: 'Performance & Footfall Hub',
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
          icon: Tags,
          badge: null,
          badgeType: 'default',
          isPermitted: permissions.canManageCategories
        },
        {
          id: 'settings',
          label: 'Settings & Backups',
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
    <div className="flex flex-col h-full overflow-y-auto relative select-none">
      {/* Decorative Gold Silk Wave at top-right */}
      <svg
        className="absolute top-0 right-0 pointer-events-none opacity-30"
        width="110"
        height="110"
        viewBox="0 0 110 110"
        fill="none"
      >
        <path
          d="M0,0 C50,15 90,50 110,110 L110,0 Z"
          fill="url(#goldSilkTopGrad)"
        />
        <defs>
          <linearGradient id="goldSilkTopGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dfb76c" />
            <stop offset="100%" stopColor="#8c6422" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Brand Header: Faceted Diamond Logo & Title */}
      <div className="p-5 pb-3 flex items-center justify-between relative z-10">
        <button
          onClick={() => handleItemClick('dashboard')}
          className="flex flex-col items-center w-full text-center group cursor-pointer focus:outline-none"
        >
          {/* Faceted Brilliant-Cut Diamond Icon */}
          <div className="mb-2 p-1 relative">
            <svg
              className="w-9 h-9 text-[#dfb76c] drop-shadow-[0_2px_8px_rgba(223,183,108,0.45)] group-hover:scale-105 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 12L2 9z" />
              <path d="M11 3v18" />
              <path d="M2 9h20" />
              <path d="M7 9l5 12 5-12" />
              <path d="M6 3l5 6 5-6" />
            </svg>
          </div>

          <h1 className="font-cinzel text-base sm:text-[17px] font-bold tracking-[0.14em] text-[#faead1] uppercase leading-tight">
            GIRI JEWELLERS
          </h1>
          <p className="text-[10px] text-[#cca2b5] tracking-wide mt-1 font-medium">
            Customer Database & Showroom QR Suite
          </p>
        </button>

        {isMobileView && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4 right-4 p-1.5 text-[#e8d2dc] hover:text-white hover:bg-[#450b27] rounded-xl transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Quick Add Walk-In Pill Button */}
      {permissions.canAddEditCustomers && (
        <div className="px-4 py-2 relative z-10">
          <button
            type="button"
            onClick={handleQuickAddClick}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#fae7c2] via-[#eecd93] to-[#dfb76c] hover:brightness-105 active:scale-[0.98] text-[#2c0819] font-bold text-xs shadow-[0_4px_16px_rgba(223,183,108,0.22)] border border-[#f5dfb3] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#2c0819] stroke-[2.4]" />
            <span>Quick Walk-In Entry</span>
          </button>
        </div>
      )}

      {/* Menu Sections */}
      <div className="p-3 space-y-4 overflow-y-auto flex-1 z-10">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 pt-1">
              <p className="text-[10px] font-bold text-[#e2b79e]/80 uppercase tracking-wider">
                {section.title}
              </p>
            </div>

            <div className="space-y-0.5">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      !isPermitted
                        ? 'opacity-40 cursor-not-allowed text-[#684654]'
                        : isActive
                        ? 'bg-gradient-to-r from-[#e7b897] via-[#dfa782] to-[#d69871] text-[#2c0819] font-bold shadow-[0_3px_12px_rgba(223,167,130,0.3)] border-none'
                        : 'text-[#e8d2dc] hover:text-white hover:bg-[#ffffff]/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#2c0819] stroke-[2.4]'
                            : isPermitted
                            ? 'text-[#d9b1c2]'
                            : 'text-[#684654]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPermitted && <Lock className="w-3 h-3 text-[#684654]" />}

                      {item.badge !== null && isPermitted && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            isActive
                              ? 'bg-[#2c0819]/20 text-[#2c0819]'
                              : item.badgeType === 'live'
                              ? 'bg-[#521130] text-[#fca5a5] border border-[#9f1239]'
                              : item.badgeType === 'import'
                              ? 'bg-[#480d2a] text-[#fce7d2] border border-[#dfb76c]/40'
                              : 'bg-[#450b27] text-[#faead1] border border-[#dfb76c]/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Staff Access Control shortcut */}
        {currentUser.role === 'admin' && onOpenStaffAccessModal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onOpenStaffAccessModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#faead1] bg-[#32081e] hover:bg-[#430c2a] border border-[#dfb76c]/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#dfb76c]" />
                <span>Staff Access Control</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#480d2a] text-[#fce7d2] border border-[#dfb76c]/40">
                Manage
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Decorative Gold Silk Curve at bottom-left */}
      <div className="mt-auto p-4 relative overflow-hidden pointer-events-none select-none">
        <svg
          className="w-full h-12 text-[#dfb76c]/30"
          viewBox="0 0 200 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M0 45 C 50 10, 150 60, 200 20" />
          <path d="M0 55 C 60 20, 140 50, 200 30" opacity="0.6" />
        </svg>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-gradient-to-b from-[#2a0719] via-[#380b22] to-[#1e0412] border-r border-[#dfb76c]/30 flex-col shrink-0 font-sans relative h-screen sticky top-0 shadow-xl">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Left-to-Right Slide-Over Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        <div
          onClick={onCloseMobile}
          className={`fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        <aside
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-gradient-to-b from-[#2a0719] via-[#380b22] to-[#1e0412] border-r border-[#dfb76c]/30 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebarContent(true)}
        </aside>
      </div>
    </>
  );
};
