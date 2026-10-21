import { useCallback, useEffect, useRef, useState } from 'react';

import { CATEGORIES } from '@/constants/schemes';
import type { SchemeInfo } from '@/constants/types';
import { supabase, supabaseConfigError } from '@/lib/supabase';

const CATEGORY_ORDER: readonly string[] = CATEGORIES.filter(
  (category) => category !== 'All'
);

type SchemeRow = SchemeInfo & {
  sort_order?: number | null;
};

function categoryRank(category: string) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function compareSchemes(a: SchemeRow, b: SchemeRow) {
  const categoryDifference = categoryRank(a.category) - categoryRank(b.category);
  if (categoryDifference !== 0) return categoryDifference;

  // Fall back to the name when sort_order was not set in the database.
  const orderDifference = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (orderDifference !== 0) return orderDifference;

  return a.name.localeCompare(b.name);
}

export function useSchemes() {
  const [schemes, setSchemes] = useState<SchemeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (refresh = false) => {
    if (!supabase) {
      setError(supabaseConfigError);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('schemes')
        .select(
          'id, category, name, benefits, eligibility, link, sort_order, is_active'
        )
        .eq('is_active', true);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (queryError) {
        setError(queryError.message);
      } else {
        const rows = ((data ?? []) as SchemeRow[]).slice().sort(compareSchemes);
        setSchemes(rows);
      }
    } catch (caught) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(
        caught instanceof Error ? caught.message : 'Could not load schemes.'
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => load(true), [load]);

  return {
    schemes,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
