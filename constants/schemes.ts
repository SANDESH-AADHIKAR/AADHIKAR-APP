// Scheme records live in the Supabase `schemes` table. Keep the category
// order here so filters and client-side sorting stay consistent.
export const CATEGORIES = [
  'All',
  'Agriculture',
  'Education',
  'Health',
  'Finance',
  'Housing',
  'Social',
  'Women',
] as const;
