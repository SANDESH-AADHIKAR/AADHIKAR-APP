export type SchemeCategory =
  | 'Agriculture'
  | 'Education'
  | 'Health'
  | 'Finance'
  | 'Housing'
  | 'Social'
  | 'Women';

export type SchemeInfo = {
  id: string;
  category: SchemeCategory;
  name: string;
  benefits: string;
  eligibility: string;
  link: string;
};
