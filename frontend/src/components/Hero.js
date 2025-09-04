import { Button } from './ui/button';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Inlined ImageCarousel to reduce component count
function ImageCarousel({ slides, onQuoteClick, onHireClick, autoPlay = true, interval = 6000 }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [currentInnerIndex, setCurrentInnerIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const slidesLength = useMemo(() => slides?.length || 0, [slides]);
  const autoPlayRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slidesLength);
  }, [slidesLength]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + slidesLength) % slidesLength);
  }, [slidesLength]);



  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
  }, []);

  // Auto-play with pause on hover
  useEffect(() => {
    if (!isAutoPlaying || isPaused || !slidesLength) return;

    autoPlayRef.current = setInterval(() => {
      nextSlide();
    }, interval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, interval, isPaused, nextSlide, slidesLength]);

  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Touch handlers for mobile swipe
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next slide
        nextSlide();
      } else {
        // Swipe right - previous slide
        prevSlide();
      }
    }
  }, [nextSlide, prevSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextSlide();
          break;
        case ' ':
          e.preventDefault();
          toggleAutoPlay();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide, toggleAutoPlay]);

  // Reset inner image index when changing slides
  useEffect(() => {
    setCurrentInnerIndex(0);
  }, [currentSlide]);

  // Auto-rotate inner images for the active slide if it has multiple images
  useEffect(() => {
    if (!isAutoPlaying || isPaused || !slidesLength) return;
    const activeSlide = slides[currentSlide];
    const innerLen = (activeSlide?.images?.length || 0);
    if (innerLen <= 1) return;

    const innerTimer = setInterval(() => {
      setCurrentInnerIndex(prev => (prev + 1) % innerLen);
    }, Math.max(2000, Math.floor(interval / 2)));

    return () => clearInterval(innerTimer);
  }, [isAutoPlaying, isPaused, slides, slidesLength, currentSlide, interval]);

  if (!slides || slides.length === 0) {
    return (
      <div 
        className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center"
        role="alert"
        aria-label="No slides available"
      >
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
      aria-live={isPaused ? 'off' : 'polite'}
    >
      {/* Slides - Crossfade */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out will-change-[opacity] ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {(() => {
              const images = (slide?.images && slide.images.length > 0)
                ? slide.images
                : (slide?.image ? [slide.image] : []);
              const imgSrc = images.length
                ? images[index === currentSlide ? (currentInnerIndex % images.length) : 0]
                : '/images/placeholder.jpg';
              return (
                <LazyLoadImage
                  src={imgSrc}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                  effect="opacity"
                  width="100%"
                  height="100%"
                  loading="lazy"
                  placeholderSrc="/images/placeholder.jpg"
                />
              );
            })()}
            {/* Dark overlay for contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
            {/* Slide content */}
            <div className="absolute inset-0 flex items-start sm:items-center justify-center pt-28 sm:pt-0 p-4">
              <div className="text-center text-white max-w-4xl px-4">
                {slide.subtitle && (
                  <h2 className="text-xs sm:text-sm uppercase tracking-wide mb-1 sm:mb-2 opacity-90">
                    {slide.subtitle}
                  </h2>
                )}
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 leading-tight">
                  {slide.title}
                </h1>
                {slide.description && (
                  <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto text-white line-clamp-2 md:line-clamp-3">
                    {slide.description}
                  </p>
                )}
                <Button
                  onClick={onHireClick || onQuoteClick}
                  size="touch-lg"
                  className="bg-gold-600 hover:bg-gold-700 text-black font-semibold text-sm sm:text-base"
                  aria-label={slide.ctaText || 'Get a quote'}
                >
                  {slide.ctaText || 'Get Started'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Controllers Hidden - Slides auto-advance automatically */}
    </div>
  );
}

export function Hero({ onQuoteClick }) {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const handleHireClick = useCallback(() => {
    navigate('/hire');
  }, [navigate]);

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const heroSlides = [
    {
      id: 'VIP MOBILE TOILETS',
      image: '/images/t1.jpg',
      images: ['/images/t1.jpg', '/images/t4.jpg', '/images/t6.webp'],
      title: 'VIP Mobile Toilets',
      subtitle: 'Complete Event Solutions',
      description: 'Premium VIP mobile toilets with luxury features. Clean, hygienic, and comfortable facilities for your special events.',
      ctaText: 'Hire now'
    },
    {
      id: 'TENTS',
      image: '/images/s1.webp',
      images: ['/images/s1.webp', '/images/t4.jpg'],
      title: 'TENTS',
      subtitle: 'Perfect Hospitality Solutions',
      description: 'High-quality tents and marquees for all weather protection. Perfect for weddings, parties, and corporate events.',
      ctaText: 'Hire now'
    },
    {
      id: 'MOBILE FREEZER',
      image: '/images/f2.jpg',
      images: ['/images/f5.webp', '/images/f1.jpg'],
      title: 'Mobile Freezer',
      subtitle: 'Professional Event Services',
      description: 'Complete mobile freezer solutions including cold storage, refrigeration, and temperature control. Everything you need for successful events.',
      ctaText: 'Hire now'
    },
    {
      id: 'SLAUGHTERING SERVICES',
      image: '/images/sla.jpg',
      images: ['/images/slaughter3.jpg', '/images/slaughter2.jpg'],
      title: 'Slaughtering Services',
      subtitle: 'Professional & Hygienic',
      description: 'Professional mobile slaughtering services that bring expert meat processing to your location. Fully compliant with health standards.',
      ctaText: 'Hire now'
    }
  ];

  return (
    <section className="relative pt-16 sm:pt-20">
      {/* Main Hero Carousel with Info Overlay */}
      <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px]">
        <ImageCarousel 
          slides={heroSlides}
          onQuoteClick={onQuoteClick}
          onHireClick={handleHireClick}
          autoPlay={true}
          interval={5000}
        />
        
        {/* Logo Overlay with Animation */}
        <div 
          className={`absolute top-3 sm:top-6 md:top-8 lg:top-12 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
          }`}
        >
          <LazyLoadImage
            src="/images/logo.png"
            alt="Eagles Events Logo"
            className="h-20 sm:h-28 md:h-32 lg:h-36 w-auto drop-shadow-2xl hover:scale-105 transition-transform duration-500 ease-in-out"
            effect="opacity"
            loading="eager"
            height="auto"
            width="auto"
          />
        </div>
      </div>

      

      {/* CTA Section with Fade-in Animation */}
      <div className="bg-black py-12 sm:py-16 border-t border-gold-500">
        <div className="container-responsive max-w-4xl text-center">
          <h2 
            className={`text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 transition-all duration-1000 ease-out delay-800 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Ready to Make Your Event Unforgettable?
          </h2>
          <p 
            className={`text-lg sm:text-xl text-gold-300 mb-6 sm:mb-8 transition-all duration-1000 ease-out delay-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Get a personalized Quotation for your event needs. Our team is ready to help you create the perfect experience.
          </p>
          <div 
            className={`transition-all duration-1000 ease-out delay-1200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Button 
              onClick={onQuoteClick}
              size="touch-lg"
              className="bg-gold-600 hover:bg-gold-700 text-black font-semibold text-base sm:text-lg w-full sm:w-auto transform hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out"
            >
              Get Your Quotation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
