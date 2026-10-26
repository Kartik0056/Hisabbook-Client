import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Receipt,
  HandCoins,
  Users,
  Boxes,
  FileText,
  FolderLock,
  ClipboardList,
  CheckSquare,
  Landmark,
  BarChart3,
  X,
  BookOpen,
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { t } = useLanguage();

  const navLinks = [
    { to: '/', label: t('dashboard'), icon: LayoutDashboard },
    { to: '/transactions', label: t('transactions'), icon: Receipt },
    { to: '/advances', label: t('advances'), icon: HandCoins },
    { to: '/contacts', label: t('contacts'), icon: Users },
    { to: '/materials', label: t('materials'), icon: Boxes },
    { to: '/purchases', label: t('purchases'), icon: FileText },
    { to: '/documents', label: t('vault'), icon: FolderLock },
    { to: '/work-logs', label: t('worklogs'), icon: ClipboardList },
    { to: '/tasks', label: t('tasks'), icon: CheckSquare },
    { to: '/accounts', label: t('accounts'), icon: Landmark },
    { to: '/reports', label: t('reports'), icon: BarChart3 },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-3 py-4 border-r border-slate-200">
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 pb-5 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 block leading-tight">
                Hisabbook<span className="text-blue-600">.</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
                Universal Ledger
              </span>
            </div>
          </div>
          {mobileOpen && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">
        <div className="font-semibold text-slate-700">₹ INR Localized Ledger</div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Multi-Project • Multi-Device Ready
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="fixed top-0 bottom-0 w-64 z-20">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
