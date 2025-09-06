import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { CONTACT } from '../config/contact';

function FooterSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border-b border-gray-700/50 lg:border-none pb-2 lg:pb-0">
      <button 
        className="w-full flex justify-between items-center lg:pointer-events-none lg:cursor-default focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md p-1 -m-1 lg:p-0 lg:m-0"
        onClick={toggleSection}
        aria-expanded={isOpen}
      >
        <h4 className="text-base sm:text-lg font-semibold text-white mb-0 lg:mb-2 text-left">
          {title}
        </h4>
        <span className="lg:hidden text-gray-400 transition-transform duration-200">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      <div className={`mt-2 lg:mt-0 ${isOpen ? 'block' : 'hidden lg:block'} transition-all duration-300`}>
        {children}
      </div>
    </div>
  );
}

export function Footer() {
  
  // Custom TikTok icon component
  const TikTokIcon = ({ className }) => (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.11V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 4 15.22a6.34 6.34 0 0 0 10.35-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  );

  const socialLinks = [
    { 
      icon: Facebook, 
      label: 'Facebook',
      url: 'https://facebook.com/eagleevents',
      color: 'hover:text-blue-500'
    },
    { 
      icon: TikTokIcon, 
      label: 'TikTok',
      url: 'https://tiktok.com/@eagleevents',
      color: 'hover:text-black'
    },
    { 
      icon: Instagram, 
      label: 'Instagram',
      url: 'https://instagram.com/eagleevents',
      color: 'hover:text-pink-500'
    },
    { 
      icon: Linkedin, 
      label: 'LinkedIn',
      url: 'https://linkedin.com/company/eagleevents',
      color: 'hover:text-blue-400'
    }
  ];

  const quickLinks = [
    { to: "/", text: "Home" },
    { to: "/services", text: "Services" },
    { to: "/packages", text: "Packages" },
    { to: "/hire", text: "Hire" },
    { to: "/about", text: "About Us" },
    { to: "/contact", text: "Contact" }
  ];



  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 w-full relative z-10">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-1 sm:py-2 lg:py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-3 lg:space-y-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <img 
                  src="/images/logo.png" 
                  alt="Eagles Events Logo" 
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain" 
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight mb-1">Eagles Events</h3>
                <p className="text-gold-400 text-xs sm:text-sm leading-tight font-medium">Mobile Hire Services & Event Solutions</p>
              </div>
            </div>
            <p className="hidden sm:block text-gray-400 text-sm leading-relaxed text-left">
              Delivering exceptional event experiences with our premium mobile hire services. We bring convenience, hygiene, and professionalism to your doorstep for weddings, corporate events, and special occasions.
            </p>
            <div className="flex justify-center sm:justify-start space-x-3 sm:space-x-4 pt-1">
              {socialLinks.map(({ icon: Icon, label, url, color }) => (
                <a 
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-gray-400 hover:text-gold-400 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110 p-2 rounded-full hover:bg-gold-500/10`}
                  aria-label={`Follow us on ${label}`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Column (Quick Links + Services) */}
          <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FooterSection title="Quick Links">
                <ul className="space-y-2 sm:space-y-2.5">
                  {quickLinks.map(({ to, text }) => (
                    <li key={to} className="group">
                      <Link 
                        to={to} 
                        className="text-gray-400 hover:text-gold-400 transition-colors duration-200 text-sm sm:text-base flex items-center py-1 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-2 -mx-2"
                      >
                        <span className="h-0.5 w-2 sm:w-3 bg-gold-500 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterSection>

              <FooterSection title="Our Services">
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    { to: "/services#toilets", text: "VIP Mobile Toilets" },
                    { to: "/services#freezers", text: "Mobile Freezers" },
                    { to: "/services#tents", text: "Tents & Marquees" },
                    { to: "/services#slaughtering", text: "Slaughtering Services" },
                    { to: "/packages", text: "Event Packages" },
                    { to: "/hire", text: "Equipment Hire" }
                  ].map(({ to, text }) => (
                    <li key={to}>
                      <Link 
                        to={to} 
                        className="text-gray-400 hover:text-gold-400 transition-colors text-sm sm:text-base flex items-center group py-1 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-2 -mx-2"
                      >
                        <span className="w-1.5 h-1.5 bg-gold-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FooterSection>
            </div>
          </div>

          {/* Contact Info */}
          <FooterSection title="Contact Info">
            <ul className="space-y-3 sm:space-y-4">
              {[
                { 
                  icon: Phone, 
                  content: (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <a href={`tel:${CONTACT.phones[0].tel}`} className="hover:text-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">{CONTACT.phones[0].display}</a>
                      <span className="hidden sm:inline text-gray-500">/</span>
                      {CONTACT.phones[1] && (
                        <a href={`tel:${CONTACT.phones[1].tel}`} className="hover:text-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">{CONTACT.phones[1].display}</a>
                      )}
                    </div>
                  )
                },
                { 
                  icon: Mail, 
                  content: <a href={`mailto:${CONTACT.email}`} className="hover:text-gold-400 transition-colors break-all focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1">{CONTACT.email}</a>
                },
                { 
                  icon: MapPin, 
                  content: (
                    <address className="not-italic text-sm sm:text-base leading-relaxed">
                      {CONTACT.address.lines[0]}<br />
                      {CONTACT.address.lines[1]}<br />
                      {CONTACT.address.lines[2]}
                    </address>
                  ) 
                },
                {
                  icon: ExternalLink,
                  content: (
                    <a 
                      href={CONTACT.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="hover:text-gold-400 transition-colors break-all focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-1 -mx-1"
                    >
                      {CONTACT.website}
                    </a>
                  )
                }
              ].map(({ icon: Icon, content }, index) => (
                <li key={index} className="flex items-start space-x-3 py-1">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0" />
                  <span className="text-gray-400 text-sm sm:text-base">
                    {content}
                  </span>
                </li>
              ))}
            </ul>
          </FooterSection>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-2 sm:pt-3 pb-2 sm:pb-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-center sm:text-left text-xs sm:text-xs text-gray-500">
              &copy;  Eagles Events. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4">
              <Link to="/privacy-policy" className="text-xs sm:text-xs text-gray-500 hover:text-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-0.5 -mx-2 -my-0.5">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs sm:text-xs text-gray-500 hover:text-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded px-2 py-0.5 -mx-2 -my-0.5">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
