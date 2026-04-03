// Local storage service for managing search history

const STORAGE_KEY = 'dleva_search_history';

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
};

const searchHistory = {
  // Get all recent searches
  getHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? normalizeHistory(JSON.parse(data)) : [];
    } catch {
      return [];
    }
  },

  // Add a new search (avoid duplicates, keep most recent)
  addSearch: (query) => {
    if (!query || !query.trim()) return;

    try {
      const history = searchHistory.getHistory();
      const trimmed = query.trim();
      
      // Remove if already exists
      const filtered = history.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      
      // Add to front
      const updated = normalizeHistory([trimmed, ...filtered]); // Keep last 10
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving search history:', err);
    }
  },

  // Remove a specific search
  removeSearch: (query) => {
    try {
      const history = searchHistory.getHistory();
      const updated = history.filter(q => q.toLowerCase() !== query.toLowerCase());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error removing search:', err);
    }
  },

  // Clear all searches
  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing search history:', err);
    }
  },
};

export default searchHistory;
