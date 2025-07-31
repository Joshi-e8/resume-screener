"use client";

import { useEffect, useState, createContext, useContext, ReactNode, useCallback, useRef, useMemo } from "react";
import { Command, X } from "lucide-react";

interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  category?: string;
  disabled?: boolean;
}

interface KeyboardShortcutsContextType {
  registerShortcut: (id: string, shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: () => void;
  hideHelp: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map());
  const [showHelpModal, setShowHelpModal] = useState(false);

  const registerShortcut = useCallback((id: string, shortcut: Shortcut) => {
    setShortcuts(prev => {
      const newMap = new Map(prev);
      newMap.set(id, shortcut);
      return newMap;
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts(prev => {
      if (!prev.has(id)) return prev;
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const showHelp = useCallback(() => setShowHelpModal(true), []);
  const hideHelp = useCallback(() => setShowHelpModal(false), []);

  const parseKeyCombo = useCallback((key: string): { ctrl: boolean; shift: boolean; alt: boolean; key: string } => {
    const parts = key.toLowerCase().split('+');
    return {
      ctrl: parts.includes('ctrl') || parts.includes('cmd'),
      shift: parts.includes('shift'),
      alt: parts.includes('alt'),
      key: parts[parts.length - 1]
    };
  }, []);

  const matchesKeyCombo = useCallback((event: KeyboardEvent, combo: string): boolean => {
    const parsed = parseKeyCombo(combo);

    return (
      event.key.toLowerCase() === parsed.key &&
      event.ctrlKey === parsed.ctrl &&
      event.shiftKey === parsed.shift &&
      event.altKey === parsed.alt
    );
  }, [parseKeyCombo]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Exception for help shortcut
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        showHelp();
      }
      return;
    }

    // Check for registered shortcuts
    for (const [, shortcut] of shortcuts) {
      if (!shortcut.disabled && matchesKeyCombo(event, shortcut.key)) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, showHelp, matchesKeyCombo]);

  useEffect(() => {

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const contextValue = useMemo(() => ({
    registerShortcut,
    unregisterShortcut,
    showHelp,
    hideHelp
  }), [registerShortcut, unregisterShortcut, showHelp, hideHelp]);

  const groupedShortcuts = useMemo(() => {
    return Array.from(shortcuts.entries()).reduce((acc, [id, shortcut]) => {
      const category = shortcut.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push({ id, ...shortcut });
      return acc;
    }, {} as Record<string, Array<Shortcut & { id: string }>>);
  }, [shortcuts]);

  const formatKeyCombo = useCallback((key: string): string => {
    return key
      .split('+')
      .map(k => {
        switch (k.toLowerCase()) {
          case 'ctrl': return '⌘';
          case 'cmd': return '⌘';
          case 'shift': return '⇧';
          case 'alt': return '⌥';
          default: return k.toUpperCase();
        }
      })
      .join(' + ');
  }, []);

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      
      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={hideHelp} />
            
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Command className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Keyboard Shortcuts
                  </h2>
                </div>
                
                <button
                  onClick={hideHelp}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      {category}
                    </h3>
                    
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">
                            {shortcut.description}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {formatKeyCombo(shortcut.key).split(' + ').map((key, index, array) => (
                              <span key={index} className="flex items-center">
                                <kbd className="px-2 py-1 text-xs font-mono bg-white border border-gray-300 rounded shadow-sm">
                                  {key}
                                </kbd>
                                {index < array.length - 1 && (
                                  <span className="mx-1 text-gray-400">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(groupedShortcuts).length === 0 && (
                  <div className="text-center py-8">
                    <Command className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No keyboard shortcuts available</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Press <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded">?</kbd> to show this help again
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}

// Hook for registering shortcuts
export function useShortcut(
  key: string,
  action: () => void,
  options: {
    description: string;
    category?: string;
    disabled?: boolean;
    dependencies?: unknown[];
  }
) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  // Use a stable ID
  const id = useRef(`shortcut-${Math.random().toString(36).substring(2, 9)}`).current;

  useEffect(() => {
    const shortcut = {
      key,
      description: options.description,
      action,
      category: options.category,
      disabled: options.disabled
    };

    registerShortcut(id, shortcut);
    return () => unregisterShortcut(id);
  }, [id, registerShortcut, unregisterShortcut, key, action, options.description, options.category, options.disabled]);
}

// Common shortcuts component
export function CommonShortcuts() {
  const { showHelp } = useKeyboardShortcuts();

  // Memoize the callback functions to prevent re-registration
  const handleShowHelp = useCallback(() => {
    showHelp();
  }, [showHelp]);

  const handleFocusSearch = useCallback(() => {
    // Focus search
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleEscape = useCallback(() => {
    // Close modals, clear focus
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }

    // Close any open modals
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    if (closeButtons.length > 0) {
      (closeButtons[0] as HTMLElement).click();
    }
  }, []);

  // Global shortcuts
  useShortcut('shift+?', handleShowHelp, {
    description: 'Show keyboard shortcuts',
    category: 'Global',
    dependencies: [handleShowHelp]
  });

  useShortcut('ctrl+k', handleFocusSearch, {
    description: 'Focus search',
    category: 'Navigation',
    dependencies: [handleFocusSearch]
  });

  useShortcut('esc', handleEscape, {
    description: 'Close modal or clear focus',
    category: 'Global',
    dependencies: [handleEscape]
  });

  return null;
}

// Shortcut display component
interface ShortcutDisplayProps {
  shortcut: string;
  className?: string;
}

export function ShortcutDisplay({ shortcut, className = "" }: ShortcutDisplayProps) {
  const formatKeyCombo = (key: string): string => {
    return key
      .split('+')
      .map(k => {
        switch (k.toLowerCase()) {
          case 'ctrl': return '⌘';
          case 'cmd': return '⌘';
          case 'shift': return '⇧';
          case 'alt': return '⌥';
          default: return k.toUpperCase();
        }
      })
      .join(' + ');
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {formatKeyCombo(shortcut).split(' + ').map((key, index, array) => (
        <span key={index} className="flex items-center">
          <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
            {key}
          </kbd>
          {index < array.length - 1 && (
            <span className="mx-1 text-gray-400">+</span>
          )}
        </span>
      ))}
    </div>
  );
}
