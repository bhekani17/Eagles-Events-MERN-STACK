import { useState, useEffect, useCallback } from 'react';
import { PackageCard } from '../components/PackageCard';
import { PackageFilter } from '../components/PackageFilter';
import packageService from '../services/packageService';
import { Loader2, Boxes, AlertCircle, Filter, RefreshCw } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

export function PackagesPage({ onQuoteClick }) {
  const { notify } = useNotifications();
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    popular: false
  });
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Fetch packages from MongoDB in real-time
  const fetchPackages = useCallback(async (showNotification = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await packageService.getAllPackages();
  
      setPackages(data);
      setFilteredPackages(data);
      
      if (showNotification) {
        notify('success', `Packages refreshed! Found ${data.length} packages.`);
      }
    } catch (err) {
      setError(err.message || 'Failed to load packages from database');
      console.error('Error fetching packages:', err);
      setPackages([]);
      setFilteredPackages([]);
      
      if (showNotification) {
        notify('error', 'Failed to refresh packages. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Refresh packages when user returns to the page (e.g., from admin panel)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh packages
        fetchPackages();
      }
    };

    const handleFocus = () => {
      // Window gained focus, refresh packages
      fetchPackages();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchPackages]);

  // Reset modal image index when a new package is selected
  useEffect(() => {
    if (showDetails) {
      setModalImageIndex(0);
    }
  }, [showDetails, selectedPackage]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setPrefersReducedMotion(!!mql.matches);
    handler();
    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, []);

  // Keyboard navigation for modal carousel
  useEffect(() => {
    if (!showDetails) return;
    const onKey = (e) => {
      const list = [];
      if (Array.isArray(selectedPackage?.images) && selectedPackage.images.length) {
        for (const im of selectedPackage.images) {
          if (typeof im === 'string') list.push(im);
          else if (im?.url) list.push(im.url);
        }
      }
      if (selectedPackage?.imageUrl) list.unshift(selectedPackage.imageUrl);
      const total = Array.from(new Set(list)).length;
      if (!total) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setModalImageIndex((i) => (i - 1 + total) % total);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setModalImageIndex((i) => (i + 1) % total);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showDetails, selectedPackage]);

  // Autoplay carousel when modal is open
  useEffect(() => {
    if (!showDetails || isCarouselPaused || prefersReducedMotion) return;
    const list = [];
    if (Array.isArray(selectedPackage?.images) && selectedPackage.images.length) {
      for (const im of selectedPackage.images) {
        if (typeof im === 'string') list.push(im);
        else if (im?.url) list.push(im.url);
      }
    }
    if (selectedPackage?.imageUrl) list.unshift(selectedPackage.imageUrl);
    const total = Array.from(new Set(list)).length;
    if (!total) return;
    const interval = setInterval(() => {
      setModalImageIndex((i) => (i + 1) % total);
    }, 4000);
    return () => clearInterval(interval);
  }, [showDetails, isCarouselPaused, prefersReducedMotion, selectedPackage]);

  // Apply filters when filters change
  useEffect(() => {
    let filtered = [...packages];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(pkg => pkg.category === filters.category);
    }

    // Filter by popular
    if (filters.popular) {
      filtered = filtered.filter(pkg => pkg.isPopular);
    }

    setFilteredPackages(filtered);
  }, [packages, filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-0 bg-gray-50">
        <div className="container-responsive py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3">
            <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-gold-600" />
            <span className="text-sm sm:text-base text-gray-600">Loading packages...</span>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen pt-0 bg-gray-50">
        <div className="container-responsive py-12 sm:py-16 md:py-20">
          <div className="text-center px-2 sm:px-0">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Packages</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-[44px] min-w-[44px] px-6 py-3 bg-gold-600 hover:bg-gold-700 text-black font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-0">
      {/* Hero */}
      <div
        className="relative bg-gray-900 text-white pt-0 sm:pt-0 md:pt-0 lg:pt-0 pb-0 sm:pb-0 md:pb-0 lg:pb-0"
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: "url('/images/t4.jpg')" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="flex items-center justify-center mb-0 sm:mb-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center">Event Packages</h1>
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto text-center px-2 sm:px-0 mb-0 sm:mb-0">
            From intimate gatherings to large celebrations — choose a package and customize it to your needs.
          </p>
        </div>
      </div>

      {/* Packages Section */}
      <div className="bg-gray-50 pt-8 sm:pt-16 md:pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">

        {/* Filter Section */}
        <div className="mb-3 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <PackageFilter 
              activeFilters={filters} 
              onFilterChange={handleFilterChange}
            />
            <button
              onClick={() => fetchPackages(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh packages"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Packages Grid */}
        {filteredPackages.length === 0 ? (
          <div className="text-center py-8 sm:py-10 md:py-12">
            {packages.length === 0 ? (
              <>
                <Boxes className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Packages Available</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2 sm:px-0">
                  Our event packages are currently being updated. Please check back soon or contact us for custom event solutions.
                </p>
                <button
                  onClick={() => onQuoteClick({ type: 'custom' })}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gold-600 hover:bg-gold-700 text-black text-sm sm:text-base font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-colors"
                >
                  Request Custom Package
                </button>
              </>
            ) : (
              <>
                <Filter className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Packages Found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-2 sm:px-0">
                  No packages match your current filters. Try adjusting your selection or contact us for custom solutions.
                </p>
                <button
                  onClick={() => onQuoteClick({ type: 'custom' })}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gold-600 hover:bg-gold-700 text-black text-sm sm:text-base font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-colors"
                >
                  Request Custom Package
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 border-t-2 border-gold-500 pt-1 sm:border-t-0 sm:pt-0">
            {filteredPackages.map((pkg) => (
              <PackageCard 
                key={pkg._id} 
                package={pkg} 
                onQuoteClick={onQuoteClick}
                onDetailsClick={(p, startIndex = 0) => { setSelectedPackage(p); setModalImageIndex(startIndex); setShowDetails(true); }}
              />
            ))}
          </div>
        )}

        {/* Results Info */}
        {filteredPackages.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredPackages.length} of {packages.length} packages
          </div>
        )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetails(false)} aria-hidden="true" />
          <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 m-0 sm:m-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{selectedPackage.name}</h3>
                <p className="text-gray-500 text-sm sm:text-base">Category: {selectedPackage.category}</p>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="min-h-[44px] min-w-[44px] -mr-2 sm:mr-0 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
                aria-label="Close"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            {/* Images Carousel */}
            {(() => {
              const list = [];
              if (Array.isArray(selectedPackage.images) && selectedPackage.images.length) {
                for (const im of selectedPackage.images) {
                  if (typeof im === 'string') list.push(im);
                  else if (im?.url) list.push(im.url);
                }
              }
              if (selectedPackage.imageUrl) list.unshift(selectedPackage.imageUrl);
              // Add cache busting to ensure updated images are loaded
              const images = Array.from(new Set(list)).map(url => {
                if (!url || url.startsWith('/images/')) return url; // Don't add cache busting to local images
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}t=${Date.now()}`;
              });
              if (!images.length) return null;
              const total = images.length;
              const prev = () => setModalImageIndex((i) => (i - 1 + total) % total);
              const next = () => setModalImageIndex((i) => (i + 1) % total);
              return (
                <div
                  className="relative mb-4 rounded-lg overflow-hidden"
                  onMouseEnter={() => setIsCarouselPaused(true)}
                  onMouseLeave={() => setIsCarouselPaused(false)}
                >
                  <img
                    src={images[modalImageIndex]}
                    alt={`${selectedPackage.name} ${modalImageIndex + 1}`}
                    className="w-full h-40 sm:h-64 md:h-72 object-cover select-none"
                    onTouchStart={(e) => setTouchStartX(e.changedTouches[0].clientX)}
                    onTouchMove={(e) => {
                      if (touchStartX == null) return;
                      // Do not update index on move; only on end to avoid accidental swipes
                    }}
                    onTouchEnd={(e) => {
                      if (touchStartX == null) return;
                      const dx = e.changedTouches[0].clientX - touchStartX;
                      const threshold = 40; // px
                      if (dx > threshold) {
                        prev();
                      } else if (dx < -threshold) {
                        next();
                      }
                      setTouchStartX(null);
                    }}
                    onFocus={() => setIsCarouselPaused(true)}
                    onBlur={() => setIsCarouselPaused(false)}
                  />
                  {total > 1 && (
                    <>
                      {/* Image Counter */}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                        {modalImageIndex + 1} of {total}
                      </div>

                      {/* Controls */}
                      <button
                        type="button"
                        aria-label="Previous image"
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-full bg-white/90 hover:bg-white shadow"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <button
                        type="button"
                        aria-label="Next image"
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] p-2 rounded-full bg-white/90 hover:bg-white shadow"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      {/* Dots */}
                      <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            onClick={() => setModalImageIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === modalImageIndex ? 'w-5 bg-white' : 'w-2 bg-white/70 hover:bg-white'}`}
                            style={{ minWidth: i === modalImageIndex ? '1.25rem' : '0.5rem' }}
                          />
                        ))}
                      </div>
                      {/* Thumbnails (limited with +N overlay) */}
                      <div className="mt-2 grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                        {(() => {
                          const maxThumbs = 6; // adjust if needed
                          const showOverlay = images.length > maxThumbs;
                          const thumbs = images.slice(0, showOverlay ? maxThumbs : images.length);
                          return thumbs.map((src, i) => {
                            const isLastWithOverlay = showOverlay && i === maxThumbs - 1;
                            return (
                              <button
                                key={`thumb-${i}`}
                                type="button"
                                onClick={() => setModalImageIndex(i)}
                                className={`relative aspect-[4/3] rounded-md overflow-hidden border ${i === modalImageIndex ? 'border-gold-500 ring-1 ring-gold-500' : 'border-gray-200 hover:border-gray-300'}`}
                                aria-label={`View image ${i + 1}`}
                              >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                                {isLastWithOverlay && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold px-2 py-1 rounded-full bg-black/60">
                                      +{images.length - maxThumbs}
                                    </span>
                                  </div>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {selectedPackage.description && (
              <p className="text-gray-700 text-sm sm:text-base mb-4">{selectedPackage.description}</p>
            )}

            {Array.isArray(selectedPackage.features) && selectedPackage.features.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Included Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.features.map((f, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{f}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => { setShowDetails(false); onQuoteClick({ preSelectedItem: { type: 'package', packageId: selectedPackage._id, packageName: selectedPackage.name, estimatedCost: selectedPackage.basePrice ?? selectedPackage.price ?? 0 } }); }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gold-600 hover:bg-gold-700 text-black font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
              >
                Add to Quotation
              </button>
              <button
                onClick={() => setShowDetails(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gold-600 text-gold-700 hover:bg-gold-50 font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
