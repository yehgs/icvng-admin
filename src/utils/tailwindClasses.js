// src/utils/tailwindClasses.js
// Helper object to replace custom CSS classes with Tailwind v4 utilities

export const buttonClasses = {
  primary:
    'bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-smooth font-medium',
  secondary:
    'bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-smooth font-medium',
  success:
    'bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-smooth font-medium',
  warning:
    'bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-smooth font-medium',
  danger:
    'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-smooth font-medium',
  outline:
    'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-smooth font-medium',
};

export const cardClasses = {
  base: 'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700',
  hover:
    'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200',
  interactive:
    'bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
  glass: 'glass-effect rounded-lg border border-white/20 dark:border-white/10',
};

export const badgeClasses = {
  success:
    'px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium',
  warning:
    'px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-xs font-medium',
  danger:
    'px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-medium',
  info: 'px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium',
  gray: 'px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 rounded-full text-xs font-medium',
  primary:
    'px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium',
};

export const formClasses = {
  input:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-smooth',
  inputError:
    'w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-smooth error-border',
  inputSuccess:
    'w-full px-3 py-2 border border-green-300 dark:border-green-600 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-smooth success-border',
  select:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none transition-smooth',
  textarea:
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none transition-smooth',
  label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
  error: 'mt-1 text-sm text-red-600 dark:text-red-400',
  help: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
};

export const tableClasses = {
  container: 'overflow-x-auto',
  table: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
  thead: 'bg-gray-50 dark:bg-gray-900',
  tbody:
    'bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700',
  row: 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
  cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white',
  header:
    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
};

export const modalClasses = {
  backdrop:
    'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
  content:
    'bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto',
  header:
    'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
  body: 'p-6',
  footer:
    'flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
};

export const layoutClasses = {
  sidebar: {
    collapsed: 'sidebar-collapsed transition-theme',
    expanded: 'sidebar-expanded transition-theme',
    base: 'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-theme z-40',
  },
  header: {
    base: 'header-gradient border-b border-gray-200 dark:border-gray-700 transition-theme',
    container: 'flex items-center justify-between px-6 py-4',
  },
  main: {
    withSidebar: 'ml-64 transition-all duration-300',
    withCollapsedSidebar: 'ml-16 transition-all duration-300',
    content: 'p-6 min-h-screen',
  },
};

export const statusClasses = {
  active: 'text-green-600 dark:text-green-400',
  inactive: 'text-gray-500 dark:text-gray-400',
  suspended: 'text-red-600 dark:text-red-400',
  pending: 'text-yellow-600 dark:text-yellow-400',
  online: 'text-green-500',
  offline: 'text-gray-400',
};

export const animationClasses = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  bounceSubtle: 'animate-bounce-subtle',
  pulseShow: 'animate-pulse-slow',
  spin: 'animate-spin',
  ping: 'animate-ping',
  bounce: 'animate-bounce',
  pulse: 'animate-pulse',
};

export const utilityClasses = {
  skeleton: 'skeleton rounded',
  loading:
    'animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full',
  scrollable: 'scrollable',
  glass: 'glass-effect',
  shadow: {
    soft: 'soft-shadow',
    glass: 'shadow-lg backdrop-blur-sm',
  },
  gradient: {
    coffee: 'coffee-gradient',
    coffeeReverse: 'coffee-gradient-reverse',
    coffeeBg: 'coffee-bg',
  },
  text: {
    shadow: 'text-shadow',
    shadowLg: 'text-shadow-lg',
  },
  transition: {
    theme: 'transition-theme',
    smooth: 'transition-smooth',
    all: 'transition-all duration-200',
  },
};

// Helper function to combine classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Helper function to get button variant
export const getButtonClass = (
  variant = 'primary',
  size = 'md',
  disabled = false
) => {
  const base = buttonClasses[variant] || buttonClasses.primary;
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return cn(
    base.replace(/px-\d+ py-\d+/, ''), // Remove default padding
    sizeClasses[size],
    disabledClass
  );
};

// Helper function to get badge variant
export const getBadgeClass = (variant = 'gray', size = 'md') => {
  const base = badgeClasses[variant] || badgeClasses.gray;
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return cn(
    base.replace(/px-\d+ py-\d+/, ''), // Remove default padding
    sizeClasses[size]
  );
};

// Helper function to get status color
export const getStatusClass = (status) => {
  const statusMap = {
    Active: statusClasses.active,
    Inactive: statusClasses.inactive,
    Suspended: statusClasses.suspended,
    Pending: statusClasses.pending,
    Online: statusClasses.online,
    Offline: statusClasses.offline,
  };

  return statusMap[status] || statusClasses.inactive;
};

// Helper function for form validation classes
export const getFormInputClass = (hasError = false, hasSuccess = false) => {
  if (hasError) return formClasses.inputError;
  if (hasSuccess) return formClasses.inputSuccess;
  return formClasses.input;
};

// Responsive utility classes
export const responsiveClasses = {
  grid: {
    responsive:
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    autoFit: 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4',
    twoCol: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
    threeCol: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
  spacing: {
    section: 'space-y-6',
    content: 'space-y-4',
    tight: 'space-y-2',
    loose: 'space-y-8',
  },
};

export default {
  buttonClasses,
  cardClasses,
  badgeClasses,
  formClasses,
  tableClasses,
  modalClasses,
  layoutClasses,
  statusClasses,
  animationClasses,
  utilityClasses,
  responsiveClasses,
  cn,
  getButtonClass,
  getBadgeClass,
  getStatusClass,
  getFormInputClass,
};
