"use client";

import { useEffect, useRef, ReactNode } from "react";

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  className = "" 
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ');

      return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Skip link for keyboard navigation
interface SkipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className = "" }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium z-50
        focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2
        ${className}
      `}
    >
      {children}
    </a>
  );
}

// Screen reader only text
interface ScreenReaderOnlyProps {
  children: ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className = "" }: ScreenReaderOnlyProps) {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  );
}

// Live region for announcing dynamic content changes
interface LiveRegionProps {
  children: ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({ 
  children, 
  politeness = 'polite', 
  atomic = false,
  className = "" 
}: LiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      className={`sr-only ${className}`}
    >
      {children}
    </div>
  );
}

// Focus indicator for custom interactive elements
interface FocusIndicatorProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FocusIndicator({ 
  children, 
  className = "",
  disabled = false 
}: FocusIndicatorProps) {
  return (
    <div
      className={`
        ${disabled ? '' : 'focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-2'}
        rounded-lg transition-all duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Hook for managing focus
export function useFocusManagement() {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  };

  const focusFirstError = () => {
    const errorElement = document.querySelector('[aria-invalid="true"], .error') as HTMLElement;
    if (errorElement) {
      errorElement.focus();
    }
  };

  const focusById = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  };

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return {
    focusElement,
    focusFirstError,
    focusById,
    announceToScreenReader
  };
}

// Roving tabindex for managing focus in lists/grids
interface RovingTabIndexProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  className?: string;
}

export function RovingTabIndex({ 
  children, 
  orientation = 'vertical',
  className = "" 
}: RovingTabIndexProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getFocusableItems = () => {
      return Array.from(container.querySelectorAll('[role="option"], [role="tab"], [role="menuitem"], button, a')) as HTMLElement[];
    };

    const setTabIndex = (items: HTMLElement[], activeIndex: number) => {
      items.forEach((item, index) => {
        item.tabIndex = index === activeIndex ? 0 : -1;
      });
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = getFocusableItems();
      const currentIndex = items.findIndex(item => item === document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (event.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
          }
          break;
        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          }
          break;
        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            nextIndex = (currentIndex + 1) % items.length;
          }
          break;
        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            event.preventDefault();
            nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          }
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = items.length - 1;
          break;
      }

      if (nextIndex !== currentIndex) {
        setTabIndex(items, nextIndex);
        items[nextIndex].focus();
      }
    };

    // Initialize tabindex
    const items = getFocusableItems();
    if (items.length > 0) {
      setTabIndex(items, 0);
    }

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [orientation]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// High contrast mode detection
export function useHighContrastMode() {
  const isHighContrast = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-contrast: high)').matches;

  return isHighContrast;
}

// Reduced motion detection
export function useReducedMotion() {
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return prefersReducedMotion;
}

// Focus visible utility
export function useFocusVisible() {
  useEffect(() => {
    // Add focus-visible polyfill behavior
    const handleKeyDown = () => {
      document.body.classList.add('keyboard-navigation');
    };

    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
}
