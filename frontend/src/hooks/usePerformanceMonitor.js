import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times in ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    measureRender: (fn) => {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} operation took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }
  };
}
