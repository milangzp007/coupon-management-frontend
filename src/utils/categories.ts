// Categories from sample products - In production, these would come from a Categories API
export const CATEGORIES = [
  'electronics',
  'sports',
  'groceries',
  'books',
  'beauty',
  'fashion',
] as const;

export type Category = typeof CATEGORIES[number];

