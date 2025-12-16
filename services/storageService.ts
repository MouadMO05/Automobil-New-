import { Product } from '../types';

const STORAGE_KEY = 'my_awesome_products_db';

export const saveProductsToStorage = (products: Product[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save products to storage', error);
  }
};

export const loadProductsFromStorage = (): Product[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load products from storage', error);
    return [];
  }
};