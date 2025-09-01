import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Box
} from 'lucide-react';
import { useState, useEffect } from 'react';

const ADMIN_ROUTES = [
  { 
    path: '/admin/dashboard', 
    name: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  { 
    path: '/admin/quotes', 
    name: 'Quotations',
    icon: <FileText className="w-5 h-5" />
  },
  { 
    path: '/admin/customers', 
    name: 'Customers',
    icon: <Users className="w-5 h-5" />
  },
  { 
    path: '/admin/packages', 
    name: 'Packages',
    icon: <Package className="w-5 h-5" />
  },
  { 
    path: '/admin/messages', 
    name: 'Messages',
    icon: <MessageSquare className="w-5 h-5" />
  },
  { 
    path: '/admin/equipment', 
    name: 'Equipment',
    icon: <Box className="w-5 h-5" />
  },
  { 
    path: '/admin/settings', 
    name: 'Settings',
    icon: <Settings className="w-5 h-5" />
  },
];

export function AdminLayout({ children }) {
  const { adminUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    const savedPref = saved === 'true';

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(saved !== null ? savedPref : false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/admin/login');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      // Persist preference only for desktop widths
      if (window.innerWidth >= 1024) {
        localStorage.setItem('adminSidebarCollapsed', String(next));
      }
      return next;
    });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isMobileMenuOpen]);

  // Keyboard controls: ArrowLeft closes, ArrowRight opens, Escape closes (mobile only)
  useEffect(() => {
    const handleKey = (e) => {
      // Apply only on small screens where sidebar is overlaying (lg hidden)
      if (window.innerWidth >= 1024) return;
      if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      } else if (e.key === 'ArrowRight') {
        setIsMobileMenuOpen(true);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Keyboard controls for desktop: ArrowLeft collapses, ArrowRight expands
  useEffect(() => {
    const handleDesktopKeys = (e) => {
      if (window.innerWidth < 1024) return; // desktop only
      if (e.key === 'ArrowLeft') {
        setIsSidebarCollapsed(true);
      } else if (e.key === 'ArrowRight') {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('keydown', handleDesktopKeys);
    return () => window.removeEventListener('keydown', handleDesktopKeys);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 antialiased">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Backdrop overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-out z-40 w-64 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} bg-black text-white`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              {!isSidebarCollapsed && (
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                  Eagle Events
                </h1>
              )}
            </div>
          </div>
          <button 
            onClick={toggleSidebar}
            className="hidden lg:block p-1 rounded-md text-gray-400 hover:text-amber-400 focus:outline-none transition-colors duration-200"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!isSidebarCollapsed}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isSidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        
        <nav className="mt-5 px-2 space-y-1">
          {ADMIN_ROUTES.map((route) => (
            <Link
              key={route.path}
              to={route.path}
              title={route.name}
              className={`group relative flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2' : 'px-4 py-3'} text-sm font-medium rounded-md transition-all duration-200 ${
                location.pathname === route.path
                  ? 'bg-gray-900 text-white lg:border-l-2 lg:border-amber-500'
                  : 'text-gray-300 hover:bg-gray-900/80 hover:text-white'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="flex-shrink-0">
                {React.cloneElement(route.icon, {
                  className: `${isSidebarCollapsed ? '' : 'mr-3'} ${isSidebarCollapsed ? 'h-5 w-5' : 'h-6 w-6'} transition-colors duration-200 ${
                    location.pathname === route.path ? 'text-amber-400' : 'text-gray-400 group-hover:text-amber-400'
                  }`
                })}
              </span>
              {!isSidebarCollapsed && route.name}
              {isSidebarCollapsed && (
                <span className="hidden lg:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 shadow-lg border border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {route.name}
                </span>
              )}
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-900/80 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="mr-3 h-6 w-6 text-gray-400 group-hover:text-red-400 transition-colors duration-200" />
            {!isSidebarCollapsed && 'Logout'}
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {/* Top header */}
        <header className="bg-black border-b border-gray-800 z-10 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-white">
                  {ADMIN_ROUTES.find(route => route.path === location.pathname)?.name || 'Dashboard'}
                </h2>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-amber-400 text-black flex items-center justify-center font-medium ring-1 ring-amber-500">
                      {adminUser?.name?.charAt(0) || 'A'}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-200">
                      {adminUser?.name || 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
