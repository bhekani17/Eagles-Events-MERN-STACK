import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { CONTACT } from '../config/contact';
import { Button } from './ui/button';

export function Header({ onQuoteClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Packages', href: '/packages' },
    { name: 'Hire', href: '/hire' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ];

  const closeMobileMenu = useCallback(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      document.body.style.overflow = '';
    }
  }, [isMenuOpen]);

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMobileMenu();
      }
    };

    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
      closeMobileMenu();
    };

    // Handle escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeMobileMenu();
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('scroll', handleScroll, { passive: true });
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('scroll', handleScroll);
        document.body.style.overflow = '';
      };
    }
  }, [isMenuOpen, scrolled, closeMobileMenu]);

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMenuOpen(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleNavClick = (e, href) => {
    e.preventDefault();
    closeMobileMenu();
    navigate(href);
  };

  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      
      <header 
        ref={menuRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-black/95 shadow-lg backdrop-blur-md' : 'bg-black/90 backdrop-blur-sm'
        } border-b border-gold-500`}
        role="banner"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex justify-between md:justify-center items-center h-16 md:h-20 md:gap-8 lg:gap-12">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 rounded-md p-1 -m-1"
                onClick={closeMobileMenu}
                aria-label="Eagles Events Home"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mr-2 md:mr-3">
                  <img 
                    src="/images/logo.png" 
                    alt="Eagles Events Logo" 
                    className="h-10 w-auto md:h-12" 
                    width="48"
                    height="48"
                    loading="lazy"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg md:text-xl font-bold text-white">Eagles Events</h1>
                  <p className="text-xs md:text-sm text-gold-400">Premium Event Services</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 xl:space-x-4">
              {navigation.map((item, index) => (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.href}
                    ref={index === 0 ? firstMenuItemRef : null}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'text-gold-400 bg-black/30'
                        : 'text-gray-300 hover:text-white hover:bg-black/20'
                    } focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-black`}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
              
              {/* Quote Button */}
              <div className="hidden lg:flex items-center ml-4">
                <Button
                  onClick={onQuoteClick}
                  size="touch"
                  className="bg-gold-600 hover:bg-gold-700 text-white font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                  aria-label="Get a quote"
                >
                  Get a Quote
                </Button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <Button 
                onClick={onQuoteClick}
                size="touch-sm"
                className="bg-gold-600 hover:bg-gold-700 text-white font-medium mr-2 text-sm"
              >
                Quote
              </Button>
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-md hover:text-white hover:bg-black/30 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold-500 transition-colors duration-200"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              >
                <span className="sr-only">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          id="mobile-menu"
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-[80vh] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}
          aria-hidden={!isMenuOpen}
        >
          <div className="px-2 pt-2 pb-4 space-y-1 bg-black/95 backdrop-blur-sm">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                to={item.href}
                ref={index === 0 ? firstMenuItemRef : null}
                onClick={(e) => handleNavClick(e, item.href)}
                className={`mobile-nav-item ${
                  isActive(item.href)
                    ? 'active'
                    : ''
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}

            <div className="pt-2 border-t border-gray-800 mt-2">
              <div className="flex items-center px-3 py-2 text-sm text-gray-300">
                <Phone className="h-4 w-4 mr-2" aria-hidden="true" />
                <a href={`tel:${CONTACT.phones[0].tel}`} className="hover:text-gold-300">{CONTACT.phones[0].display}</a>
              </div>
              <div className="flex items-center px-3 py-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                <a href={`mailto:${CONTACT.email}`} className="hover:text-gold-300">{CONTACT.email}</a>
              </div>

              <div className="mt-3 px-2">
                <Button
                  onClick={() => {
                    closeMobileMenu();
                    onQuoteClick();
                  }}
                  size="touch"
                  className="w-full flex justify-center border border-transparent text-base font-medium text-white bg-gold-600 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500"
                >
                  Get a Quote
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
