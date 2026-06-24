export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const SOURCE_LABELS = {
  salary: 'Salary',
  business: 'Business/Profession',
  capital_gains: 'Capital Gains',
  rental: 'Rental Income',
  other: 'Other Income',
};

export const SOURCE_COLORS = {
  salary: '#4F46E5',
  business: '#0891B2',
  capital_gains: '#059669',
  rental: '#D97706',
  other: '#7C3AED',
};

export const DEDUCTION_SECTIONS = [
  { value: '80C', label: '80C – LIC, PPF, ELSS, etc.', max: 150000 },
  { value: '80D', label: '80D – Medical Insurance', max: 25000 },
  { value: '80E', label: '80E – Education Loan Interest', max: null },
  { value: '80G', label: '80G – Donations', max: null },
  { value: '80TTA', label: '80TTA – Savings Account Interest', max: 10000 },
  { value: '80CCD', label: '80CCD(1B) – NPS', max: 50000 },
  { value: 'HRA', label: 'HRA – House Rent Allowance', max: null },
  { value: 'Standard', label: 'Standard Deduction (Salaried)', max: 50000 },
];
