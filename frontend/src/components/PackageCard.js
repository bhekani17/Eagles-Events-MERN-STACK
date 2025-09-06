import { useEffect, useMemo, useRef, useState, memo, useCallback } from 'react';
import { Star, Users, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tag } from './ui/tag';
import { OptimizedImage } from './OptimizedImage';
import { formatCurrency } from '../utils/helpers';

const PackageCard = memo(function PackageCard({ package: pkg, onQuoteClick, onDetailsClick, featured = false }) {
  // Build images list from package data (primary first, deduped)
  const images = useMemo(() => {
    const list = [];
    if (Array.isArray(pkg?.images) && pkg.images.length > 0) {
      // Sort so primary appears first, maintain relative order otherwise
      const sorted = [...pkg.images].sort((a, b) => (b?.isPrimary === true) - (a?.isPrimary === true));
      for (const img of sorted) {
        if (typeof img === 'string' && img) list.push(img);
        else if (img?.url) list.push(img.url);
      }
    }
    if (pkg?.imageUrl) list.unshift(pkg.imageUrl);
    // Deduplicate while preserving order
    const seen = new Set();
    const unique = list.filter((u) => {
      if (!u || seen.has(u)) return false;
      seen.add(u);
      return true;
    });
    // Add cache busting parameter to image URLs to ensure updates are visible
    const cacheBusted = unique.map(url => {
      if (!url || url.startsWith('/images/')) return url; // Don't add cache busting to local images
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    });
    // Fallback placeholder if empty
    return cacheBusted.length ? cacheBusted : ['/images/aux.jpg'];
  }, [pkg]);

  const [current, setCurrent] = useState(0);
  const total = images.length;
  const prev = useCallback((e) => { 
    e?.stopPropagation?.(); 
    setCurrent((c) => (c - 1 + total) % total); 
  }, [total]);
  
  const next = useCallback((e) => { 
    e?.stopPropagation?.(); 
    setCurrent((c) => (c + 1) % total); 
  }, [total]);

  // Reset current index when images change to stay in bounds
  useEffect(() => {
    setCurrent(0);
  }, [total]);

  // Touch swipe support (mobile)
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, active: false });
  const touchDeltaRef = useRef({ x: 0, y: 0 });
  const SWIPE_THRESHOLD = 40; // px

  const onTouchStart = useCallback((e) => {
    const t = e.touches?.[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), active: true };
    touchDeltaRef.current = { x: 0, y: 0 };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchStartRef.current.active) return;
    const t = e.touches?.[0];
    if (!t) return;
    touchDeltaRef.current = { x: t.clientX - touchStartRef.current.x, y: t.clientY - touchStartRef.current.y };
    // Do not prevent scrolling unless it's clearly horizontal
    if (Math.abs(touchDeltaRef.current.x) > Math.abs(touchDeltaRef.current.y)) {
      e.preventDefault?.();
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStartRef.current.active) return;
    const { x, y } = touchDeltaRef.current;
    touchStartRef.current.active = false;
    if (Math.abs(x) > Math.abs(y) && Math.abs(x) > SWIPE_THRESHOLD) {
      if (x < 0) next(e); else prev(e);
    }
  }, [next, prev]);

  const handleGetQuote = useCallback(() => {
    onQuoteClick({
      preSelectedItem: {
        type: 'package',
        packageId: pkg._id,
        packageName: pkg.name,
        estimatedCost: pkg.basePrice ?? pkg.price ?? 0
      }
    });
  }, [onQuoteClick, pkg._id, pkg.name, pkg.basePrice, pkg.price]);

  const handleDetails = useCallback(() => {
    if (typeof onDetailsClick === 'function') {
      onDetailsClick(pkg, current);
    }
  }, [onDetailsClick, pkg, current]);

  return (
    <div className={`relative bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 card-touch ${
      featured ? 'ring-2 ring-gold-500' : ''
    }`}>
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-gold-500 text-black px-3 py-1 rounded-full text-sm font-semibold flex items-center">
            <Star className="w-4 h-4 mr-1" />
            Popular
          </span>
        </div>
      )}
      
      {/* Image */}
      <div
        className="relative h-24 sm:h-52 md:h-60 overflow-hidden group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <OptimizedImage
          src={images[current]}
          alt={pkg.name}
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          threshold={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
        {total > 1 && (
          <>
            {/* Image Counter */}
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {current + 1}/{total}
            </div>

            {/* Prev/Next Controls */}
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 rounded-full bg-white/80 hover:bg-white shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={`min-h-[24px] min-w-[24px] rounded-full transition-all duration-300 ${
                    i === current ? 'w-5 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        {/* Price badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-white/90 text-gray-900 shadow">
            {formatCurrency(pkg.basePrice ?? pkg.price ?? 0)}
          </span>
        </div>
      </div>

      {/* Thumbnails: show all images for quick access */}
      {total > 1 && (
        <div className="px-2 sm:px-5 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">
              {total} image{total !== 1 ? 's' : ''} available
            </span>
            <span className="text-xs text-gray-400">
              {current + 1} of {total}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View image ${i + 1} of ${pkg.name}`}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
                  i === current 
                    ? 'ring-2 ring-amber-500 border-amber-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
                style={{ width: 60, height: 45 }}
              >
                <OptimizedImage 
                  src={src} 
                  alt={`${pkg.name} ${i + 1}`} 
                  className="w-full h-full object-cover" 
                  threshold={50}
                />
                {i === current && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-2 sm:p-5 md:p-6 bg-white sm:bg-none">
        {/* Header */}
        <div className="mb-2 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge size="md" variant="gold">
              {pkg.category}
            </Badge>
          </div>
          <h3 className="text-xs sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2">{pkg.name}</h3>
          {(pkg.description || pkg.shortDescription) && (
            <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">{pkg.description || pkg.shortDescription}</p>
          )}
        </div>

        {/* Package Details */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-4 mb-1 sm:mb-4 text-[10px] sm:text-xs md:text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{pkg.minGuests}-{pkg.maxGuests} guests</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{pkg.duration}</span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-2 sm:mb-6">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">Included:</h4>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {pkg.features.slice(0, 4).map((feature, index) => (
              <Tag
                key={index}
                variant="gray"
                size="sm"
                className={`${index >= 2 ? 'hidden sm:inline-flex' : ''}`}
              >
                <CheckCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                {feature}
              </Tag>
            ))}
            {pkg.features.length > 2 && (
              <Tag variant="outline" size="sm" className="inline-flex sm:hidden text-[10px]">
                +{pkg.features.length - 2} more
              </Tag>
            )}
            {pkg.features.length > 4 && (
              <Tag variant="outline" size="md" className="hidden sm:inline-flex">
                +{pkg.features.length - 4} more
              </Tag>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          <Button
            onClick={handleDetails}
            className="w-full bg-gold-600 hover:bg-gold-700 text-black font-medium sm:font-semibold rounded-md sm:rounded-full text-[10px] sm:text-xs md:text-sm py-1 sm:py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
          >
            Details
          </Button>
          <Button
            onClick={handleGetQuote}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-medium sm:font-semibold rounded-md sm:rounded-full text-[10px] sm:text-xs md:text-sm py-1 sm:py-2 md:py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
          >
            Add to Quotation
          </Button>
        </div>
      </div>
    </div>
  );
});

export { PackageCard };
