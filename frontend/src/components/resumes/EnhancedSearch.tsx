"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Clock, X } from "lucide-react";

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecentSearches?: () => void;
}

export function EnhancedSearch({
  value,
  onChange,
  placeholder = "Search resumes by name, skills, experience, or location...",
  suggestions = [],
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches
}: EnhancedSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase()) && 
    suggestion.toLowerCase() !== value.toLowerCase()
  ).slice(0, 5);

  // Filter recent searches that don't match current input
  const filteredRecentSearches = recentSearches.filter(search =>
    search.toLowerCase().includes(value.toLowerCase()) && 
    search.toLowerCase() !== value.toLowerCase()
  ).slice(0, 3);

  const hasDropdownContent = filteredSuggestions.length > 0 || 
    (filteredRecentSearches.length > 0 && value.length === 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleRecentSearchClick = (search: string) => {
    onChange(search);
    setShowSuggestions(false);
    inputRef.current?.blur();
    onRecentSearchClick?.(search);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className={`w-full pl-10 pr-10 py-3 border rounded-xl transition-all duration-200 ${
            isFocused
              ? 'border-yellow-500 ring-2 ring-yellow-500 ring-opacity-20'
              : 'border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-20'
          }`}
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && hasDropdownContent && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {value.length === 0 && filteredRecentSearches.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Searches
                </h4>
                {onClearRecentSearches && (
                  <button
                    onClick={onClearRecentSearches}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {filteredRecentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              {value.length > 0 && (
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Suggestions
                </h4>
              )}
              <div className="space-y-1">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center gap-2"
                  >
                    <Search className="w-3 h-3 text-gray-400" />
                    <span>{highlightMatch(suggestion, value)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
