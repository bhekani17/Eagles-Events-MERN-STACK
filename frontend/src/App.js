import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Home as HomeIcon, MessageCircle, Phone, Mail } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastContainer from './components/ToastContainer';
import { CONTACT } from './config/contact';

// Lazy load modals for better performance
const QuoteModal = lazy(() => import('./components/QuoteModal').then(m => ({ default: m.QuoteModal })));
const FeedbackModal = lazy(() => import('./components/FeedbackModal').then(m => ({ default: m.FeedbackModal })));

// Lazy load pages for better performance
const HirePage = lazy(() => import('./pages/HirePage').then(m => ({ default: m.HirePage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const PackagesPage = lazy(() => import('./pages/PackagesPage').then(m => ({ default: m.PackagesPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));

// Lazy load admin components
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminSignup = lazy(() => import('./pages/admin/AdminSignup').then(m => ({ default: m.AdminSignup })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const QuoteManagement = lazy(() => import('./pages/admin/QuoteManagement').then(m => ({ default: m.QuoteManagement })));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const PackagesManagement = lazy(() => import('./pages/admin/packagesManagement').then(m => ({ default: m.PackagesManagement })));
const EquipmentManagement = lazy(() => import('./pages/admin/EquipmentManagement'));
const MessageManagement = lazy(() => import('./pages/admin/MessageManagement').then(m => ({ default: m.MessageManagement })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Inlined ScrollToTop to reduce component count
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = prefersReduced ? 'auto' : 'smooth';
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id) || document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior, block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, hash]);
  return null;
}

// Inlined Breadcrumb
function Breadcrumb() {
  const location = useLocation();
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];
    breadcrumbs.push({ name: 'Home', path: '/', current: pathnames.length === 0 });
    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      const isLast = index === pathnames.length - 1;
      const readableName = name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ name: readableName, path: currentPath, current: isLast });
    });
    return breadcrumbs;
  };
  const breadcrumbs = generateBreadcrumbs();
  if (breadcrumbs.length <= 1) return null;
  return (
    <nav className="bg-gray-50 border-b border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((breadcrumb, index) => (
            <li key={breadcrumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
              {breadcrumb.current ? (
                <span className="text-gray-900 font-medium">{breadcrumb.name}</span>
              ) : (
                <Link to={breadcrumb.path} className="text-gray-500 hover:text-gray-700 transition-colors flex items-center">
                  {breadcrumb.name === 'Home' ? (
                    <HomeIcon className="w-4 h-4" />
                  ) : (
                    breadcrumb.name
                  )}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

// Inlined FloatingSocial
function FloatingSocial() {
  const whatsappNumber = CONTACT.whatsapp.number;
  const whatsappText = encodeURIComponent(CONTACT.whatsapp.text);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <a
        href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
      <a
        href={`tel:${CONTACT.phones[0].tel}`}
        className="inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border"
        aria-label="Call Us"
      >
        <Phone className="w-6 h-6" />
      </a>
      <a
        href={`mailto:${CONTACT.email}?subject=${encodeURIComponent('Inquiry from Website')}`}
        className="inline-flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-900 border"
        aria-label="Email Us"
      >
        <Mail className="w-6 h-6" />
      </a>
    </div>
  );
}

// Inlined ProtectedRoute
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600 font-medium">Checking authentication...</div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function AppContent() {
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const location = useLocation();

  const openQuoteModal = (data = null) => {
    setQuoteData(data);
    setIsQuoteModalOpen(true);
  };
  
  const closeQuoteModal = () => {
    setIsQuoteModalOpen(false);
    setQuoteData(null);
  };

  // Global keyboard shortcut for admin access
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl + Shift + A for admin access
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        window.location.href = '/admin/login';
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Check if current path is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Centralized routes tree to avoid duplication across animated/non-animated branches
  const RoutesTree = () => (
    <Routes location={location} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Route path="/" element={<HomePage onQuoteClick={openQuoteModal} onOpenFeedback={() => setIsFeedbackOpen(true)} />} />
      <Route path="/hire" element={
        <Suspense fallback={<PageLoader />}>
          <HirePage onQuoteClick={openQuoteModal} />
        </Suspense>
      } />
      <Route path="/services" element={
        <Suspense fallback={<PageLoader />}>
          <ServicesPage onQuoteClick={openQuoteModal} />
        </Suspense>
      } />
      <Route path="/packages" element={
        <Suspense fallback={<PageLoader />}>
          <PackagesPage onQuoteClick={openQuoteModal} />
        </Suspense>
      } />
      <Route path="/about" element={
        <Suspense fallback={<PageLoader />}>
          <AboutPage />
        </Suspense>
      } />
      <Route path="/contact" element={
        <Suspense fallback={<PageLoader />}>
          <ContactPage onQuoteClick={openQuoteModal} />
        </Suspense>
      } />
      {/* Admin Routes */}
      <Route path="/admin/login" element={
        <Suspense fallback={<PageLoader />}>
          <AdminLogin />
        </Suspense>
      } />
      <Route path="/admin/signup" element={
        <Suspense fallback={<PageLoader />}>
          <AdminSignup />
        </Suspense>
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <Suspense fallback={<PageLoader />}>
            <AdminLayout>
              <Routes future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Route path="/" element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                } />
                <Route path="/dashboard" element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminDashboard />
                  </Suspense>
                } />
                <Route path="/quotes" element={
                  <Suspense fallback={<PageLoader />}>
                    <QuoteManagement />
                  </Suspense>
                } />
                <Route path="/customers" element={
                  <Suspense fallback={<PageLoader />}>
                    <CustomerManagement />
                  </Suspense>
                } />
                <Route path="/packages" element={
                  <Suspense fallback={<PageLoader />}>
                    <PackagesManagement />
                  </Suspense>
                } />
                <Route path="/messages" element={
                  <Suspense fallback={<PageLoader />}>
                    <MessageManagement />
                  </Suspense>
                } />
                <Route path="/equipment" element={
                  <Suspense fallback={<PageLoader />}>
                    <EquipmentManagement />
                  </Suspense>
                } />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </AdminLayout>
          </Suspense>
        </ProtectedRoute>
      } />
      {/* Handle preview_page.html redirect */}
      <Route path="/preview_page.html" element={<Navigate to="/" replace />} />
      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  return (
    <div className="min-h-screen safe-y">
      {!isAdminRoute && <Header onQuoteClick={openQuoteModal} />}
      <ScrollToTop />
      
      {/* Breadcrumb for non-admin pages */}
      {!isAdminRoute && <Breadcrumb />}
      
      {/* Add padding to account for fixed header */}
      <main className={isAdminRoute ? '' : 'pt-0'}>
        {(() => {
          const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (isAdminRoute || prefersReduced) {
            return <RoutesTree />;
          }
          return (
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <RoutesTree />
              </motion.div>
            </AnimatePresence>
          );
        })()}
      </main>
      
      {/* Footer for non-admin pages */}
      {!isAdminRoute && <Footer />}
      
      {/* Global Toasts */}
      <ToastContainer />

      {isQuoteModalOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
          <QuoteModal 
            isOpen={isQuoteModalOpen} 
            onClose={closeQuoteModal} 
            preSelectedItem={quoteData?.preSelectedItem}
          />
        </Suspense>
      )}
      {/* Floating Social Icons for non-admin pages */}
      {!isAdminRoute && <FloatingSocial />}
      {/* Global Feedback Modal */}
      {isFeedbackOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
          <FeedbackModal
            isOpen={isFeedbackOpen}
            onClose={() => setIsFeedbackOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  // Determine the basename for the router
  const basename = window.location.pathname.includes('preview_page.html') 
    ? window.location.pathname.replace('/preview_page.html', '') 
    : '';

  return (
    <AuthProvider>
      <Router basename={basename}>
        <ThemeProvider>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </ThemeProvider>
      </Router>
    </AuthProvider>
  );
}
