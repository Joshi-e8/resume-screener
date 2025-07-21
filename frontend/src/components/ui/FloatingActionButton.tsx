"use client";

import { useState } from "react";
import { Plus, Upload, Search, Filter, X } from "lucide-react";
import Link from "next/link";

interface FloatingAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onClick?: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: FloatingAction[];
  className?: string;
}

const defaultActions: FloatingAction[] = [
  {
    icon: Upload,
    label: "Upload Resume",
    href: "/dashboard/resumes/upload",
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    icon: Search,
    label: "Advanced Search",
    onClick: () => console.log("Advanced search"),
    color: "bg-green-500 hover:bg-green-600"
  },
  {
    icon: Filter,
    label: "Quick Filter",
    onClick: () => console.log("Quick filter"),
    color: "bg-purple-500 hover:bg-purple-600"
  }
];

export function FloatingActionButton({ 
  actions = defaultActions,
  className = ""
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      {/* Action Items */}
      <div className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-center gap-3"
            style={{ 
              animationDelay: `${index * 0.1}s`,
              animation: isOpen ? 'fadeInUp 0.3s ease-out forwards' : 'none'
            }}
          >
            {/* Label */}
            <div className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap">
              {action.label}
            </div>
            
            {/* Action Button */}
            {action.href ? (
              <Link
                href={action.href}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${
                  action.color || 'bg-yellow-500 hover:bg-yellow-600'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <action.icon className="w-5 h-5" />
              </Link>
            ) : (
              <button
                onClick={() => {
                  action.onClick?.();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 ${
                  action.color || 'bg-yellow-500 hover:bg-yellow-600'
                }`}
              >
                <action.icon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Mobile-specific FAB that only shows on small screens
export function MobileFloatingActionButton(props: FloatingActionButtonProps) {
  return (
    <div className="block sm:hidden">
      <FloatingActionButton {...props} />
    </div>
  );
}
