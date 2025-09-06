// Bundle optimization utilities
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(() => importFunc());
};

// Code splitting for heavy components
export const LazyQuoteModal = lazyLoadComponent(() => import('../components/QuoteModal'));
export const LazyPaymentModal = lazyLoadComponent(() => import('../components/PaymentModal'));
export const LazyFeedbackModal = lazyLoadComponent(() => import('../components/FeedbackModal'));

// Tree shaking helpers
export const optimizeImports = {
  // Only import what you need from lucide-react
  icons: {
    X: () => import('lucide-react').then(mod => ({ default: mod.X })),
    ArrowLeft: () => import('lucide-react').then(mod => ({ default: mod.ArrowLeft })),
    Calendar: () => import('lucide-react').then(mod => ({ default: mod.Calendar })),
    Users: () => import('lucide-react').then(mod => ({ default: mod.Users })),
    MapPin: () => import('lucide-react').then(mod => ({ default: mod.MapPin })),
    Package: () => import('lucide-react').then(mod => ({ default: mod.Package })),
    Loader2: () => import('lucide-react').then(mod => ({ default: mod.Loader2 })),
    AlertCircle: () => import('lucide-react').then(mod => ({ default: mod.AlertCircle })),
    CheckCircle: () => import('lucide-react').then(mod => ({ default: mod.CheckCircle })),
    RefreshCw: () => import('lucide-react').then(mod => ({ default: mod.RefreshCw })),
    Send: () => import('lucide-react').then(mod => ({ default: mod.Send })),
  }
};

// Image optimization
export const optimizeImage = (src, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    placeholder = 'blur'
  } = options;

  // Add image optimization parameters
  const params = new URLSearchParams();
  if (width) params.set('w', width);
  if (height) params.set('h', height);
  if (quality) params.set('q', quality);
  if (format) params.set('f', format);
  if (placeholder) params.set('placeholder', placeholder);

  return `${src}?${params.toString()}`;
};

// Memory management
export const createMemoryManager = () => {
  const cache = new Map();
  const maxSize = 100;

  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    clear: () => cache.clear(),
    size: () => cache.size
  };
};

// Performance monitoring
export const performanceMetrics = {
  startTime: null,
  endTime: null,
  
  start: () => {
    performanceMetrics.startTime = performance.now();
  },
  
  end: (label) => {
    performanceMetrics.endTime = performance.now();
    const duration = performanceMetrics.endTime - performanceMetrics.startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
};
