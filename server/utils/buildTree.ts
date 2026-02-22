interface FlatCategory {
  id: string;
  product_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
}

interface FlatFaqItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface TreeCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  subcategories: TreeCategory[];
  items: TreeFaqItem[];
}

interface TreeFaqItem {
  id: string;
  question: string;
  answer: string;
}

interface TreeProduct {
  id: string;
  name: string;
  description: string;
  categories: TreeCategory[];
}

interface FlatProduct {
  id: string;
  name: string;
  description: string;
  sort_order: number;
}

export function buildCategoryTree(
  categories: FlatCategory[],
  items: FlatFaqItem[],
  parentId: string | null = null
): TreeCategory[] {
  const itemsByCategory = new Map<string, FlatFaqItem[]>();
  for (const item of items) {
    const list = itemsByCategory.get(item.category_id) || [];
    list.push(item);
    itemsByCategory.set(item.category_id, list);
  }

  return categories
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(cat => ({
      id: cat.id,
      title: cat.title,
      description: cat.description || undefined,
      icon: cat.icon || undefined,
      subcategories: buildCategoryTree(categories, items, cat.id),
      items: (itemsByCategory.get(cat.id) || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(i => ({ id: i.id, question: i.question, answer: i.answer })),
    }));
}

export function buildProductTree(
  products: FlatProduct[],
  categories: FlatCategory[],
  items: FlatFaqItem[]
): TreeProduct[] {
  return products
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      categories: buildCategoryTree(
        categories.filter(c => c.product_id === p.id),
        items,
        null
      ),
    }));
}
