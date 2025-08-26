import { useState, useEffect, useCallback } from 'react';
import { getDocuments } from '../services/documentService';
import { Document } from '../types/document';

const ITEMS_PER_PAGE = 10;

interface DocumentFilters {
  searchQuery?: string;
  sortBy?: 'date' | 'title'; // Соответствует DocumentSortOption
  sortDirection?: 'asc' | 'desc';
}

const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<DocumentFilters>({
    sortBy: 'date' // Значение по умолчанию
  });

  useEffect(() => {
    const fetchInitialDocuments = async () => {
      setIsLoading(true);
      try {
        const response = await getDocuments({
          offset: 0,
          limit: ITEMS_PER_PAGE,
          sortBy: filters.sortBy || 'date'
        });

        setDocuments(response.data);
        setHasMore(response.data.length === ITEMS_PER_PAGE);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialDocuments();
  }, [filters.sortBy]);
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const response = await getDocuments({
        offset: documents.length,
        limit: ITEMS_PER_PAGE,
        sortBy: filters.sortBy || 'date',
        searchQuery: filters.searchQuery,
        sortDirection: filters.sortDirection
      });

      if (response.data.length > 0) {
        setDocuments(prevDocs => [...prevDocs, ...response.data]);
        setHasMore(response.data.length === ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
      setError(null);
    } catch (err) {
      console.error('Error loading more documents:', err);
      setError(err instanceof Error ? err : new Error('Failed to load more documents'));
    } finally {
      setIsLoading(false);
    }
  }, [documents.length, filters, hasMore, isLoading]);

  const search = useCallback(async (newFilters: DocumentFilters) => {
    setIsLoading(true);
    try {
      const response = await getDocuments({
        offset: 0,
        limit: ITEMS_PER_PAGE,
        sortBy: newFilters.sortBy || 'date',
        searchQuery: newFilters.searchQuery,
        sortDirection: newFilters.sortDirection
      });

      setDocuments(response.data);
      setHasMore(response.data.length === ITEMS_PER_PAGE);
      setFilters(newFilters);
      setError(null);
    } catch (err) {
      console.error('Error searching documents:', err);
      setError(err instanceof Error ? err : new Error('Failed to search documents'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Адаптеры для использования в компонентах
  const setSearchQuery = useCallback((query: string) => {
    search({ ...filters, searchQuery: query });
  }, [filters, search]);

  const setSortBy = useCallback((sortOption: 'date' | 'title') => {
    search({ ...filters, sortBy: sortOption });
  }, [filters, search]);

  return {
    documents,
    hasMore,
    isLoading,
    error,
    loadMore,
    search,
    setSearchQuery,
    setSortBy,
    searchQuery: filters.searchQuery || '',
    sortBy: filters.sortBy || 'date',
    loading: isLoading,
    hasNextPage: hasMore,
    retry: () => search(filters)
  };
};

export default useDocuments;

