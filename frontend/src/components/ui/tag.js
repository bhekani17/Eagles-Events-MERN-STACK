import React from 'react';

const tagVariants = {
  gray: 'bg-gray-100 text-gray-700',
  gold: 'bg-gold-100 text-gold-800',
  outline: 'bg-white text-gray-700 border border-gray-200',
};

const tagSizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
};

export function Tag({ children, className = '', variant = 'gray', size = 'sm', rounded = 'full', ...props }) {
  const variantCls = tagVariants[variant] || tagVariants.gray;
  const sizeCls = tagSizes[size] || tagSizes.sm;
  const roundedCls = rounded === 'full' ? 'rounded-full' : 'rounded-md';
  const base = 'inline-flex items-center whitespace-nowrap';
  const combined = `${base} ${variantCls} ${sizeCls} ${roundedCls} ${className}`.trim();
  return (
    <span className={combined} {...props}>
      {children}
    </span>
  );
}
