import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, Info, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import type { ApiKey } from '../../types';
import {
  AdminModal,
  AdminTable,
  AdminPageHeader,
  AdminFormField,
  AdminConfirmDialog,
  AdminBadge,
  toast,
} from '../components';

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return new Date(dateStr).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default function AdminApiKeys() {
  const { fetchWithAuth } = useAuth();
  const { settings } = useSettings();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ApiKey | null>(null);

  async function loadKeys() {
    const res = await fetchWithAuth('/api/admin/api-keys');
    if (res.ok) {
      const data = await res.json();
      setKeys(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadKeys(); }, []); // eslint-disable-line

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetchWithAuth('/api/admin/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      setName('');
      loadKeys();
      toast.success('API key created successfully.');
    } else {
      toast.error('Failed to create API key.');
    }
  }

  async function handleDelete(key: ApiKey) {
    setConfirmDelete(key);
  }

  async function confirmDeleteKey() {
    if (confirmDelete) {
      await fetchWithAuth(`/api/admin/api-keys/${confirmDelete.id}`, { method: 'DELETE' });
      toast.success('API key has been revoked.');
      loadKeys();
      setConfirmDelete(null);
    }
  }

  function handleCopy() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'key', label: 'Key' },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created' },
    { key: 'lastUsed', label: 'Last Used' },
    { key: 'actions', label: 'Actions', align: 'right' as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="API Keys"
        subtitle="Manage API keys for chatbot and external integrations."
        actionLabel="New API Key"
        actionIcon={Plus}
        onAction={() => { setModalOpen(true); setNewKey(null); }}
      />

      {/* Key created banner */}
      <AnimatePresence>
        {newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-modern p-5 border-l-4 border-green-500 relative overflow-hidden"
          >
            {/* Subtle green glow */}
            <div className="absolute inset-0 bg-green-50/50 pointer-events-none" />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ boxShadow: 'inset 0 0 40px rgba(34, 197, 94, 0.1)' }}
            />
            <div className="flex items-start gap-3 relative">
              <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-slate-800">API key created successfully</p>
                <p className="text-sm text-slate-500 mt-1">Copy this key now. It will not be shown again.</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 text-sm bg-slate-100 px-4 py-2.5 rounded-lg font-mono break-all">
                    {newKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-all shrink-0 flex items-center gap-1.5 text-sm"
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 text-green-600"
                        >
                          <Check className="w-4 h-4" />
                          Copied!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center gap-1.5 text-slate-500"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keys table */}
      {loading ? (
        <div className="card-modern">
          <div className="p-12 text-center text-slate-400">Loading...</div>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={keys}
          emptyMessage="No API keys yet"
          emptyIcon={
            <div className="relative">
              <Key className="w-8 h-8 text-slate-300" />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                <Shield className="w-3 h-3 text-slate-300" />
              </div>
            </div>
          }
          renderRow={(k: ApiKey) => (
            <tr key={k.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-slate-800">{k.name}</td>
              <td className="px-6 py-4">
                <code className="text-sm text-slate-600 bg-slate-50 px-2.5 py-1 rounded font-mono tracking-wide">{k.key_prefix}</code>
              </td>
              <td className="px-6 py-4">
                <AdminBadge variant={k.is_active ? 'success' : 'neutral'}>
                  {k.is_active ? 'Active' : 'Inactive'}
                </AdminBadge>
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                {relativeTime(k.created_at)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
                {k.last_used ? relativeTime(k.last_used) : 'Never'}
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => handleDelete(k)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Revoke"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          )}
        />
      )}

      {/* Create Modal */}
      <AdminModal
        isOpen={modalOpen && !newKey}
        onClose={() => setModalOpen(false)}
        title="Create API Key"
        size="sm"
      >
        {/* Info callout */}
        <div className="flex gap-3 p-3 mb-6 rounded-lg bg-blue-50 border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            API keys allow external services and chatbots to access your FAQ data programmatically.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-5">
          <AdminFormField label="Key Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-modern"
              placeholder="e.g., My Chatbot"
              required
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1.5">Give this key a descriptive name so you can identify it later.</p>
          </AdminFormField>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-modern-secondary">Cancel</button>
            <button type="submit" className="btn-modern-primary">Create Key</button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteKey}
        title="Revoke API Key"
        message={`Are you sure you want to revoke the API key "${confirmDelete?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Revoke"
        destructive
      />
    </div>
  );
}
