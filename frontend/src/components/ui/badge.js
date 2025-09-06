import React from 'react';

const badgeVariants = {
  gold: 'bg-gold-100 text-gold-800',
  amber: 'bg-amber-100 text-amber-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  gray: 'bg-gray-100 text-gray-700',
  outline: 'bg-white text-gray-700 border border-gray-200',
  solidGold: 'bg-gold-500 text-black',
};

const badgeSizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function Badge({
  children,
  className = '',
  variant = 'gold',
  size = 'md',
  rounded = 'full',
  ...props
}) {
  const variantCls = badgeVariants[variant] || badgeVariants.gold;
  const sizeCls = badgeSizes[size] || badgeSizes.md;
  const roundedCls = rounded === 'full' ? 'rounded-full' : 'rounded-md';
  const base = 'inline-flex items-center font-semibold whitespace-nowrap';
  const combined = `${base} ${variantCls} ${sizeCls} ${roundedCls} ${className}`.trim();
  return (
    <span className={combined} {...props}>
      {children}
    </span>
  );
}
