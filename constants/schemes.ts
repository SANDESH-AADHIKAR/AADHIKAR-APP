/**
 * Placeholder scheme data.
 *
 * Replace this with the real dataset / API response when it's ready.
 * Every screen reads from this single source so the shape only needs to
 * be updated in one place.
 */

export type SchemeCategory =
  | 'Agriculture'
  | 'Health'
  | 'Education'
  | 'Housing'
  | 'Finance'
  | 'Women & Child';

export type SchemeStatus = 'open' | 'closing-soon' | 'ongoing';

export type Scheme = {
  id: string;
  title: string;
  description: string;
  category: SchemeCategory;
  benefit: string;
  deadline?: string;
  status: SchemeStatus;
};

export const SCHEMES: Scheme[] = [
  {
    id: 'pm-kisan',
    title: 'PM Kisan Samman Nidhi',
    description:
      'Income support of ₹6,000 per year for small and marginal farmer families, paid in three instalments.',
    category: 'Agriculture',
    benefit: '₹6,000 / year',
    deadline: '31 Mar 2027',
    status: 'open',
  },
  {
    id: 'ayushman-bharat',
    title: 'Ayushman Bharat PM-JAY',
    description:
      'Health cover of ₹5 lakh per family per year for secondary and tertiary hospitalisation.',
    category: 'Health',
    benefit: '₹5 lakh cover',
    status: 'ongoing',
  },
  {
    id: 'sukanya-samriddhi',
    title: 'Sukanya Samriddhi Yojana',
    description:
      'A small savings scheme for a girl child with one of the highest interest rates on deposits.',
    category: 'Women & Child',
    benefit: '8.2% p.a.',
    deadline: 'Open all year',
    status: 'ongoing',
  },
  {
    id: 'pmay-g',
    title: 'PM Awas Yojana (Gramin)',
    description:
      'Financial assistance to build a pucca house for eligible rural households.',
    category: 'Housing',
    benefit: 'Up to ₹1.2 lakh',
    deadline: '30 Nov 2026',
    status: 'closing-soon',
  },
  {
    id: 'nsp',
    title: 'National Scholarship Portal',
    description:
      'Scholarships for students from low-income families across school and higher education.',
    category: 'Education',
    benefit: 'Up to ₹2 lakh / year',
    deadline: '15 Dec 2026',
    status: 'open',
  },
  {
    id: 'mudra',
    title: 'Pradhan Mantri MUDRA Yojana',
    description:
      'Collateral-free loans for small businesses under the Shishu, Kishor and Tarun categories.',
    category: 'Finance',
    benefit: 'Up to ₹10 lakh',
    status: 'ongoing',
  },
];
