"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  shortcut?: string;
  separator?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  children: ReactNode;
  disabled?: boolean;
}

export function ContextMenu({ items, children, disabled = false }: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    
    // Estimate menu dimensions (adjust based on your menu styling)
    const menuWidth = 200;
    const menuHeight = items.length * 40 + 16; // Approximate height
    
    // Adjust position to keep menu within viewport
    let x = clientX;
    let y = clientY;
    
    if (x + menuWidth > innerWidth) {
      x = innerWidth - menuWidth - 10;
    }
    
    if (y + menuHeight > innerHeight) {
      y = innerHeight - menuHeight - 10;
    }

    setPosition({ x, y });
    setIsOpen(true);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    
    item.onClick();
    setIsOpen(false);
  };

  const formatShortcut = (shortcut: string) => {
    return shortcut
      .split('+')
      .map(key => {
        switch (key.toLowerCase()) {
          case 'ctrl': return '⌘';
          case 'cmd': return '⌘';
          case 'shift': return '⇧';
          case 'alt': return '⌥';
          default: return key.toUpperCase();
        }
      })
      .join('');
  };

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className="inline-block"
      >
        {children}
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48 animate-in fade-in-0 zoom-in-95"
          style={{
            left: position.x,
            top: position.y
          }}
        >
          {items.map((item, index) => (
            <div key={item.id}>
              {item.separator && index > 0 && (
                <div className="my-1 border-t border-gray-100" />
              )}
              
              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors duration-150
                  ${item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : item.destructive
                      ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {item.icon && (
                    <div className="w-4 h-4 flex-shrink-0">
                      {item.icon}
                    </div>
                  )}
                  <span>{item.label}</span>
                </div>
                
                {item.shortcut && (
                  <span className="text-xs text-gray-400 ml-4">
                    {formatShortcut(item.shortcut)}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

// Hook for creating common context menu items
export function useCommonMenuItems() {
  return {
    copy: (onCopy: () => void): MenuItem => ({
      id: 'copy',
      label: 'Copy',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onCopy,
      shortcut: 'Ctrl+C'
    }),

    edit: (onEdit: () => void): MenuItem => ({
      id: 'edit',
      label: 'Edit',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: onEdit
    }),

    delete: (onDelete: () => void): MenuItem => ({
      id: 'delete',
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: onDelete,
      destructive: true,
      shortcut: 'Delete'
    }),

    view: (onView: () => void): MenuItem => ({
      id: 'view',
      label: 'View Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: onView
    }),

    download: (onDownload: () => void): MenuItem => ({
      id: 'download',
      label: 'Download',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: onDownload,
      shortcut: 'Ctrl+S'
    }),

    share: (onShare: () => void): MenuItem => ({
      id: 'share',
      label: 'Share',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      ),
      onClick: onShare
    }),

    separator: (): MenuItem => ({
      id: 'separator',
      label: '',
      onClick: () => {},
      separator: true
    })
  };
}

// Pre-built context menus for common scenarios
interface ResumeContextMenuProps {
  children: ReactNode;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ResumeContextMenu({
  children,
  onView,
  onEdit,
  onDownload,
  onDelete,
  disabled = false
}: ResumeContextMenuProps) {
  const common = useCommonMenuItems();

  const items: MenuItem[] = [
    common.view(onView),
    common.edit(onEdit),
    common.separator(),
    common.download(onDownload),
    common.separator(),
    common.delete(onDelete)
  ];

  return (
    <ContextMenu items={items} disabled={disabled}>
      {children}
    </ContextMenu>
  );
}

interface JobContextMenuProps {
  children: ReactNode;
  onView: () => void;
  onEdit: () => void;
  onShare: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function JobContextMenu({
  children,
  onView,
  onEdit,
  onShare,
  onDelete,
  disabled = false
}: JobContextMenuProps) {
  const common = useCommonMenuItems();

  const items: MenuItem[] = [
    common.view(onView),
    common.edit(onEdit),
    common.separator(),
    common.share(onShare),
    common.separator(),
    common.delete(onDelete)
  ];

  return (
    <ContextMenu items={items} disabled={disabled}>
      {children}
    </ContextMenu>
  );
}
