"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp, Filter } from "lucide-react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
  category?: string;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

interface EnhancedSearchProps {
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  onSearch?: (query: string, filters: SearchFilter[]) => void;
  onFilterChange?: (filters: SearchFilter[]) => void;
  className?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

const defaultSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'Frontend Developer', type: 'recent' },
  { id: '2', text: 'React Engineer', type: 'recent' },
  { id: '3', text: 'Senior Software Engineer', type: 'popular' },
  { id: '4', text: 'Product Manager', type: 'popular' },
  { id: '5', text: 'UX Designer', type: 'suggestion', category: 'Design' },
  { id: '6', text: 'Data Scientist', type: 'suggestion', category: 'Analytics' },
];

const defaultFilters: SearchFilter[] = [
  { id: 'experience', label: 'Experience Level', value: 'all', active: false },
  { id: 'location', label: 'Location', value: 'all', active: false },
  { id: 'department', label: 'Department', value: 'all', active: false },
  { id: 'skills', label: 'Skills', value: 'all', active: false },
];

export function EnhancedSearch({
  placeholder = "Search resumes, jobs, candidates...",
  suggestions = defaultSuggestions,
  filters = defaultFilters,
  onSearch,
  onFilterChange,
  className = "",
  showFilters = true,
  autoFocus = false
}: EnhancedSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filters);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)].slice(0, 5);
        return updated;
      });
      
      onSearch?.(searchQuery, activeFilters);
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
  };

  const handleFilterToggle = (filterId: string) => {
    const updated = activeFilters.map(filter =>
      filter.id === filterId ? { ...filter, active: !filter.active } : filter
    );
    setActiveFilters(updated);
    onFilterChange?.(updated);
  };

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const clearFilters = () => {
    const cleared = activeFilters.map(filter => ({ ...filter, active: false }));
    setActiveFilters(cleared);
    onFilterChange?.(cleared);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.text.toLowerCase().includes(query.toLowerCase())
  );

  const activeFilterCount = activeFilters.filter(f => f.active).length;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-sm"
        />
        
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border transition-colors duration-200
              ${activeFilterCount > 0 
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilters.filter(f => f.active).map(filter => (
            <span
              key={filter.id}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
            >
              {filter.label}
              <button
                onClick={() => handleFilterToggle(filter.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && !query && (
            <div className="p-3 border-b border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick({ id: `recent-${index}`, text: search, type: 'recent' })}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {filteredSuggestions.length > 0 && (
            <div className="p-3">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                {query ? 'Suggestions' : 'Popular Searches'}
              </h4>
              <div className="space-y-1">
                {filteredSuggestions.slice(0, 6).map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                  >
                    {getSuggestionIcon(suggestion.type)}
                    <span className="flex-1">{suggestion.text}</span>
                    {suggestion.category && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {suggestion.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Options */}
          {showFilters && (
            <div className="p-3 border-t border-gray-100">
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Quick Filters
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterToggle(filter.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors duration-200
                      ${filter.active 
                        ? 'bg-yellow-100 border-yellow-300 text-yellow-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className={`w-3 h-3 rounded border ${
                      filter.active ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'
                    }`}>
                      {filter.active && <div className="w-full h-full bg-white rounded-sm scale-50" />}
                    </div>
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {query && filteredSuggestions.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found for &quot;{query}&quot;</p>
              <button
                onClick={() => handleSearch()}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
              >
                Search anyway
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
