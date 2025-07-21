import { Resume } from "@/data/mockResumes";

export interface SearchHighlight {
  text: string;
  isHighlighted: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'skill' | 'location' | 'title' | 'name' | 'experience';
  count?: number;
  trending?: boolean;
}

/**
 * Highlights search terms in text
 */
export function highlightSearchTerms(text: string, searchQuery: string): SearchHighlight[] {
  if (!searchQuery.trim()) {
    return [{ text, isHighlighted: false }];
  }

  const query = searchQuery.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: SearchHighlight[] = [];
  
  let lastIndex = 0;
  let index = lowerText.indexOf(query);
  
  while (index !== -1) {
    // Add non-highlighted part before match
    if (index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, index),
        isHighlighted: false
      });
    }
    
    // Add highlighted match
    parts.push({
      text: text.slice(index, index + query.length),
      isHighlighted: true
    });
    
    lastIndex = index + query.length;
    index = lowerText.indexOf(query, lastIndex);
  }
  
  // Add remaining non-highlighted part
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isHighlighted: false
    });
  }
  
  return parts;
}

/**
 * Advanced search with multiple terms and operators
 */
export function parseSearchQuery(query: string): {
  terms: string[];
  excludeTerms: string[];
  exactPhrases: string[];
} {
  const terms: string[] = [];
  const excludeTerms: string[] = [];
  const exactPhrases: string[] = [];
  
  // Match quoted phrases
  const phraseMatches = query.match(/"([^"]+)"/g);
  if (phraseMatches) {
    phraseMatches.forEach(match => {
      exactPhrases.push(match.slice(1, -1)); // Remove quotes
      query = query.replace(match, ''); // Remove from main query
    });
  }
  
  // Split remaining query into words
  const words = query.split(/\s+/).filter(word => word.length > 0);
  
  words.forEach(word => {
    if (word.startsWith('-') && word.length > 1) {
      excludeTerms.push(word.slice(1).toLowerCase());
    } else if (word.length > 0) {
      terms.push(word.toLowerCase());
    }
  });
  
  return { terms, excludeTerms, exactPhrases };
}

/**
 * Advanced resume filtering with search operators
 */
export function filterResumesAdvanced(resumes: Resume[], searchQuery: string): Resume[] {
  if (!searchQuery.trim()) return resumes;
  
  const { terms, excludeTerms, exactPhrases } = parseSearchQuery(searchQuery);
  
  return resumes.filter(resume => {
    const searchableText = `${resume.name} ${resume.title} ${resume.skills.join(' ')} ${resume.location} ${resume.summary}`.toLowerCase();
    
    // Check exact phrases
    for (const phrase of exactPhrases) {
      if (!searchableText.includes(phrase.toLowerCase())) {
        return false;
      }
    }
    
    // Check exclude terms
    for (const excludeTerm of excludeTerms) {
      if (searchableText.includes(excludeTerm)) {
        return false;
      }
    }
    
    // Check include terms (all must match)
    for (const term of terms) {
      if (!searchableText.includes(term)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Generate search suggestions based on resume data
 */
export function generateSearchSuggestions(resumes: Resume[]): SearchSuggestion[] {
  const skillCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const titleCounts = new Map<string, number>();

  resumes.forEach(resume => {
    // Count skills
    resume.skills.forEach(skill => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });

    // Count job titles
    titleCounts.set(resume.title, (titleCounts.get(resume.title) || 0) + 1);

    // Count locations (city only)
    const city = resume.location.split(',')[0].trim();
    locationCounts.set(city, (locationCounts.get(city) || 0) + 1);
  });

  const suggestions: SearchSuggestion[] = [];

  // Add top skills
  Array.from(skillCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([skill, count]) => {
      suggestions.push({
        text: skill,
        type: 'skill',
        count,
        trending: count > 3
      });
    });

  // Add top locations
  Array.from(locationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([location, count]) => {
      suggestions.push({
        text: location,
        type: 'location',
        count
      });
    });

  // Add top titles
  Array.from(titleCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([title, count]) => {
      suggestions.push({
        text: title,
        type: 'title',
        count
      });
    });

  // Add experience level suggestions
  suggestions.push(
    { text: 'Senior', type: 'experience', trending: true },
    { text: 'Junior', type: 'experience' },
    { text: 'Mid-level', type: 'experience' }
  );

  return suggestions;
}

/**
 * Get popular search terms from resumes
 */
export function getPopularSearchTerms(resumes: Resume[]): string[] {
  const termCounts = new Map<string, number>();
  
  resumes.forEach(resume => {
    // Count skills
    resume.skills.forEach(skill => {
      const count = termCounts.get(skill) || 0;
      termCounts.set(skill, count + 1);
    });
    
    // Count job title words
    resume.title.split(' ').forEach(word => {
      if (word.length > 2) {
        const count = termCounts.get(word.toLowerCase()) || 0;
        termCounts.set(word.toLowerCase(), count + 1);
      }
    });
  });
  
  // Sort by frequency and return top terms
  return Array.from(termCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term);
}

/**
 * Save search to local storage
 */
export function saveSearchToHistory(query: string): void {
  if (!query.trim()) return;
  
  const searches = getSearchHistory();
  const updatedSearches = [query, ...searches.filter(s => s !== query)].slice(0, 10);
  
  localStorage.setItem('resumeSearchHistory', JSON.stringify(updatedSearches));
}

/**
 * Get search history from local storage
 */
export function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem('resumeSearchHistory');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  localStorage.removeItem('resumeSearchHistory');
}
