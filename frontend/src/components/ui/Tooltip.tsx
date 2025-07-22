"use client";

import { useState, useRef, ReactNode, cloneElement, isValidElement, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 500,
  disabled = false,
  className = "",
  maxWidth = "200px"
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const showTooltip = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const target = event.currentTarget as HTMLElement;
      if (!target) return;

      try {
        const rect = target.getBoundingClientRect();
        const scrollX = window.pageXOffset || 0;
        const scrollY = window.pageYOffset || 0;

        let x = 0;
        let y = 0;

        switch (position) {
          case 'top':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.top + scrollY - 10;
            break;
          case 'bottom':
            x = rect.left + scrollX + rect.width / 2;
            y = rect.bottom + scrollY + 10;
            break;
          case 'left':
            x = rect.left + scrollX - 10;
            y = rect.top + scrollY + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollX + 10;
            y = rect.top + scrollY + rect.height / 2;
            break;
        }

        setTooltipPosition({ x, y });
        setIsVisible(true);
      } catch (error) {
        console.warn('Tooltip positioning error:', error);
      }
    }, delay);
  }, [disabled, position, delay]);

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = `
      absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg
      pointer-events-none transform transition-all duration-200
      ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
    `;

    const positionClasses = {
      top: '-translate-x-1/2 -translate-y-full',
      bottom: '-translate-x-1/2 translate-y-0',
      left: '-translate-x-full -translate-y-1/2',
      right: 'translate-x-0 -translate-y-1/2'
    };

    return `${baseClasses} ${positionClasses[position]} ${className}`;
  };

  const getArrowClasses = () => {
    const baseClasses = "absolute w-2 h-2 bg-gray-900 transform rotate-45";
    
    const arrowPositions = {
      top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2',
      left: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2',
      right: 'right-full top-1/2 translate-x-1/2 -translate-y-1/2'
    };

    return `${baseClasses} ${arrowPositions[position]}`;
  };

  // Clone the child element to add event handlers
  const triggerElement = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
        ref: triggerRef
      })
    : children;

  return (
    <>
      {triggerElement}
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          className={getTooltipClasses()}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            maxWidth
          }}
        >
          {content}
          <div className={getArrowClasses()} />
        </div>,
        document.body
      )}
    </>
  );
}

// Specialized tooltip components
interface InfoTooltipProps {
  content: ReactNode;
  className?: string;
}

export function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position="top" className={className}>
      <button className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>
    </Tooltip>
  );
}

interface HelpTooltipProps {
  content: ReactNode;
  className?: string;
}

export function HelpTooltip({ content, className = "" }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position="top" className={className}>
      <button className="inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors duration-200">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a1.5 1.5 0 112.12 2.12L10 10.06V11a1 1 0 11-2 0v-1.5a1 1 0 01.5-.866l1.5-.866a.5.5 0 10-.5-.866L8.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    </Tooltip>
  );
}

// Tooltip with rich content
interface RichTooltipProps {
  title: string;
  description: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function RichTooltip({
  title,
  description,
  children,
  position = 'top',
  className = ""
}: RichTooltipProps) {
  const content = (
    <div className="text-left">
      <div className="font-semibold text-white mb-1">{title}</div>
      <div className="text-gray-300 text-xs">{description}</div>
    </div>
  );

  return (
    <Tooltip 
      content={content} 
      position={position} 
      className={className}
      maxWidth="250px"
    >
      {children}
    </Tooltip>
  );
}

// Status tooltip for showing status information
interface StatusTooltipProps {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function StatusTooltip({
  status,
  title,
  description,
  children,
  position = 'top'
}: StatusTooltipProps) {
  const statusColors = {
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  const statusIcons = {
    success: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  };

  const content = (
    <div className="flex items-start gap-2 text-left">
      <div className="flex-shrink-0 text-white mt-0.5">
        {statusIcons[status]}
      </div>
      <div>
        <div className="font-semibold text-white">{title}</div>
        {description && (
          <div className="text-gray-300 text-xs mt-1">{description}</div>
        )}
      </div>
    </div>
  );

  return (
    <Tooltip 
      content={content} 
      position={position}
      className={statusColors[status]}
      maxWidth="250px"
    >
      {children}
    </Tooltip>
  );
}
