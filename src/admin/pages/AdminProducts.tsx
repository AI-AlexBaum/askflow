import React, { useState, useMemo } from 'react';
import { Package, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import type { Product, FAQCategory } from '../../types';
import {
  AdminModal,
  AdminPageHeader,
  AdminFormField,
  AdminConfirmDialog,
  AdminBadge,
  toast,
} from '../components';

function countCategories(categories: FAQCategory[]): number {
  let count = 0;
  for (const cat of categories) {
    count += 1;
    if (cat.subcategories) {
      count += countCategories(cat.subcategories);
    }
  }
  return count;
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

interface ProductFormData {
  name: string;
  description: string;
  status: string;
}

const emptyForm: ProductFormData = { name: '', description: '', status: 'published' };

export default function AdminProducts() {
  const { products, setProducts, addProduct, updateProduct, deleteProduct } = useData();
  const { settings } = useSettings();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filteredProducts = useMemo(() => {
    if (!statusFilter) return products;
    return products.filter((p) => (p.status || 'published') === statusFilter);
  }, [products, statusFilter]);

  function openAdd() {
    setEditingProduct(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setForm({ name: product.name, description: product.description, status: product.status || 'published' });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      });
      toast.success('Product updated successfully.');
    } else {
      addProduct({
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        categories: [],
      });
      toast.success('Product created successfully.');
    }
    closeModal();
  }

  function handleStatusChange(product: Product, newStatus: string) {
    updateProduct(product.id, { status: newStatus });
    toast.success(`Product status changed to ${newStatus}.`);
  }

  function handleDelete(product: Product) {
    setConfirmDelete(product);
  }

  function confirmDeleteProduct() {
    if (confirmDelete) {
      deleteProduct(confirmDelete.id);
      toast.success(`"${confirmDelete.name}" has been deleted.`);
      setConfirmDelete(null);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex(p => p.id === active.id);
    const newIndex = products.findIndex(p => p.id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered);

    const token = localStorage.getItem('accessToken');
    await fetch('/api/admin/reorder/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ids: reordered.map(p => p.id) }),
    });
  }

  const columns = [
    { key: 'drag', label: '', align: 'left' as const },
    { key: 'name', label: 'Product' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'categories', label: 'Categories' },
    { key: 'actions', label: 'Actions', align: 'right' as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Products"
        subtitle="Manage your products and their FAQ structure."
        actionLabel="New Product"
        actionIcon={Plus}
        onAction={openAdd}
      />

      {/* Status filter */}
      <div className="card-modern p-5">
        <div className="flex items-center gap-3">
          <AdminFormField label="Filter by status">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Package className="w-7 h-7 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-normal">
                      {statusFilter ? `No ${statusFilter} products found.` : 'No products yet.'}
                    </p>
                    {!statusFilter && (
                      <button onClick={openAdd} className="btn-modern-primary text-sm flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create your first product
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {filteredProducts.map((product) => (
                    <SortableRow key={product.id} id={product.id}>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-medium">{product.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500 font-normal truncate max-w-xs">{product.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={product.status || 'published'} />
                      </td>
                      <td className="px-6 py-4">
                        <AdminBadge variant="info">
                          {countCategories(product.categories)} {countCategories(product.categories) === 1 ? 'category' : 'categories'}
                        </AdminBadge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={product.status || 'published'}
                            onChange={(e) => handleStatusChange(product, e.target.value)}
                            className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-600 cursor-pointer hover:border-slate-300 transition-colors"
                            title="Change status"
                          >
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-slate-300 rounded-lg transition-colors"
                            style={{ ['--hover-color' as string]: settings.primary_color }}
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
                            onClick={() => handleDelete(product)}
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
        title={editingProduct ? 'Edit Product' : 'New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminFormField label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-modern"
              placeholder="e.g. My Product"
              autoFocus
              required
            />
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input-modern min-h-[120px] resize-y"
              placeholder="Describe the product..."
              rows={4}
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
              {editingProduct ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? All associated categories and FAQ items will also be deleted.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
