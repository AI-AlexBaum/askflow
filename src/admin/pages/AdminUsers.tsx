import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Trash2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  AdminModal,
  AdminTable,
  AdminPageHeader,
  AdminFormField,
  AdminConfirmDialog,
  AdminBadge,
  toast,
} from '../components';

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

interface InviteFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const emptyInviteForm: InviteFormData = { name: '', email: '', password: '', role: 'admin' };

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminUsers() {
  const { fetchWithAuth, user: currentUser } = useAuth();
  const { settings } = useSettings();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>(emptyInviteForm);
  const [inviteError, setInviteError] = useState('');

  // Reset password modal
  const [resetUser, setResetUser] = useState<UserRecord | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<UserRecord | null>(null);

  async function loadUsers() {
    const res = await fetchWithAuth('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []); // eslint-disable-line

  // --- Invite user ---
  function openInvite() {
    setInviteForm(emptyInviteForm);
    setInviteError('');
    setInviteModalOpen(true);
  }

  function closeInvite() {
    setInviteModalOpen(false);
    setInviteForm(emptyInviteForm);
    setInviteError('');
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviteError('');
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.password) {
      setInviteError('All fields are required.');
      return;
    }
    if (inviteForm.password.length < 6) {
      setInviteError('Password must be at least 6 characters.');
      return;
    }
    const res = await fetchWithAuth('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        password: inviteForm.password,
        role: inviteForm.role,
      }),
    });
    if (res.ok) {
      toast.success('User created successfully.');
      closeInvite();
      loadUsers();
    } else {
      const data = await res.json();
      setInviteError(data.error || 'Failed to create user.');
    }
  }

  // --- Reset password ---
  function openResetPassword(u: UserRecord) {
    setResetUser(u);
    setResetPassword('');
    setResetError('');
  }

  function closeResetPassword() {
    setResetUser(null);
    setResetPassword('');
    setResetError('');
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    setResetError('');
    if (!resetPassword || resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    const res = await fetchWithAuth(`/api/admin/users/${resetUser.id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetPassword }),
    });
    if (res.ok) {
      toast.success(`Password reset for ${resetUser.name}.`);
      closeResetPassword();
    } else {
      const data = await res.json();
      setResetError(data.error || 'Failed to reset password.');
    }
  }

  // --- Delete user ---
  async function confirmDeleteUser() {
    if (!confirmDelete) return;
    const res = await fetchWithAuth(`/api/admin/users/${confirmDelete.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      toast.success(`"${confirmDelete.name}" has been deleted.`);
      setConfirmDelete(null);
      loadUsers();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Failed to delete user.');
      setConfirmDelete(null);
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'created', label: 'Created' },
    { key: 'actions', label: 'Actions', align: 'right' as const },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        subtitle="Manage admin users and their access."
        actionLabel="Invite User"
        actionIcon={Plus}
        onAction={openInvite}
      />

      {loading ? (
        <div className="card-modern">
          <div className="p-12 text-center text-slate-400">Loading...</div>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={users}
          emptyMessage="No users yet."
          emptyIcon={<UsersIcon className="w-7 h-7 text-slate-200" />}
          renderRow={(u: UserRecord) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <tr
                key={u.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="text-slate-800 font-medium">{u.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-500">{u.email}</div>
                </td>
                <td className="px-6 py-4">
                  <AdminBadge variant={u.role === 'admin' ? 'info' : 'neutral'}>
                    {u.role}
                  </AdminBadge>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openResetPassword(u)}
                      className="p-2 text-slate-300 rounded-lg transition-colors"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = settings.primary_color;
                        e.currentTarget.style.backgroundColor = `${settings.primary_color}0D`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '';
                        e.currentTarget.style.backgroundColor = '';
                      }}
                      title="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u)}
                      disabled={isSelf}
                      className={`p-2 rounded-lg transition-colors ${
                        isSelf
                          ? 'text-slate-200 cursor-not-allowed'
                          : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      }`}
                      title={isSelf ? 'Cannot delete your own account' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      )}

      {/* Invite User Modal */}
      <AdminModal
        isOpen={inviteModalOpen}
        onClose={closeInvite}
        title="Invite User"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-5">
          {inviteError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {inviteError}
            </div>
          )}

          <AdminFormField label="Name" required>
            <input
              type="text"
              value={inviteForm.name}
              onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
              className="input-modern"
              placeholder="e.g. Jane Smith"
              autoFocus
              required
            />
          </AdminFormField>

          <AdminFormField label="Email" required>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              className="input-modern"
              placeholder="e.g. jane@example.com"
              required
            />
          </AdminFormField>

          <AdminFormField label="Password" required>
            <input
              type="password"
              value={inviteForm.password}
              onChange={(e) => setInviteForm((f) => ({ ...f, password: e.target.value }))}
              className="input-modern"
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </AdminFormField>

          <AdminFormField label="Role">
            <select
              value={inviteForm.role}
              onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
              className="input-modern"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeInvite} className="btn-modern-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-modern-primary">
              Create User
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Reset Password Modal */}
      <AdminModal
        isOpen={!!resetUser}
        onClose={closeResetPassword}
        title={`Reset Password for ${resetUser?.name ?? ''}`}
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-5">
          {resetError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">
              {resetError}
            </div>
          )}

          <AdminFormField label="New Password" required>
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="input-modern"
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoFocus
            />
          </AdminFormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeResetPassword} className="btn-modern-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-modern-primary">
              Reset Password
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Delete Confirmation */}
      <AdminConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${confirmDelete?.name ?? ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
