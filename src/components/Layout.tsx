import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useLang } from '../i18n/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import ChatWidget from './ChatWidget';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const { items, unread, loading, refresh, markRead, markAllRead } = useNotifications();
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openNotifications = () => {
    const next = !isNotificationsOpen;
    setIsNotificationsOpen(next);
    if (next) refresh();
  };

  const openNotification = (item: { id: number, link: string | null }) => {
    if (item.link) navigate(item.link);
    markRead(item.id);
    setIsNotificationsOpen(false);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex antialiased">
      {/* SideNavBar */}
      <aside className={cn(
        "bg-background dark:bg-background h-screen w-64 fixed left-0 top-0 rounded-r-xl shadow-[6px_6px_12px_#dce1eb,-6px_-6px_12px_#ffffff] dark:shadow-none flex-col py-margin-page gap-stack-gap z-50 transition-transform duration-300 md:translate-x-0 md:flex",
        isMobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden"
      )}>
        <div className="px-gutter mb-6 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full neu-flat overflow-hidden flex items-center justify-center bg-white">
              <span className="material-symbols-outlined text-primary">verified</span>
            </div>
            <div>
              <h1 className="font-headline-sm text-[16px] font-bold text-primary dark:text-inverse-primary leading-tight">{t('nav.brand')}</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{t('nav.brandSub')}</p>
            </div>
          </Link>
          <button className="md:hidden text-on-surface-variant p-2" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="px-gutter mb-4 relative group">
          <button 
            onClick={() => navigate('/applications')}
            className="w-full neu-btn py-3 px-4 flex items-center justify-center gap-2 text-primary font-label-lg font-bold"
            data-help="quick-action"
          >
            <span className="material-symbols-outlined">add</span> {t('nav.quickAction')}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 flex flex-col gap-2">
          <NavItem to="/dashboard" icon="dashboard" label={t('nav.dashboard')} />
          
          {/* Business Users only */}
          {user?.role === 'BUSINESS' && (
            <NavItem to="/business" icon="business_center" label={t('nav.myBusiness')} />
          )}
          
          <NavItem to="/instruments" icon="architecture" label={user?.role === 'BUSINESS' ? t('nav.myInstruments') : t('nav.instruments')} helpId="nav-my-instruments" />
          <NavItem to="/applications" icon="description" label={user?.role === 'BUSINESS' ? t('nav.myApplications') : t('nav.applications')} helpId="nav-my-applications" />
          
          {/* Inspections: Officers + Admin only (Business is never a participant) */}
          {user?.role !== 'BUSINESS' && (
            <NavItem to="/inspections" icon="assignment_turned_in" label={user?.role === 'LMO' || user?.role === 'GATC' ? t('nav.myInspections') : t('nav.inspections')} />
          )}
          
          <NavItem to="/certificates" icon="verified" label={t('nav.certificates')} helpId="nav-certificates" />
          
          {/* System Administrators only */}
          {user?.role === 'ADMIN' && (
            <NavItem to="/logs" icon="history" label={t('nav.auditLogs')} />
          )}
        </nav>

        <div className="px-4 mt-auto flex flex-col gap-2 border-t border-surface-dim pt-4 shadow-none">
          <NavItem to="/settings" icon="settings" label={t('nav.settings')} />
          <NavItem to="/help" icon="help" label={t('nav.help')} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 relative flex flex-col bg-background min-h-screen">
        {/* TopNavBar */}
        <header className="bg-background dark:bg-background fixed top-0 right-0 left-0 md:left-64 h-16 shadow-[4px_4px_8px_#dce1eb,-4px_-4px_8px_#ffffff] z-40 flex justify-between items-center px-gutter w-auto">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden neu-btn w-10 h-10 flex items-center justify-center text-primary rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                onKeyDown={(e) => { 
                  if(e.key === 'Enter') {
                    showToast(t('nav.searchingFor', { value: e.currentTarget.value }), 'info');
                    e.currentTarget.value = '';
                  } 
                }}
                className="neu-input-container pl-10 pr-4 py-2 w-64 text-body-md font-body-md placeholder-on-surface-variant/70 text-on-surface bg-transparent rounded-full border-none outline-none focus:ring-0 focus:shadow-[inset_6px_6px_12px_#dce1eb,inset_-6px_-6px_12px_#ffffff]" 
                placeholder={t('nav.searchPlaceholder')} 
                type="text" 
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={openNotifications}
                className="w-10 h-10 neu-btn flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unread > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-background"></span>}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 neu-flat rounded-xl p-4 z-50 flex flex-col gap-3">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface border-b border-surface-dim pb-2">{t('notif.title')}</h3>
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                    {loading && items.length === 0 ? (
                      <div className="flex items-center justify-center p-4 text-on-surface-variant">
                        <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                      </div>
                    ) : items.length === 0 ? (
                      <div className="flex flex-col gap-1 p-2 rounded-lg opacity-70">
                        <span className="font-body-md text-body-md text-on-surface-variant text-sm">{t('notif.empty')}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">{t('notif.emptySub')}</span>
                      </div>
                    ) : (
                      items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => openNotification(item)}
                          className={cn(
                            "flex flex-col gap-0.5 p-2 rounded-lg text-left transition-colors",
                            item.is_read
                              ? "opacity-70 hover:opacity-100"
                              : "bg-primary/5 hover:bg-primary/10"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            {!item.is_read && <span className="w-2 h-2 shrink-0 rounded-full bg-primary"></span>}
                            <span className="font-label-lg text-label-lg text-on-surface truncate">{item.title}</span>
                          </span>
                          <span className="font-body-md text-body-md text-on-surface-variant text-sm">{item.message}</span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant/70 text-xs mt-0.5">{new Date(item.created_at).toLocaleString()}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => {
                      markAllRead();
                      showToast(t('common.markedAllRead'), 'success');
                      setIsNotificationsOpen(false);
                    }}
                    disabled={unread === 0}
                    className="text-primary font-label-sm text-center pt-2 border-t border-surface-dim hover:underline disabled:opacity-40 disabled:hover:no-underline"
                  >
                    {t('common.markAllRead')}
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/settings')}
              className="hidden sm:flex w-10 h-10 neu-btn items-center justify-center text-on-surface-variant hover:text-primary transition-colors rounded-full"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>

            <LanguageSwitcher />
            
            {/* User Profile */}
            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full neu-flat overflow-hidden border-2 border-background cursor-pointer hover:scale-105 transition-transform flex items-center justify-center bg-primary-container text-on-primary-container font-bold uppercase"
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-48 neu-flat rounded-xl py-2 z-50 flex flex-col">
                  <div className="px-4 py-2 border-b border-surface-dim mb-1">
                    <p className="font-label-sm text-label-sm font-bold text-on-surface truncate">{user?.name || t('profile.userName')}</p>
                    <p className="font-body-md text-[11px] text-on-surface-variant truncate">{user?.email || 'user@email.com'}</p>
                  </div>
                  <Link to="/business" className="px-4 py-2 hover:bg-surface-container-low text-on-surface font-label-sm flex items-center gap-2" onClick={() => setIsProfileOpen(false)}>
                    <span className="material-symbols-outlined text-[18px]">business_center</span> {t('nav.myBusiness')}
                  </Link>
                  <Link to="/settings" className="px-4 py-2 hover:bg-surface-container-low text-on-surface font-label-sm flex items-center gap-2" onClick={() => setIsProfileOpen(false)}>
                    <span className="material-symbols-outlined text-[18px]">settings</span> {t('nav.settings')}
                  </Link>
                  <div className="border-t border-surface-dim my-1"></div>
                  <button onClick={() => { 
                    logout();
                    showToast(t('profile.loggedOut'), 'info'); 
                    setIsProfileOpen(false); 
                  }} className="px-4 py-2 hover:bg-error-container/20 text-error font-label-sm flex items-center gap-2 w-full text-left">
                    <span className="material-symbols-outlined text-[18px]">logout</span> {t('profile.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="mt-16 p-4 md:p-margin-page flex-1 flex flex-col gap-stack-gap w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* AI onboarding assistant (BUSINESS users only) */}
      {user?.role === 'BUSINESS' && <ChatWidget userName={user?.name} />}
    </div>
  );
}

function NavItem({ to, icon, label, helpId }: { to: string, icon: string, label: string, helpId?: string }) {
  return (
    <NavLink
      to={to}
      data-help={helpId}
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200",
        isActive 
          ? "text-primary font-bold border-l-4 border-primary bg-primary/10 shadow-[inset_2px_2px_5px_#dce1eb,inset_-2px_-2px_5px_#ffffff]" 
          : "text-on-surface-variant hover:text-primary hover:translate-x-1"
      )}
    >
      {({ isActive }) => (
        <>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
          <span className="font-label-lg text-label-lg">{label}</span>
        </>
      )}
    </NavLink>
  );
}
