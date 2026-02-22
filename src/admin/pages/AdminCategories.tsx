import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  FolderTree,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useSettings } from '../../context/SettingsContext';
import type { FAQCategory } from '../../types';
import {
  AdminModal,
  AdminPageHeader,
  AdminFormField,
  AdminEmptyState,
  AdminConfirmDialog,
  toast,
} from '../components';
import IconPicker from '../components/IconPicker';

interface CategoryFormData {
  title: string;
  description: string;
  icon: string;
}

const emptyForm: CategoryFormData = { title: '', description: '', icon: '' };

interface CategoryNodeProps {
  category: FAQCategory;
  productId: string;
  depth: number;
  onEdit: (cat: FAQCategory) => void;
  onAddSub: (parentId: string) => void;
  onDelete: (cat: FAQCategory) => void;
  primaryColor: string;
  accentColor: string;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({
  category,
  productId,
  depth,
  onEdit,
  onAddSub,
  onDelete,
  primaryColor,
  accentColor,
}) => {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasSubs = category.subcategories && category.subcategories.length > 0;
  const itemCount = category.items?.length ?? 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2.5 px-3 rounded-[8px] hover:bg-slate-50/80 transition-colors group"
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-0.5 rounded transition-colors ${
            hasSubs ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100' : 'text-transparent pointer-events-none'
          }`}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {expanded && hasSubs ? (
          <FolderOpen className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
        ) : (
          <Folder className="w-5 h-5 shrink-0" style={{ color: primaryColor }} />
        )}

        <div className="flex-1 min-w-0">
          <span className="text-sm text-slate-800 font-medium">{category.title}</span>
          {category.description && (
            <span className="text-xs text-slate-500 font-normal ml-2 hidden sm:inline">
              — {category.description}
            </span>
          )}
          {itemCount > 0 && (
            <span className="ml-2 text-[10px] text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddSub(category.id)}
            className="p-1.5 text-slate-300 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = primaryColor;
              e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.backgroundColor = '';
            }}
            title="Add subcategory"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 text-slate-300 rounded-lg transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = primaryColor;
              e.currentTarget.style.backgroundColor = `${primaryColor}0D`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.backgroundColor = '';
            }}
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && hasSubs && (
        <div>
          {category.subcategories!.map((sub) => (
            <CategoryNode
              key={sub.id}
              category={sub}
              productId={productId}
              depth={depth + 1}
              onEdit={onEdit}
              onAddSub={onAddSub}
              onDelete={onDelete}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminCategories() {
  const { products, addCategory, updateCategory, deleteCategory } = useData();
  const { settings } = useSettings();
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products.length > 0 ? products[0].id : ''
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<FAQCategory | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  function openAddRoot() {
    setEditingCategory(null);
    setParentCategoryId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openAddSub(parentId: string) {
    setEditingCategory(null);
    setParentCategoryId(parentId);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(category: FAQCategory) {
    setEditingCategory(category);
    setParentCategoryId(null);
    setForm({
      title: category.title,
      description: category.description || '',
      icon: category.icon || '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
    setParentCategoryId(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !selectedProductId) return;

    const categoryData: Omit<FAQCategory, 'id'> = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
      subcategories: [],
      items: [],
    };

    if (editingCategory) {
      updateCategory(selectedProductId, editingCategory.id, {
        title: categoryData.title,
        description: categoryData.description,
        icon: categoryData.icon,
      });
      toast.success('Category updated successfully.');
    } else {
      addCategory(selectedProductId, parentCategoryId, categoryData);
      toast.success('Category created successfully.');
    }
    closeModal();
  }

  function handleDelete(category: FAQCategory) {
    if (!selectedProductId) return;
    setConfirmDelete(category);
  }

  function confirmDeleteCategory() {
    if (confirmDelete && selectedProductId) {
      deleteCategory(selectedProductId, confirmDelete.id);
      toast.success(`"${confirmDelete.title}" has been deleted.`);
      setConfirmDelete(null);
    }
  }

  const subCount = confirmDelete?.subcategories?.length ?? 0;
  const deleteMessage = subCount > 0
    ? `Are you sure you want to delete "${confirmDelete?.title}" and all ${subCount} subcategories?`
    : `Are you sure you want to delete "${confirmDelete?.title}"?`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        subtitle="Manage the category structure per product."
        actionLabel="New Category"
        actionIcon={Plus}
        onAction={selectedProductId ? openAddRoot : undefined}
      />

      {/* Product selector */}
      <div className="card-modern p-5">
        <AdminFormField label="Select product">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="input-modern"
          >
            {products.length === 0 && <option value="">No products available</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </AdminFormField>
      </div>

      {/* Category tree */}
      <div className="card-modern p-4">
        {!selectedProduct || selectedProduct.categories.length === 0 ? (
          <AdminEmptyState
            icon={<FolderTree className="w-7 h-7 text-slate-200" />}
            message={
              !selectedProduct
                ? 'Please select a product first.'
                : 'No categories for this product yet.'
            }
            actionLabel={selectedProduct ? 'Create first category' : undefined}
            onAction={selectedProduct ? openAddRoot : undefined}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {selectedProduct.categories.map((cat) => (
              <CategoryNode
                key={cat.id}
                category={cat}
                productId={selectedProductId}
                depth={0}
                onEdit={openEdit}
                onAddSub={openAddSub}
                onDelete={handleDelete}
                primaryColor={settings.primary_color}
                accentColor={settings.accent_color}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AdminModal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          editingCategory
            ? 'Edit Category'
            : parentCategoryId
              ? 'New Subcategory'
              : 'New Category'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <AdminFormField label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="input-modern"
              placeholder="e.g. Installation"
              autoFocus
              required
            />
          </AdminFormField>

          <AdminFormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="input-modern min-h-[100px] resize-y"
              placeholder="Optional description..."
              rows={3}
            />
          </AdminFormField>

          <AdminFormField label="Icon">
            <IconPicker
              value={form.icon}
              onChange={(name) => setForm((f) => ({ ...f, icon: name }))}
            />
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-modern-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-modern-primary">
              {editingCategory ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Category"
        message={deleteMessage}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
