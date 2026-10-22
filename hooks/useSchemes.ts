import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORIES } from "@/constants/schemes";
import type { SchemeInfo } from "@/constants/types";
import { supabase, supabaseConfigError } from "@/lib/supabase";

const CATEGORY_ORDER: readonly string[] = CATEGORIES.filter(
  (category) => category !== "All",
);

// Include the new translation columns in our raw type
type RawSchemeRow = SchemeInfo & {
  sort_order?: number | null;
  name_hi?: string | null;
  name_mr?: string | null;
  benefits_hi?: string | null;
  benefits_mr?: string | null;
  eligibility_hi?: string | null;
  eligibility_mr?: string | null;
};

function categoryRank(category: string) {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? CATEGORY_ORDER.length : index;
}

function compareSchemes(a: RawSchemeRow, b: RawSchemeRow) {
  const categoryDifference =
    categoryRank(a.category) - categoryRank(b.category);
  if (categoryDifference !== 0) return categoryDifference;

  const orderDifference = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (orderDifference !== 0) return orderDifference;

  return a.name.localeCompare(b.name);
}

export function useSchemes() {
  const { i18n } = useTranslation(); // Listen for language changes
  const [rawSchemes, setRawSchemes] = useState<RawSchemeRow[]>([]);
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
      // Fetch the English columns PLUS the new Hindi and Marathi columns
      const { data, error: queryError } = await supabase
        .from("schemes")
        .select(
          "id, category, name, name_hi, name_mr, benefits, benefits_hi, benefits_mr, eligibility, eligibility_hi, eligibility_mr, link, sort_order, is_active",
        )
        .eq("is_active", true);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      if (queryError) {
        setError(queryError.message);
      } else {
        const rows = ((data ?? []) as RawSchemeRow[])
          .slice()
          .sort(compareSchemes);
        setRawSchemes(rows);
      }
    } catch (caught) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(
        caught instanceof Error ? caught.message : "Could not load schemes.",
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

  // Dynamically map the raw database rows to the current language
  // This runs instantly whenever i18n.language changes without needing to hit the database again
  const localizedSchemes = useMemo<SchemeInfo[]>(() => {
    const lang = i18n.language; // 'en', 'hi', or 'mr'

    return rawSchemes.map((row) => {
      // Pick the correct string, falling back to English if the translation is missing
      const name =
        lang === "hi" && row.name_hi
          ? row.name_hi
          : lang === "mr" && row.name_mr
            ? row.name_mr
            : row.name;

      const benefits =
        lang === "hi" && row.benefits_hi
          ? row.benefits_hi
          : lang === "mr" && row.benefits_mr
            ? row.benefits_mr
            : row.benefits;

      const eligibility =
        lang === "hi" && row.eligibility_hi
          ? row.eligibility_hi
          : lang === "mr" && row.eligibility_mr
            ? row.eligibility_mr
            : row.eligibility;

      return {
        id: row.id,
        category: row.category,
        link: row.link,
        is_active: row.is_active,
        name,
        benefits,
        eligibility,
      };
    });
  }, [rawSchemes, i18n.language]);

  return {
    schemes: localizedSchemes, // Return the mapped schemes to the app
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
