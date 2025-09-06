import { memo, useMemo, useRef, useEffect, useState } from 'react';

const VirtualizedList = memo(function VirtualizedList({
  items,
  itemHeight = 200,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = ''
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      ...item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.id || item.index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export { VirtualizedList };
