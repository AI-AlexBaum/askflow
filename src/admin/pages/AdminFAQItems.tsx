import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, FileQuestion, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import type { FAQCategory, FAQItem } from '../../types';
import {
  AdminModal,
  AdminPageHeader,
  AdminFormField,
  AdminConfirmDialog,
  AdminBadge,
  toast,
} from '../components';
import MarkdownEditor from '../components/MarkdownEditor';

interface FlatCategory {
  productId: string;
  productName: string;
  categoryId: string;
  categoryTitle: string;
  depth: number;
}

interface FlatItem {
  productId: string;
  productName: string;
  categoryId: string;
  categoryTitle: string;
  item: FAQItem;
}

interface FAQFormData {
  productId: string;
  categoryId: string;
  question: string;
  answer: string;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const display = status || 'published';
  const className =
    display === 'published' ? 'bg-emerald-50 text-emerald-700' :
    display === 'draft' ? 'bg-amber-50 text-amber-700' :
    'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {display}
    </span>
  );
}

function flattenCategories(
  categories: FAQCategory[],
  productId: string,
  productName: string,
  depth: number
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({
      productId,
      productName,
      categoryId: cat.id,
      categoryTitle: cat.title,
      depth,
    });
    if (cat.subcategories) {
      result.push(...flattenCategories(cat.subcategories, productId, productName, depth + 1));
    }
  }
  return result;
}

function collectItems(
  categories: FAQCategory[],
  productId: string,
  productName: string
): FlatItem[] {
  const result: FlatItem[] = [];
  for (const cat of categories) {
    if (cat.items) {
      for (const item of cat.items) {
        result.push({
          productId,
          productName,
          categoryId: cat.id,
          categoryTitle: cat.title,
          item,
        });
      }
    }
    if (cat.subcategories) {
      result.push(...collectItems(cat.subcategories, productId, productName));
    }
  }
  return result;
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <tr ref={setNodeRef} style={style} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="w-8 cursor-grab pl-3" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4 text-slate-400" />
      </td>
      {children}
    </tr>
  );
}

export default function AdminFAQItems() {
  const { products, addFAQItem, updateFAQItem, deleteFAQItem, refreshProducts } = useData();
  const { settings } = useSettings();
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FlatItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FlatItem | null>(null);
  const [localOrderOverride, setLocalOrderOverride] = useState<FlatItem[] | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const emptyForm: FAQFormData = {
    productId: products.length > 0 ? products[0].id : '',
    categoryId: '',
    question: '',
    answer: '',
    status: 'published',
  };

  const [form, setForm] = useState<FAQFormData>(emptyForm);

  const allItems = useMemo(() => {
    const items: FlatItem[] = [];
    for (const product of products) {
      items.push(...collectItems(product.categories, product.id, product.name));
    }
    return items;
  }, [products]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (filterProductId) {
      items = items.filter((i) => i.productId === filterProductId);
    }
    if (statusFilter) {
      items = items.filter((i) => (i.item.status || 'published') === statusFilter);
    }
    return items;
  }, [allItems, filterProductId, statusFilter]);

  const displayItems = localOrderOverride ?? filteredItems;

  const allFlatCategories = useMemo(() => {
    const cats: FlatCategory[] = [];
    for (const product of products) {
      cats.push(...flattenCategories(product.categories, product.id, product.name, 0));
    }
    return cats;
  }, [products]);

  const formCategories = useMemo(() => {
    return allFlatCategories.filter((c) => c.productId === form.productId);
  }, [allFlatCategories, form.productId]);

  function openAdd() {
    setEditingItem(null);
    const defaultProductId = filterProductId || (products.length > 0 ? products[0].id : '');
    const catsForProduct = allFlatCategories.filter((c) => c.productId === defaultProductId);
    setForm({
      productId: defaultProductId,
      categoryId: catsForProduct.length > 0 ? catsForProduct[0].categoryId : '',
      question: '',
      answer: '',
      status: 'published',
    });
    setModalOpen(true);
  }

  function openEdit(flatItem: FlatItem) {
    setEditingItem(flatItem);
    setForm({
      productId: flatItem.productId,
      categoryId: flatItem.categoryId,
      question: flatItem.item.question,
      answer: flatItem.item.answer,
      status: flatItem.item.status || 'published',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
  }

  function handleProductChange(productId: string) {
    const catsForProduct = allFlatCategories.filter((c) => c.productId === productId);
    setForm((f) => ({
      ...f,
      productId,
      categoryId: catsForProduct.length > 0 ? catsForProduct[0].categoryId : '',
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim() || !form.productId || !form.categoryId) return;

    if (editingItem) {
      if (
        editingItem.productId !== form.productId ||
        editingItem.categoryId !== form.categoryId
      ) {
        deleteFAQItem(editingItem.productId, editingItem.categoryId, editingItem.item.id);
        addFAQItem(form.productId, form.categoryId, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          status: form.status,
        });
      } else {
        updateFAQItem(form.productId, form.categoryId, editingItem.item.id, {
          question: form.question.trim(),
          answer: form.answer.trim(),
          status: form.status,
        });
      }
      toast.success('FAQ item updated successfully.');
    } else {
      addFAQItem(form.productId, form.categoryId, {
        question: form.question.trim(),
        answer: form.answer.trim(),
        status: form.status,
      });
      toast.success('FAQ item created successfully.');
    }
    setLocalOrderOverride(null);
    closeModal();
  }

  function handleDelete(flatItem: FlatItem) {
    setConfirmDelete(flatItem);
  }

  function confirmDeleteItem() {
    if (confirmDelete) {
      deleteFAQItem(confirmDelete.productId, confirmDelete.categoryId, confirmDelete.item.id);
      toast.success('FAQ item has been deleted.');
      setConfirmDelete(null);
      setLocalOrderOverride(null);
    }
  }

  function handleStatusChange(flatItem: FlatItem, newStatus: string) {
    updateFAQItem(flatItem.productId, flatItem.categoryId, flatItem.item.id, { status: newStatus });
    toast.success(`FAQ item status changed to ${newStatus}.`);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentItems = localOrderOverride ?? filteredItems;
    const oldIndex = currentItems.findIndex(fi => fi.item.id === active.id);
    const newIndex = currentItems.findIndex(fi => fi.item.id === over.id);
    const reordered = arrayMove(currentItems, oldIndex, newIndex);
    setLocalOrderOverride(reordered);

    const token = localStorage.getItem('accessToken');
    await fetch('/api/admin/reorder/faq_items', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: reordered.map(fi => fi.item.id) }),
    });
    await refreshProducts();
    setLocalOrderOverride(null);
  }

  const columns = [
    { key: 'drag', label: '', align: 'left' as const },
    { key: 'question', label: 'Question' },
    { key: 'answer', label: 'Answer' },
    { key: 'status', label: 'Status' },
    { key: 'product', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'actions', label: 'Actions', align: 'right' as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="FAQ Items"
        subtitle="Manage questions and answers."
        actionLabel="New FAQ Item"
        actionIcon={Plus}
        onAction={openAdd}
      />

      {/* Filter */}
      <div className="card-modern p-5">
        <div className="flex flex-wrap items-end gap-4">
          <AdminFormField label="Filter by product">
            <select
              value={filterProductId}
              onChange={(e) => { setFilterProductId(e.target.value); setLocalOrderOverride(null); }}
              className="input-modern"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField label="Filter by status">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setLocalOrderOverride(null); }}
              className="input-modern text-sm py-1.5 px-3 w-auto"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </AdminFormField>
        </div>
      </div>

      {/* Items table */}
      <div className="card-modern overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em] ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.key === 'drag' ? 'w-8 px-0' : ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center">
                      <FileQuestion className="w-7 h-7 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-normal">No FAQ items found.</p>
                    <button
                      onClick={openAdd}
                      className="btn-modern-primary text-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Create first FAQ item
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={displayItems.map(fi => fi.item.id)} strategy={verticalListSortingStrategy}>
                  {displayItems.map((flatItem) => (
                    <SortableRow key={flatItem.item.id} id={flatItem.item.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-800 font-medium line-clamp-2">
                          {flatItem.item.question}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-slate-500 font-normal line-clamp-2 max-w-xs">
                          {flatItem.item.answer}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={flatItem.item.status || 'published'} />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <AdminBadge variant="info">{flatItem.productName}</AdminBadge>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <AdminBadge variant="neutral">{flatItem.categoryTitle}</AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={flatItem.item.status || 'published'}
                            onChange={(e) => handleStatusChange(flatItem, e.target.value)}
                            className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-600 cursor-pointer hover:border-slate-300 transition-colors"
                            title="Change status"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button
                            onClick={() => openEdit(flatItem)}
                            className="p-2 text-slate-300 rounded-lg transition-colors"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = settings.primary_color;
                              e.currentTarget.style.backgroundColor = `${settings.primary_color}0D`;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '';
                              e.currentTarget.style.backgroundColor = '';
                            }}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(flatItem)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </SortableRow>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit FAQ Item' : 'New FAQ Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminFormField label="Product" required>
            <select
              value={form.productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="input-modern"
              required
            >
              {products.length === 0 && <option value="">No products</option>}
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField label="Category" required>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="input-modern"
              required
            >
              {formCategories.length === 0 && (
                <option value="">No categories available</option>
              )}
              {formCategories.map((cat) => (
                <option key={cat.categoryId} value={cat.categoryId}>
                  {'\u00A0\u00A0'.repeat(cat.depth)}{cat.depth > 0 ? '\u2514 ' : ''}{cat.categoryTitle}
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField label="Question" required>
            <input
              type="text"
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              className="input-modern"
              placeholder="e.g. How do I install the software?"
              autoFocus
              required
            />
          </AdminFormField>

          <AdminFormField label="Answer" required>
            <MarkdownEditor
              value={form.answer}
              onChange={(val) => setForm((f) => ({ ...f, answer: val }))}
              placeholder="Write your answer in Markdown..."
              minHeight="200px"
            />
          </AdminFormField>

          <AdminFormField label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="input-modern"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-modern-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-modern-primary">
              {editingItem ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
        title="Delete FAQ Item"
        message={`Are you sure you want to delete this question?\n\n"${confirmDelete?.item.question ?? ''}"`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
