import React, { memo, useState, useCallback } from 'react';

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
    <img
      src={imageSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
});

export { OptimizedImage };
