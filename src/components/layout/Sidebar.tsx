import React from 'react';
import {
  LayoutDashboard,
  Users,
  Tags,
  QrCode,
  BarChart3,
  Settings,
  UserPlus,
  Shield,
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
          label: 'Overview',
          icon: LayoutDashboard,
          badge: null,
          isPermitted: true
        },
        {
          id: 'customers',
          label: 'Customer Directory',
          icon: Users,
          badge: customerCount > 0 ? customerCount : null,
          isPermitted: permissions.canViewCustomers
        },
        {
          id: 'import',
          label: 'Import Records',
          icon: Upload,
          badge: null,
          isPermitted: permissions.canImportData
        },
        {
          id: 'duplicates',
          label: 'Deduplication',
          icon: CopyCheck,
          badge: null,
          isPermitted: permissions.canRunCleaning
        },
        {
          id: 'qr_common',
          label: 'Showroom QR Intake',
          icon: QrCode,
          badge: null,
          isPermitted: permissions.canViewCommonQR
        }
      ]
    },
    {
      title: 'Store Intelligence',
      items: [
        {
          id: 'analytics',
          label: 'Footfall Analytics',
          icon: BarChart3,
          badge: null,
          isPermitted: permissions.canViewAnalytics
        }
      ]
    },
    {
      title: 'Configuration',
      items: [
        {
          id: 'categories',
          label: 'Jewellery Categories',
          icon: Tags,
          badge: null,
          isPermitted: permissions.canManageCategories
        },
        {
          id: 'settings',
          label: 'Settings & Backups',
          icon: Settings,
          badge: null,
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
    <div className="flex flex-col h-full bg-[#12141a]">
      {/* Mobile Drawer Header */}
      {isMobileView && (
        <div className="p-4 border-b border-[#21242d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/giri_jewellers_logo_transparent.png"
              alt="Giri Jewellers Crest"
              className="w-7 h-7 object-contain"
            />
            <div>
              <span className="font-cinzel text-xs font-semibold tracking-wider text-[#e8c86d] uppercase">
                GIRI JEWELLERS
              </span>
              <p className="text-[10px] text-[#8a919e]">Showroom Operations</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-[#8a919e] hover:text-white hover:bg-[#1a1d26] rounded-lg transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Primary Action Button */}
      {permissions.canAddEditCustomers && (
        <div className="p-3.5 pb-2">
          <button
            type="button"
            onClick={handleQuickAddClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#d4af37] hover:bg-[#e0bc45] text-[#14161d] font-semibold text-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#14161d] stroke-[2.5]" />
            <span>New Walk-In Entry</span>
          </button>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="p-3 space-y-5 overflow-y-auto flex-1">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-3 py-1">
              <p className="text-[10px] font-semibold text-[#646a78] uppercase tracking-wider">
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      !isPermitted
                        ? 'opacity-40 cursor-not-allowed text-[#4b5260]'
                        : isActive
                        ? 'bg-[#1e222b] text-[#e8c86d] font-semibold'
                        : 'text-[#9aa0a6] hover:text-[#f4f5f7] hover:bg-[#171922]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#d4af37]'
                            : isPermitted
                            ? 'text-[#8a919e]'
                            : 'text-[#4b5260]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPermitted && <Lock className="w-3 h-3 text-[#4b5260]" />}

                      {item.badge !== null && isPermitted && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#1e222b] text-[#c0c6d2] border border-[#272b36]">
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
      </div>

      {/* Staff Access Administration (Admin only) */}
      {currentUser.role === 'admin' && onOpenStaffAccessModal && (
        <div className="p-3 border-t border-[#21242d]">
          <button
            type="button"
            onClick={onOpenStaffAccessModal}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#9aa0a6] hover:text-white hover:bg-[#1a1d26] rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8a919e]" />
              <span>Staff Access Control</span>
            </div>
            <span className="text-[10px] text-[#d4af37] font-semibold">Admin</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#21242d] bg-[#12141a]">
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
