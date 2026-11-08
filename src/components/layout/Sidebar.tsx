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
  Store
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
          description: 'Key metrics, walk-ins, and health',
          icon: Store,
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
          badge: 'Excel/CSV',
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
          label: 'Performance & Footfall Hub',
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

  const renderSidebarContent = (isMobileView = false) => (
    <div className="flex flex-col h-full overflow-y-auto relative select-none p-4 justify-between">
      {/* Decorative Warm Bronze Silk Curves */}
      <svg
        className="absolute top-0 right-0 pointer-events-none opacity-20"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path d="M0,0 C60,20 100,60 120,120 L120,0 Z" fill="#d97706" />
      </svg>

      <div className="relative z-10">
        {/* Brand Header: Faceted Diamond Logo & Title */}
        <div className="p-2 pb-4 flex items-center justify-between">
          <button
            onClick={() => handleItemClick('dashboard')}
            className="flex flex-col items-center w-full text-center group cursor-pointer focus:outline-none"
            title="Go to Store Dashboard"
          >
            {/* Faceted Brilliant-Cut Diamond Icon */}
            <div className="mb-2 p-1 relative">
              <svg
                className="w-10 h-10 text-[#fde68a] drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform"
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
            <p className="text-[10.5px] text-[#e2aa8e] tracking-wide mt-1 font-medium">
              Customer Database & Showroom QR Suite
            </p>
          </button>

          {isMobileView && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="absolute top-4 right-4 p-1.5 text-[#fcdccb] hover:text-white hover:bg-[#52210b] rounded-xl transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Add Walk-In Pill Button */}
        {permissions.canAddEditCustomers && (
          <div className="px-1 py-2 mb-3">
            <button
              type="button"
              onClick={handleQuickAddClick}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full bg-[#faeadc] hover:bg-[#f6decb] active:scale-[0.98] text-[#381504] font-bold text-xs shadow-sm border border-[#f0c4a4] transition-all cursor-pointer group"
              title="Register a new walk-in customer (Shortcut: N)"
            >
              <UserPlus className="w-4 h-4 text-[#381504] stroke-[2.4] group-hover:scale-110 transition-transform" />
              <span>Quick Walk-In Entry</span>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="space-y-4">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-1">
                <p className="text-[10px] font-bold text-[#e08c56] uppercase tracking-wider">
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
                      className={`w-full relative flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer group ${
                        !isPermitted
                          ? 'opacity-35 cursor-not-allowed text-[#8a5236]'
                          : isActive
                            ? 'bg-gradient-to-r from-[#fadcc5] via-[#f7cfb0] to-[#f4c29c] text-[#381504] font-bold shadow-[0_2px_10px_rgba(247,207,176,0.4)] translate-x-0.5'
                            : 'text-[#fce7db] hover:text-white hover:bg-white/10 hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'text-[#381504] stroke-[2.4]'
                              : isPermitted
                                ? 'text-[#fce7db]'
                                : 'text-[#8a5236]'
                          }`}
                        />
                        <span className="truncate text-left">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {!isPermitted && <Lock className="w-3 h-3 text-[#8a5236]" />}

                        {item.badge !== null && isPermitted && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? 'bg-[#381504]/20 text-[#381504]'
                                : item.badgeType === 'live'
                                  ? 'bg-[#6e2c0e] text-[#fce7db] border border-[#d97706]/40'
                                  : item.badgeType === 'import'
                                    ? 'bg-[#6e2c0e] text-[#fce7db] border border-[#d97706]/40'
                                    : 'bg-[#6e2c0e] text-[#fce7db] border border-[#d97706]/40'
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

          {/* Security & Access Section */}
          {currentUser.role === 'admin' && onOpenStaffAccessModal && (
            <div className="space-y-1 pt-1">
              <div className="px-3 pt-1">
                <p className="text-[10px] font-bold text-[#e08c56] uppercase tracking-wider">
                  Security & Access
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenStaffAccessModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold text-[#faead1] bg-[#381504] hover:bg-[#4d1f08] hover:translate-x-1 border border-[#e07d3c]/30 transition-all cursor-pointer shadow-xs group"
                title="Manage staff users, passwords, and permissions"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-[#fde68a] shrink-0 group-hover:scale-105 transition-transform" />
                  <span className="truncate">Staff Access Control</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6e2c0e] text-[#fce7db] border border-[#d97706]/40 shrink-0">
                  Manage
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Gold Silk Curve at bottom */}
      <div className="mt-auto p-2 relative overflow-hidden pointer-events-none select-none">
        <svg
          className="w-full h-8 text-[#d97706]/30"
          viewBox="0 0 200 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M0 30 C 50 5, 150 35, 200 10" />
          <path d="M0 38 C 60 12, 140 32, 200 20" opacity="0.6" />
        </svg>
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
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 glass-sidebar shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebarContent(true)}
        </aside>
      </div>
    </>
  );
};
