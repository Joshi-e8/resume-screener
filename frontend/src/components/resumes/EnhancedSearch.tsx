"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Clock, X, Filter, Sparkles, TrendingUp, User, MapPin, Briefcase } from "lucide-react";

interface SearchSuggestion {
  text: string;
  type: 'skill' | 'location' | 'title' | 'name' | 'experience';
  count?: number;
  trending?: boolean;
}

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  onRecentSearchClick?: (search: string) => void;
  onClearRecentSearches?: () => void;
  onAdvancedSearch?: () => void;
}

export function EnhancedSearch({
  value,
  onChange,
  placeholder = "Search resumes by name, skills, experience, or location...",
  suggestions = [],
  recentSearches = [],
  onRecentSearchClick,
  onClearRecentSearches,
  onAdvancedSearch
}: EnhancedSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on current input
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(value.toLowerCase()) &&
    suggestion.text.toLowerCase() !== value.toLowerCase()
  ).slice(0, 6);

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

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'skill': return Sparkles;
      case 'location': return MapPin;
      case 'title': return Briefcase;
      case 'name': return User;
      case 'experience': return TrendingUp;
      default: return Search;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'skill': return 'text-purple-500 bg-purple-50';
      case 'location': return 'text-blue-500 bg-blue-50';
      case 'title': return 'text-green-500 bg-green-50';
      case 'name': return 'text-orange-500 bg-orange-50';
      case 'experience': return 'text-red-500 bg-red-50';
      default: return 'text-gray-500 bg-gray-50';
    }
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
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${
            isFocused ? 'text-yellow-500' : 'text-gray-400'
          }`} />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className={`w-full pl-10 pr-12 py-3 border rounded-xl transition-all duration-300 ${
              isFocused
                ? 'border-yellow-500 ring-2 ring-yellow-500 ring-opacity-20 shadow-lg'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Advanced Search Button */}
        {onAdvancedSearch && (
          <button
            onClick={onAdvancedSearch}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-700 rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
            title="Advanced Search"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Advanced</span>
          </button>
        )}
      </div>

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestions && hasDropdownContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-10 max-h-80 overflow-y-auto animate-fade-in">
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
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:scale-105"
                    style={{
                      animationDelay: `${index * 0.1}s`,
                      animation: 'fadeInUp 0.4s ease-out forwards'
                    }}
                  >
                    <div className="p-1 bg-gray-100 rounded-full">
                      <Clock className="w-3 h-3 text-gray-500" />
                    </div>
                    <span className="truncate">{search}</span>
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
              <div className="space-y-2">
                {filteredSuggestions.map((suggestion, index) => {
                  const Icon = getSuggestionIcon(suggestion.type);
                  const colorClass = getSuggestionColor(suggestion.type);

                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.text)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-3 transition-all duration-200 hover:scale-105 group"
                      style={{
                        animationDelay: `${index * 0.1}s`,
                        animation: 'fadeInUp 0.4s ease-out forwards'
                      }}
                    >
                      <div className={`p-1.5 rounded-full ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{highlightMatch(suggestion.text, value)}</span>
                          <div className="flex items-center gap-2 ml-2">
                            {suggestion.trending && (
                              <div className="flex items-center gap-1 text-xs text-orange-500">
                                <TrendingUp className="w-3 h-3" />
                                <span>Trending</span>
                              </div>
                            )}
                            {suggestion.count && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {suggestion.count}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 capitalize mt-0.5">
                          {suggestion.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
