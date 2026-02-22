import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  FileQuestion,
  ArrowLeft,
  Menu,
  Settings,
  Key,
  BookOpen,
  LogOut,
  HelpCircle,
  Paintbrush,
  Sparkles,
  Users,
  UserCog,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { AdminToast } from './components';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, end: false },
  { to: '/admin/faq-items', label: 'FAQ Items', icon: FileQuestion, end: false },
  { to: '/admin/settings', label: 'Settings', icon: Settings, end: false },
  { to: '/admin/templates', label: 'Templates', icon: Paintbrush, end: false },
  { to: '/admin/ai-generator', label: 'AI Generator', icon: Sparkles, end: false },
  { to: '/admin/api-keys', label: 'API Keys', icon: Key, end: false },
  { to: '/admin/api-docs', label: 'API Docs', icon: BookOpen, end: false },
  { to: '/admin/users', label: 'Users', icon: Users, end: false },
  { to: '/admin/profile', label: 'Profile', icon: UserCog, end: false },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/faq-items': 'FAQ Items',
  '/admin/settings': 'Settings',
  '/admin/templates': 'Templates',
  '/admin/ai-generator': 'AI Generator',
  '/admin/api-keys': 'API Keys',
  '/admin/api-docs': 'API Docs',
  '/admin/users': 'Users',
  '/admin/profile': 'Profile',
};

function getUserInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  if (email) return email.substring(0, 2).toUpperCase();
  return 'AD';
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const pageTitle = pageTitles[location.pathname] || 'Admin';

  async function handleLogout() {
    await logout();
    navigate('/admin/login');
  }

  const initials = getUserInitials(user?.name, user?.email);

  return (
    <div className="admin-layout min-h-screen flex bg-slate-50">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col overflow-hidden
          lg:translate-x-0 lg:static lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.08] shrink-0">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt={settings.company_name} className="w-6 h-6 object-contain" />
          ) : (
            <HelpCircle className="w-6 h-6 text-white/70" />
          )}
          <span className="text-[15px] font-semibold tracking-tight text-white">{settings.company_name}</span>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 px-3 py-5 space-y-1 overflow-y-auto admin-sidebar-scroll">
          {navItems.map((item, index) => (
            <div key={item.to}>
              {/* Separator between main nav and settings group */}
              {index === 4 && (
                <div className="my-3 mx-4 border-t border-white/10" />
              )}
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.12] text-white'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/[0.06]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active accent indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ backgroundColor: settings.primary_color }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-white/40'}`} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* User info + bottom actions */}
        <div className="relative px-3 pb-4 space-y-1 shrink-0">
          {/* User avatar/email */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg bg-white/[0.06] mx-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: '#6366f1', color: 'white' }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                {user.name && (
                  <div className="text-xs font-medium text-white truncate">{user.name}</div>
                )}
                <div className="text-[11px] text-white/50 truncate">{user.email}</div>
              </div>
            </div>
          )}

          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.12] transition-all duration-300 ease-out"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to FAQ
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.12] transition-all duration-300 ease-out"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-6 shrink-0 sticky top-0 z-30" style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-3 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-slate-800">
            {pageTitle}
          </h1>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AdminToast />
    </div>
  );
}
