import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminPageHeader, toast } from '../components';

export default function AdminProfile() {
  const { user, fetchWithAuth, updateProfile } = useAuth();

  // Profile form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setOriginalEmail(user.email || '');
    }
  }, [user]);

  const emailChanged = email !== originalEmail;

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const body: Record<string, string> = { name, email };
      if (emailChanged) {
        body.currentPassword = profilePassword;
      }
      const res = await fetchWithAuth('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to update profile');
        return;
      }
      updateProfile(data.user.name, data.user.email);
      setOriginalEmail(data.user.email);
      setProfilePassword('');
      toast.success('Profile updated.');
    } catch {
      setProfileError('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      setPasswordSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await fetchWithAuth('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed.');
    } catch {
      setPasswordError('Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Profile" subtitle="Manage your account settings." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Card */}
        <div className="card-modern p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Profile Info</h3>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-modern w-full"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern w-full"
                required
              />
            </div>

            {emailChanged && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  Current Password <span className="text-slate-400">(required to change email)</span>
                </label>
                <input
                  type="password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="input-modern w-full"
                  required
                />
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {profileError}
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="btn-modern-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card-modern p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-modern w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-modern w-full"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-modern w-full"
                required
                minLength={6}
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="btn-modern-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {passwordSaving ? 'Saving...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
