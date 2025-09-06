import React from 'react';

const buttonVariants = {
  default: "bg-primary-600 text-white hover:bg-primary-700",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
  ghost: "text-gray-700 hover:bg-gray-100",
  link: "text-primary-600 underline-offset-4 hover:underline"
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10",
  // Touch-friendly sizes for mobile devices
  touch: "min-h-[44px] min-w-[44px] px-4 py-2",
  "touch-sm": "min-h-[40px] min-w-[40px] px-3 py-1.5",
  "touch-lg": "min-h-[48px] min-w-[48px] px-6 py-3"
};

export function Button({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  mobileFullWidth = true,
  enableTouchEnhancements = true,
  ...props 
}) {
  // Base styles prioritize accessibility and good focus states
  const baseClasses = "inline-flex items-center justify-center select-none rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = buttonVariants[variant] || buttonVariants.default;
  const sizeClasses = buttonSizes[size] || buttonSizes.default;

  // Mobile-first touch enhancements: larger hit area, better feedback, and optional full-width on small screens
  const mobileTouchClasses = enableTouchEnhancements
    ? [
        // Ensure minimum touch target on mobile; relax on larger screens
        "min-h-[44px] min-w-[44px] text-base sm:text-sm sm:min-h-0 sm:min-w-0",
        // Subtle press feedback for touch devices
        "touch-feedback active:scale-95",
        // Make primary CTAs easier to tap by spanning width on mobile if requested
        mobileFullWidth ? "w-full sm:w-auto" : ""
      ].join(' ').trim()
    : "";
  
  const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${mobileTouchClasses} ${className}`.trim();

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
