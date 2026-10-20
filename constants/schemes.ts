import type { SchemeInfo } from './types';

// Static scheme directory for the hackathon MVP.
// Later: move to Supabase table + full-text search.
export const SCHEMES_DB: SchemeInfo[] = [
  { id: '1', category: 'Agriculture', name: 'PM-KISAN', benefits: '₹6000/year in 3 installments', eligibility: 'Small/marginal farmers', link: 'https://pmkisan.gov.in' },
  { id: '2', category: 'Agriculture', name: 'PM Fasal Bima Yojana', benefits: 'Crop insurance against natural calamities', eligibility: 'All farmers with insurable crops', link: 'https://pmfby.gov.in' },
  { id: '3', category: 'Agriculture', name: 'Soil Health Card', benefits: 'Soil testing and nutrient advice', eligibility: 'All farmers', link: 'https://soilhealth.dac.gov.in' },
  { id: '4', category: 'Agriculture', name: 'Kisan Credit Card', benefits: 'Easy credit for farming needs', eligibility: 'Farmers, SHGs', link: 'https://pib.gov.in' },
  { id: '5', category: 'Agriculture', name: 'Paramparagat Krishi Vikas', benefits: 'Support for organic farming', eligibility: 'Farmer clusters', link: 'https://pgsindia-ncof.gov.in' },
  { id: '6', category: 'Education', name: 'PM SHRI Schools', benefits: 'Upgraded high-quality schooling', eligibility: 'Students in selected schools', link: 'https://pmshrischools.education.gov.in' },
  { id: '7', category: 'Education', name: 'Samagra Shiksha', benefits: 'Holistic school education support', eligibility: 'Pre-school to Class 12', link: 'https://samagra.education.gov.in' },
  { id: '8', category: 'Education', name: 'National Scholarship Portal', benefits: 'Direct financial aid for studies', eligibility: 'Merit/Minority/SC/ST students', link: 'https://scholarships.gov.in' },
  { id: '9', category: 'Education', name: 'Beti Bachao Beti Padhao', benefits: 'Education and health for girl children', eligibility: 'Families with girl children', link: 'https://wcd.nic.in' },
  { id: '10', category: 'Education', name: 'Mid Day Meal (PM POSHAN)', benefits: 'Free nutritious meals in school', eligibility: 'Primary/Upper primary students', link: 'https://pmposhan.education.gov.in' },
  { id: '11', category: 'Health', name: 'Ayushman Bharat (PM-JAY)', benefits: '₹5 Lakh health cover per family', eligibility: 'SECC 2011 identified families', link: 'https://nha.gov.in' },
  { id: '12', category: 'Health', name: 'PM Bhartiya Janaushadhi', benefits: 'Generic medicines at 50-90% less cost', eligibility: 'General public', link: 'http://janaushadhi.gov.in' },
  { id: '13', category: 'Health', name: 'PM Surakshit Matritva', benefits: 'Free antenatal checkups for pregnant women', eligibility: 'Pregnant women', link: 'https://pmsma.nhp.gov.in' },
  { id: '14', category: 'Health', name: 'Mission Indradhanush', benefits: 'Complete immunization for children', eligibility: 'Children under 2, pregnant women', link: 'https://nhp.gov.in' },
  { id: '15', category: 'Health', name: 'PM Swasthya Suraksha', benefits: 'Upgraded medical colleges/AIIMS', eligibility: 'All citizens', link: 'https://pmssy-mohfw.nic.in' },
  { id: '16', category: 'Finance', name: 'PM Mudra Yojana', benefits: 'Loans up to ₹10 Lakh for businesses', eligibility: 'Small business owners', link: 'https://mudra.org.in' },
  { id: '17', category: 'Finance', name: 'Stand Up India', benefits: 'Loans for SC/ST and Women', eligibility: 'New entrepreneurs', link: 'https://standupmitra.in' },
  { id: '18', category: 'Finance', name: 'PM SVANidhi', benefits: 'Credit for street vendors', eligibility: 'Street vendors in urban areas', link: 'https://pmsvanidhi.mohua.gov.in' },
  { id: '19', category: 'Finance', name: 'Atal Pension Yojana', benefits: 'Guaranteed monthly pension', eligibility: 'Workers in unorganized sector', link: 'https://npscra.nsdl.co.in' },
  { id: '20', category: 'Finance', name: 'Startup India', benefits: 'Tax exemptions and funding', eligibility: 'Recognized startups', link: 'https://startupindia.gov.in' },
  { id: '21', category: 'Housing', name: 'PMAY-Gramin', benefits: 'Financial aid for rural housing', eligibility: 'Rural homeless', link: 'https://pmayg.nic.in' },
  { id: '22', category: 'Housing', name: 'PMAY-Urban', benefits: 'Subsidy on home loans', eligibility: 'Urban EWS/LIG families', link: 'https://pmay-urban.gov.in' },
  { id: '23', category: 'Social', name: 'Ujjwala Yojana', benefits: 'Free LPG connection', eligibility: 'Women in BPL families', link: 'https://pmuy.gov.in' },
  { id: '24', category: 'Social', name: 'PM Garib Kalyan Anna', benefits: 'Free food grains (5kg/person)', eligibility: 'NFSA beneficiaries', link: 'https://dfpd.gov.in' },
  { id: '25', category: 'Social', name: 'Jal Jeevan Mission', benefits: 'Safe tap water to every home', eligibility: 'Rural households', link: 'https://jaljeevanmission.gov.in' },
];

export const CATEGORIES = [
  'All',
  'Agriculture',
  'Education',
  'Health',
  'Finance',
  'Housing',
] as const;
