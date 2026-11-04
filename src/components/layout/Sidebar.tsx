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
  ChevronRight
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
          badge: 'Home',
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
          badge: 'Clean',
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
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Mobile Drawer Header */}
      {isMobileView && (
        <div className="p-4 border-b border-[#2d1b28] flex items-center justify-between bg-[#150a17]">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0">
              <img
                src="/assets/aistudio/giri_jewellers_logo_transparent.png"
                alt="Giri Jewellers Crest"
                className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(245,215,127,0.4)]"
              />
            </div>
            <div>
              <span className="font-cinzel text-sm font-bold tracking-widest text-[#faeed4] uppercase">
                GIRI JEWELLERS
              </span>
              <p className="text-[10px] text-[#dfb76c]">Showroom Operations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-[#cfb7c8] hover:text-white hover:bg-[#261327] rounded-xl transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Quick Add Walk-In Button */}
      {permissions.canAddEditCustomers && (
        <div className="p-4 pb-2">
          <button
            type="button"
            onClick={handleQuickAddClick}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#fae2ab] to-[#f0cc85] hover:brightness-105 active:scale-[0.98] text-[#1c1206] font-bold text-xs sm:text-[12.5px] shadow-[0_4px_16px_rgba(250,226,171,0.22)] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#1c1206] stroke-[2.5]" />
            <span>Quick Walk-In Entry</span>
          </button>
        </div>
      )}

      {/* Menu List */}
      <div className="p-3 space-y-5 overflow-y-auto flex-1 z-10">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1.5">
            <div className="px-3">
              <p className="text-[10.5px] font-bold text-[#dfb76c] uppercase tracking-wider">
                {section.title}
              </p>
            </div>

            <div className="space-y-1">
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                      !isPermitted
                        ? 'opacity-40 cursor-not-allowed text-[#6d5267]'
                        : isActive
                        ? 'bg-gradient-to-r from-[#b3854d] via-[#dfb76c] to-[#b3854d] text-[#180f03] font-bold shadow-[0_4px_14px_rgba(223,183,108,0.25)] border-none'
                        : 'text-[#cfb7c8] hover:text-white hover:bg-[#1a0f1b]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#180f03] stroke-[2.5]'
                            : isPermitted
                            ? 'text-[#dfb76c]'
                            : 'text-[#6d5267]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPermitted && <Lock className="w-3 h-3 text-[#6d5267]" />}

                      {item.badge !== null && isPermitted && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            isActive
                              ? 'bg-[#180f03]/20 text-[#180f03]'
                              : item.badgeType === 'home'
                              ? 'bg-[#261327] text-[#faeed4] border border-[#482c40]'
                              : item.badgeType === 'live'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                              : item.badgeType === 'clean'
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                              : 'bg-[#1e1320] text-[#dfb76c] border border-[#392233]'
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
          <div className="pt-2 border-t border-[#2d1b28]">
            <button
              type="button"
              onClick={() => {
                onOpenStaffAccessModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#faeed4] bg-[#1a0f1b] hover:bg-[#261327] border border-[#482c40] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-[#dfb76c]" />
                <span>Staff Access Control</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200">
                Manage
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Classical Architectural Facade Sketch Watermark */}
      <div className="mt-auto p-4 relative overflow-hidden pointer-events-none opacity-20 select-none">
        <svg
          className="w-full h-20 text-[#dfb76c]"
          viewBox="0 0 200 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
        >
          <polygon points="10 40 100 15 190 40" />
          <line x1="5" y1="40" x2="195" y2="40" strokeWidth="1.2" />
          <line x1="10" y1="44" x2="190" y2="44" />
          <line x1="25" y1="44" x2="25" y2="95" strokeWidth="1" />
          <line x1="30" y1="44" x2="30" y2="95" />
          <line x1="55" y1="44" x2="55" y2="95" strokeWidth="1" />
          <line x1="60" y1="44" x2="60" y2="95" />
          <line x1="85" y1="44" x2="85" y2="95" strokeWidth="1" />
          <line x1="90" y1="44" x2="90" y2="95" />
          <line x1="110" y1="44" x2="110" y2="95" strokeWidth="1" />
          <line x1="115" y1="44" x2="115" y2="95" />
          <line x1="140" y1="44" x2="140" y2="95" strokeWidth="1" />
          <line x1="145" y1="44" x2="145" y2="95" />
          <line x1="170" y1="44" x2="170" y2="95" strokeWidth="1" />
          <line x1="175" y1="44" x2="175" y2="95" />
          <line x1="15" y1="95" x2="185" y2="95" strokeWidth="1.2" />
          <line x1="10" y1="99" x2="190" y2="99" strokeWidth="1.5" />
          <circle cx="100" cy="30" r="6" />
        </svg>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Only visible on lg: and above) */}
      <aside className="hidden lg:flex w-64 bg-[#110913] border-r border-[#2d1b28] flex-col shrink-0 font-sans relative">
        {renderSidebarContent(false)}
      </aside>

      {/* 2. Mobile & Tablet Left-to-Right Slide-Over Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop Overlay */}
        <div
          onClick={onCloseMobile}
          className={`fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Sliding Panel: Slides from Left to Right */}
        <aside
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-[#110913] border-r border-[#392233] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {renderSidebarContent(true)}
        </aside>
      </div>
    </>
  );
};
