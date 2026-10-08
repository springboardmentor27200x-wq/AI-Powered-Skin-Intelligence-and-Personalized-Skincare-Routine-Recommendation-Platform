import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Sparkles, Calendar, TrendingUp, UserCircle,
  Activity, Moon, Droplet, Sun, Users, Link2, ShieldAlert,
  Stethoscope, LogOut, ChevronLeft, ChevronRight, Menu, X,
  Home, Settings, Zap, FlaskConical, ShoppingBag,
  PanelLeftClose, PanelLeftOpen, Bell, FileText, MessageSquare,
} from 'lucide-react';
import { notificationService, browserNotification } from '../services/notificationService';
import BrandLogo, { BrandLogoIcon } from './BrandLogo';

// ─── Sidebar navigation structure (§6) ─────────────────────────────────────

const USER_NAV = [
  {
    group: 'MAIN',
    links: [
      { name: 'Home',       path: '/dashboard',   icon: Home          },
      { name: 'Assessment', path: '/assessment',  icon: Sparkles      },
      { name: 'My Skin',    path: '/skin-profile',icon: Zap           },
      { name: 'Routine',    path: '/routine',     icon: Calendar      },
      { name: 'Progress',   path: '/progress',    icon: TrendingUp    },
    ],
  },
  {
    group: 'SKINCARE INTELLIGENCE',
    links: [
      { name: 'Ingredients',   path: '/ingredients', icon: FlaskConical  },
      { name: 'Products',      path: '/products',    icon: ShoppingBag   },
      { name: 'Reports',       path: '/reports',     icon: FileText      },
    ],
  },
  {
    group: 'DAILY TRACKING',
    links: [
      { name: 'Lifestyle',    path: '/lifestyle',    icon: Activity },
      { name: 'Sleep',        path: '/sleep',        icon: Moon     },
      { name: 'Hydration',    path: '/hydration',    icon: Droplet  },
      { name: 'Environment',  path: '/environment',  icon: Sun      },
    ],
  },
  {
    group: 'NETWORK',
    links: [
      { name: 'Care Circle Chat',   path: '/messages',          icon: MessageSquare },
      { name: 'Find Professionals', path: '/find-professional', icon: Users },
      { name: 'My Connections',     path: '/my-connections',    icon: Link2 },
    ],
  },
  {
    group: 'ACCOUNT',
    links: [
      { name: 'Notifications', path: '/notifications', icon: Bell     },
      { name: 'Profile',       path: '/profile',       icon: UserCircle },
      { name: 'Settings',      path: '/profile',       icon: Settings   },
    ],
  },
];

// Bottom navigation tabs (§5) — 5 tabs max
const BOTTOM_TABS = [
  { name: 'Home',     path: '/dashboard',  icon: Home      },
  { name: 'Assess',   path: '/assessment', icon: Sparkles  },
  { name: 'Routine',  path: '/routine',    icon: Calendar  },
  { name: 'Progress', path: '/progress',   icon: TrendingUp},
  { name: 'Profile',  path: '/profile',    icon: UserCircle},
];

const PROFESSIONAL_LINKS = (nameSlug, role) => {
  if (role === 'SKINCARE_CONSULTANT') return [
    { name: 'Profile',          path: '/profile',                               icon: UserCircle    },
    { name: 'Care Circle Chat', path: '/messages',                              icon: MessageSquare },
    { name: 'Consultant Desk',  path: `/consultant/${nameSlug}/dashboard`,      icon: Users         },
    { name: 'Reports',          path: '/reports',                               icon: FileText      },
    { name: 'Notifications',    path: '/notifications',                         icon: Bell          },
  ];
  if (role === 'DERMATOLOGIST') return [
    { name: 'Profile',              path: '/profile',                               icon: UserCircle    },
    { name: 'Care Circle Chat',     path: '/messages',                              icon: MessageSquare },
    { name: 'Dermatologist Board',  path: `/dermatologist/${nameSlug}/dashboard`,   icon: Stethoscope   },
    { name: 'Reports',              path: '/reports',                               icon: FileText      },
    { name: 'Notifications',        path: '/notifications',                         icon: Bell          },
  ];
  if (role === 'ADMINISTRATOR') return [
    { name: 'Profile',          path: '/profile',           icon: UserCircle    },
    { name: 'Care Circle Chat', path: '/messages',          icon: MessageSquare },
    { name: 'Admin Operations', path: '/admin/dashboard',   icon: ShieldAlert   },
    { name: 'Reports',          path: '/reports',           icon: FileText      },
    { name: 'Notifications',    path: '/notifications',     icon: Bell          },
  ];
  return [];
};

// ─── Sidebar Component ─────────────────────────────────────────────────────

const Sidebar = ({ collapsed, onToggle, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nameSlug = user?.profile?.name
    ? user.profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : user?.email?.split('@')?.[0]?.toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? 'user';

  const isUser = user?.role === 'USER';
  const navGroups = isUser
    ? USER_NAV
    : [{ group: 'NAVIGATION', links: PROFESSIONAL_LINKS(nameSlug, user?.role) }];

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div
      className="flex flex-col h-full text-white overflow-hidden"
      style={{ backgroundColor: 'var(--color-sidebar-bg)' }}
    >
      {/* Brand & Toggle Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-5'} border-b border-white/8 flex-shrink-0`}>
        {collapsed ? (
          /* When collapsed: Clickable brand button to expand sidebar */
          <button
            onClick={onToggle}
            className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all duration-200 group focus:outline-none cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <BrandLogoIcon size={32} className="group-hover:scale-110 transition-transform" />
          </button>
        ) : (
          <>
            <BrandLogo size="md" dark={true} to="/dashboard" />

            {/* Close button for mobile overlay */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-[var(--color-sidebar-text)] hover:text-white hover:bg-white/10 rounded-[var(--radius-md)] transition-colors"
                aria-label="Close navigation"
              >
                <X size={16} />
              </button>
            )}

            {/* Collapse toggle (desktop) */}
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1.5 text-[var(--color-sidebar-text)] hover:text-white hover:bg-white/10 rounded-[var(--radius-md)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            )}
          </>
        )}
      </div>

      {/* User badge */}
      <div className={`px-2 py-3 border-b border-white/8 flex-shrink-0 ${collapsed ? 'flex justify-center' : 'px-3'}`}>
        {collapsed ? (
          <Link
            to="/profile"
            title={user?.profile?.name || user?.email || 'Profile'}
            className="w-8 h-8 rounded-full bg-[var(--color-brand)] hover:ring-2 hover:ring-white/40 flex items-center justify-center text-xs font-bold text-white transition-all shadow-sm"
          >
            {user?.profile?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </Link>
        ) : (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 rounded-[var(--radius-lg)]">
            <div className="w-7 h-7 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.profile?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.profile?.name ?? user?.email}</p>
              <p className="text-[9px] text-[var(--color-sidebar-text)]">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scroll-smooth" aria-label="Main navigation">
        {navGroups.map(group => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[8px] font-bold uppercase tracking-widest text-[var(--color-sidebar-text)]/60">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.links.map(link => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path + link.name}
                    to={link.path}
                    onClick={onClose}
                    title={collapsed ? link.name : undefined}
                    className={`flex items-center gap-2.5 rounded-[var(--radius-lg)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                      collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'
                    } ${
                      active
                        ? 'bg-[var(--color-brand)] text-white shadow-sm'
                        : 'text-[var(--color-sidebar-text)] hover:bg-white/6 hover:text-white'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={16} className={active ? 'text-white' : ''} aria-hidden="true" />
                    {!collapsed && <span className="text-sm font-medium">{link.name}</span>}
                    {!collapsed && active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/50" aria-hidden="true" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions: Expand/Collapse & Sign Out */}
      <div className="px-2 py-2 border-t border-white/8 flex-shrink-0 space-y-1">
        {onToggle && (
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex items-center gap-2.5 w-full rounded-[var(--radius-lg)] text-[var(--color-sidebar-text)] hover:text-white hover:bg-white/8 transition-colors py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer ${
              collapsed ? 'justify-center px-2' : 'px-3'
            }`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={16} className="text-[var(--color-sidebar-text)] hover:text-white" />
            ) : (
              <>
                <PanelLeftClose size={16} className="text-[var(--color-sidebar-text)]" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2.5 w-full rounded-[var(--radius-lg)] text-rose-400 hover:bg-rose-500/10 transition-colors py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50 cursor-pointer ${
            collapsed ? 'justify-center px-2' : 'px-3'
          }`}
          aria-label="Sign out"
        >
          <LogOut size={16} aria-hidden="true" />
          {!collapsed && <span className="text-xs font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

// ─── Bottom Navigation (mobile §5) ─────────────────────────────────────────

const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] md:hidden bg-white border-t border-[var(--color-border)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center">
        {BOTTOM_TABS.map(tab => {
          const Icon = tab.icon;
          const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
          const isAssess = tab.path === '/assessment';

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[52px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] ${
                isAssess
                  ? `mx-2 my-1 rounded-[var(--radius-xl)] ${active ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-brand-light)]'}`
                  : ''
              }`}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.name}
            >
              <Icon
                size={20}
                className={`${
                  isAssess
                    ? active ? 'text-white' : 'text-[var(--color-brand)]'
                    : active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'
                }`}
                aria-hidden="true"
              />
              <span className={`text-[9px] font-semibold mt-0.5 ${
                isAssess
                  ? active ? 'text-white' : 'text-[var(--color-brand)]'
                  : active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-muted)]'
              }`}>
                {tab.name}
              </span>
              {active && !isAssess && (
                <div className="w-1 h-1 rounded-full bg-[var(--color-brand)] mt-0.5" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// ─── Page title map ────────────────────────────────────────────────────────

const PAGE_TITLES = {
  '/dashboard':        'Home',
  '/assessment':       'Skin Assessment',
  '/routine':          'My Routine',
  '/progress':         'My Progress',
  '/profile':          'Profile',
  '/skin-profile':     'My Skin',
  '/lifestyle':        'Lifestyle',
  '/sleep':            'Sleep',
  '/hydration':        'Hydration',
  '/environment':      'Environment',
  '/reports':          'Clinical Reports & Exports',
  '/notifications':    'Notification Center',
  '/find-professional':'Find Professionals',
  '/my-connections':   'My Connections',
  '/admin/dashboard':  'Admin Operations',
};

// ─── Main Layout ───────────────────────────────────────────────────────────

const Layout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed(c => {
      const next = !c;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        const newCount = res?.data?.unread_count ?? 0;
        const isProfessional = user?.role === 'DERMATOLOGIST' || user?.role === 'SKINCARE_CONSULTANT' || user?.role === 'ADMINISTRATOR';
        setUnreadCount(prev => {
          if (newCount > prev && prev !== 0 && browserNotification.getPermission() === 'granted') {
            const title = isProfessional ? 'DermaIQ Clinical Alert' : 'DermaIQ Skincare Reminder';
            const body = isProfessional
              ? `You have ${newCount - prev} new clinical notification${newCount - prev > 1 ? 's' : ''}. Check your incoming cases and messages.`
              : `You have ${newCount - prev} new notification${newCount - prev > 1 ? 's' : ''}. Check your routine & hydration status.`;
            browserNotification.show(title, { body });
          }
          return newCount;
        });
      } catch {
        // Silently skip if network error
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'My Account';
  const isUser = user?.role === 'USER';
  const sidebarWidth = sidebarCollapsed ? 64 : 240;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        className="hidden md:block flex-shrink-0 overflow-hidden transition-all duration-300 shadow-md z-10"
        style={{ width: sidebarWidth }}
        aria-label="Sidebar navigation"
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </aside>

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top header (mobile: full; desktop: page title bar) */}
        <header
          className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[var(--color-border)] flex-shrink-0"
          style={{ boxShadow: 'var(--shadow-xs)' }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-[var(--radius-lg)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            {/* Desktop toggle sidebar button */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>

            <h1 className="text-base font-bold text-[var(--color-text-primary)] tracking-tight">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
              title="Notification Center"
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#8b7355] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <BrandLogo size="sm" variant="compact" className="hidden sm:inline-flex" />
            <div
              className="w-8 h-8 rounded-full bg-[var(--color-brand)] flex items-center justify-center text-xs font-bold text-white"
              aria-hidden="true"
            >
              {user?.profile?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 overflow-y-auto scroll-smooth"
          id="main-content"
          aria-label="Page content"
        >
          <div className="max-w-5xl mx-auto px-5 py-6 pb-24 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Mobile: Bottom Navigation (§5) ─────────────────────── */}
      {isUser && <BottomNavigation />}

      {/* ── Mobile Overlay Sidebar ──────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[var(--z-overlay)] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            className="absolute left-0 top-0 h-full w-64 shadow-[var(--shadow-xl)] animate-slide-right"
            onClick={e => e.stopPropagation()}
          >
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
