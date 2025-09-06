import { memo, useState, useCallback } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className = '',
  placeholder = '/images/aux.jpg',
  effect = 'opacity',
  threshold = 100,
  ...props
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // Use placeholder if image failed to load
  const imageSrc = imageError ? placeholder : src;

  return (
    <LazyLoadImage
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      effect={effect}
      threshold={threshold}
      onError={handleError}
      onLoad={handleLoad}
      placeholderSrc={placeholder}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
});

export { OptimizedImage };
