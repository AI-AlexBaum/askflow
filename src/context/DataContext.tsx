import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product, FAQCategory, FAQItem } from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  loading: boolean;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  addCategory: (productId: string, parentCategoryId: string | null, category: Omit<FAQCategory, 'id'>) => void;
  updateCategory: (productId: string, categoryId: string, updates: Partial<Omit<FAQCategory, 'id'>>) => void;
  deleteCategory: (productId: string, categoryId: string) => void;
  addFAQItem: (productId: string, categoryId: string, item: Omit<FAQItem, 'id'>) => void;
  updateFAQItem: (productId: string, categoryId: string, itemId: string, updates: Partial<Omit<FAQItem, 'id'>>) => void;
  deleteFAQItem: (productId: string, categoryId: string, itemId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  const loadPublicProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/public/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    if (auth.isAuthenticated) {
      try {
        const res = await auth.fetchWithAuth('/api/admin/products');
        if (res.ok) {
          const adminProducts = await res.json();
          const fullProducts: Product[] = [];
          for (const p of adminProducts) {
            const catRes = await auth.fetchWithAuth(`/api/admin/categories?product_id=${p.id}`);
            const cats = catRes.ok ? await catRes.json() : [];
            const itemRes = await auth.fetchWithAuth('/api/admin/faq-items');
            const allItems = itemRes.ok ? await itemRes.json() : [];
            const catMap = new Map<string, FAQCategory>();
            const roots: FAQCategory[] = [];
            cats.sort((a: any, b: any) => a.sort_order - b.sort_order);
            for (const c of cats) {
              catMap.set(c.id, {
                id: c.id,
                title: c.title,
                description: c.description || undefined,
                icon: c.icon || undefined,
                status: c.status || 'published',
                subcategories: [],
                items: allItems
                  .filter((i: any) => i.category_id === c.id)
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((i: any) => ({ id: i.id, question: i.question, answer: i.answer, status: i.status || 'published' })),
              });
            }
            for (const c of cats) {
              const node = catMap.get(c.id)!;
              if (c.parent_id && catMap.has(c.parent_id)) {
                catMap.get(c.parent_id)!.subcategories!.push(node);
              } else {
                roots.push(node);
              }
            }
            fullProducts.push({ id: p.id, name: p.name, description: p.description, status: p.status || 'published', categories: roots });
          }
          setProducts(fullProducts);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to public
      }
    }
    await loadPublicProducts();
  }, [auth, loadPublicProducts]);

  useEffect(() => {
    refreshProducts();
  }, [auth.isAuthenticated]); // eslint-disable-line

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    auth.fetchWithAuth('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: product.name, description: product.description, status: product.status || 'published' }),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, 'id'>>) => {
    auth.fetchWithAuth(`/api/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const deleteProduct = useCallback((id: string) => {
    auth.fetchWithAuth(`/api/admin/products/${id}`, { method: 'DELETE' })
      .then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const addCategory = useCallback((productId: string, parentCategoryId: string | null, category: Omit<FAQCategory, 'id'>) => {
    auth.fetchWithAuth('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        parent_id: parentCategoryId,
        title: category.title,
        description: category.description || '',
        icon: category.icon || '',
      }),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const updateCategory = useCallback((_productId: string, categoryId: string, updates: Partial<Omit<FAQCategory, 'id'>>) => {
    auth.fetchWithAuth(`/api/admin/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const deleteCategory = useCallback((_productId: string, categoryId: string) => {
    auth.fetchWithAuth(`/api/admin/categories/${categoryId}`, { method: 'DELETE' })
      .then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const addFAQItem = useCallback((_productId: string, categoryId: string, item: Omit<FAQItem, 'id'>) => {
    auth.fetchWithAuth('/api/admin/faq-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, question: item.question, answer: item.answer, status: item.status || 'published' }),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const updateFAQItem = useCallback((_productId: string, _categoryId: string, itemId: string, updates: Partial<Omit<FAQItem, 'id'>>) => {
    auth.fetchWithAuth(`/api/admin/faq-items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).then(() => refreshProducts());
  }, [auth, refreshProducts]);

  const deleteFAQItem = useCallback((_productId: string, _categoryId: string, itemId: string) => {
    auth.fetchWithAuth(`/api/admin/faq-items/${itemId}`, { method: 'DELETE' })
      .then(() => refreshProducts());
  }, [auth, refreshProducts]);

  return (
    <DataContext.Provider value={{
      products, setProducts, loading, refreshProducts,
      addProduct, updateProduct, deleteProduct,
      addCategory, updateCategory, deleteCategory,
      addFAQItem, updateFAQItem, deleteFAQItem,
    }}>
      {children}
    </DataContext.Provider>
  );
}
