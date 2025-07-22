"use client";

import { ReactNode, createContext, useContext, useState } from "react";
import { AlertTriangle, Trash2, X, Check } from "lucide-react";

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: ReactNode;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within a ConfirmDialogProvider');
  }
  return context;
}

interface ConfirmDialogProviderProps {
  children: ReactNode;
}

export function ConfirmDialogProvider({ children }: ConfirmDialogProviderProps) {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (dialog) {
      dialog.resolve(true);
      setDialog(null);
    }
  };

  const handleCancel = () => {
    if (dialog) {
      dialog.resolve(false);
      setDialog(null);
    }
  };

  const getTypeStyles = (type: string = 'info') => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          confirmText: 'text-white'
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: 'text-white'
        };
      default:
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          confirmText: 'text-white'
        };
    }
  };

  const getDefaultIcon = (type: string = 'info') => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <Check className="w-6 h-6" />;
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      
      {dialog?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300"
              onClick={handleCancel}
            />
            
            {/* Dialog */}
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md shadow-xl transform transition-all duration-300 scale-100">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                  ${getTypeStyles(dialog.options.type).iconBg}
                `}>
                  <div className={getTypeStyles(dialog.options.type).iconColor}>
                    {dialog.options.icon || getDefaultIcon(dialog.options.type)}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {dialog.options.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {dialog.options.message}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={handleCancel}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  {dialog.options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`
                    flex-1 px-4 py-2 rounded-lg transition-colors duration-200 font-medium
                    ${getTypeStyles(dialog.options.type).confirmBg}
                    ${getTypeStyles(dialog.options.type).confirmText}
                  `}
                >
                  {dialog.options.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}
