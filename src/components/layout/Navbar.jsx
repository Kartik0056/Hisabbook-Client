import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Languages,
  LogOut,
  User,
  Smartphone,
  Check,
  PlusCircle,
  Menu,
} from 'lucide-react';

export const Navbar = ({ onOpenMobileSidebar, onOpenQuickAdd, onOpenPhonePairing, onOpenNewProject }) => {
  const { user, activeProject, projects, switchProject, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleSwitchProject = async (id) => {
    setProjectDropdownOpen(false);
    await switchProject(id);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-8">
      {/* Left: Mobile hamburger & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Project Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-left transition hover:bg-slate-100"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div className="max-w-[140px] truncate sm:max-w-[220px]">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                {language === 'hi' ? 'प्रोजेक्ट' : 'PROJECT'}
              </span>
              <span className="block truncate text-sm font-semibold text-slate-800">
                {activeProject ? activeProject.name : (language === 'hi' ? 'प्रोजेक्ट चुनें' : 'Select Project')}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {projectDropdownOpen && (
            <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {language === 'hi' ? `आपके प्रोजेक्ट (${projects.length})` : `Your Projects (${projects.length})`}
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {projects.map((proj) => {
                  const isCurrent = activeProject?._id === proj._id;
                  return (
                    <button
                      key={proj._id}
                      onClick={() => handleSwitchProject(proj._id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                        isCurrent
                          ? 'bg-blue-50 font-semibold text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="truncate">
                        <div className="truncate">{proj.name}</div>
                        <div className="text-xs text-slate-400 capitalize">
                          {proj.projectType} • {proj.status}
                        </div>
                      </div>
                      {isCurrent && <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  onClick={() => {
                    setProjectDropdownOpen(false);
                    onOpenNewProject();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{language === 'hi' ? 'नया प्रोजेक्ट बनाएं' : 'Create New Project'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick actions, Wi-Fi pairing, Language toggle, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Same-Wi-Fi Phone Transfer Trigger */}
        <button
          onClick={onOpenPhonePairing}
          className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
          title="Connect phone over Wi-Fi to snap and upload bills directly"
        >
          <Smartphone className="h-4 w-4 text-emerald-600" />
          <span>{t('connectPhone')}</span>
        </button>

        {/* Quick Add Button & Menu */}
        <div className="relative">
          <button
            onClick={() => setQuickAddOpen(!quickAddOpen)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'नया जोड़ें' : 'Quick Add'}
            </span>
          </button>

          {quickAddOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              <button
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd('transaction');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                <span>{t('addTransaction')}</span>
              </button>
              <button
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd('bill');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                <span>{t('addBill')}</span>
              </button>
              <button
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd('contact');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                <span>{t('addContact')}</span>
              </button>
              <button
                onClick={() => {
                  setQuickAddOpen(false);
                  onOpenQuickAdd('material');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span>{t('addMaterial')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          title="Switch Language / भाषा बदलें"
        >
          <Languages className="h-4 w-4 text-blue-600" />
          <span>{language === 'hi' ? 'EN' : 'हिन्दी'}</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 transition hover:ring-2 hover:ring-blue-500/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="font-semibold text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{language === 'hi' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
