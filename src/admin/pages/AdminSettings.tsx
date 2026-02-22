import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Check, Image, Key, Eye, EyeOff, Download, Upload, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const presetColors = [
  { label: 'Blue', value: '#2563eb' },
  { label: 'Indigo', value: '#4f46e5' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Rose', value: '#e11d48' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Slate', value: '#475569' },
];

const presetAccents = [
  { label: 'Orange', value: '#f97316' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'Lime', value: '#84cc16' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Fuchsia', value: '#d946ef' },
];

export default function AdminSettings() {
  const { fetchWithAuth } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const [form, setForm] = useState({
    company_name: '',
    tagline: '',
    primary_color: '#2563eb',
    accent_color: '#f97316',
    hero_title: '',
    search_placeholder: '',
    products_label: '',
    popular_label: '',
    no_results_text: '',
    footer_text: '',
    back_label: '',
    header_display: 'both' as 'both' | 'name' | 'logo',
  });
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'branding' | 'text' | 'ai' | 'data'>('branding');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  useEffect(() => {
    setForm({
      company_name: settings.company_name,
      tagline: settings.tagline,
      primary_color: settings.primary_color,
      accent_color: settings.accent_color,
      hero_title: settings.hero_title,
      search_placeholder: settings.search_placeholder,
      products_label: settings.products_label,
      popular_label: settings.popular_label,
      no_results_text: settings.no_results_text,
      footer_text: settings.footer_text,
      back_label: settings.back_label,
      header_display: settings.header_display,
    });
  }, [settings]);

  useEffect(() => {
    fetchWithAuth('/api/admin/settings').then(r => r.json()).then(data => {
      if (data.anthropic_api_key) setApiKey(data.anthropic_api_key);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveApiKey() {
    await fetchWithAuth('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anthropic_api_key: apiKey }),
    });
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      await fetchWithAuth('/api/admin/settings/logo', {
        method: 'POST',
        body: formData,
      });
      await refreshSettings();
    } finally {
      setUploading(false);
    }
  }

  async function handleExport(format: string) {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`/api/admin/data?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `askflow-export.${format === 'csv' ? 'csv' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data, mode: importMode }),
      });
      const result = await res.json();
      if (res.ok) {
        setImportResult({ ok: true });
        setImportFile(null);
        await refreshSettings();
      } else {
        setImportResult({ error: result.error || 'Import failed' });
      }
    } catch (err: any) {
      setImportResult({ error: err.message || 'Invalid JSON file' });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Settings</h2>

      {/* Tab bar */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-6">
          {([['branding', 'Branding'], ['text', 'Text & Labels'], ['ai', 'AI Configuration'], ['data', 'Data']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Branding tab */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))}
                  className="input-modern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))}
                  className="input-modern"
                />
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">Primary Color</label>
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-slate-200 shadow-sm shrink-0"
                    style={{ backgroundColor: form.primary_color }}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="color"
                      value={form.primary_color}
                      onChange={(e) => setForm(f => ({ ...f, primary_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primary_color}
                      onChange={(e) => setForm(f => ({ ...f, primary_color: e.target.value }))}
                      className="input-modern flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {presetColors.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, primary_color: preset.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                        form.primary_color === preset.value ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">Accent Color</label>
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-14 h-14 rounded-xl border-2 border-slate-200 shadow-sm shrink-0"
                    style={{ backgroundColor: form.accent_color }}
                  />
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="color"
                      value={form.accent_color}
                      onChange={(e) => setForm(f => ({ ...f, accent_color: e.target.value }))}
                      className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.accent_color}
                      onChange={(e) => setForm(f => ({ ...f, accent_color: e.target.value }))}
                      className="input-modern flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {presetAccents.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, accent_color: preset.value }))}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
                        form.accent_color === preset.value ? 'border-slate-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-3">Logo</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={() => setLogoHovered(true)}
                  onMouseLeave={() => setLogoHovered(false)}
                  className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
                  style={{
                    borderColor: logoHovered ? settings.primary_color + '60' : '#e2e8f0',
                  }}
                >
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="max-h-16 mx-auto mb-3" />
                  ) : (
                    <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-slate-50 flex items-center justify-center">
                      <Image className="w-7 h-7 text-slate-300" />
                    </div>
                  )}
                  <p className="text-sm text-slate-500">
                    {uploading ? 'Uploading...' : 'Click to upload a logo (PNG, JPG, SVG, WebP)'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Recommended: Square, at least 200x200px</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>

              {/* Custom CSS */}
              <div className="card-modern p-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Custom CSS</h3>
                <textarea
                  value={form.custom_css || ''}
                  onChange={(e) => setForm((f: any) => ({ ...f, custom_css: e.target.value }))}
                  className="input-modern font-mono text-xs min-h-[120px] resize-y w-full"
                  placeholder=".my-class { color: red; }"
                />
                <p className="text-xs text-slate-400 mt-2">Add custom CSS that will be injected into your FAQ page</p>
              </div>

              {/* Save button */}
              <motion.button
                type="submit"
                disabled={saving}
                className="btn-modern-primary flex items-center gap-2 relative overflow-hidden"
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence mode="wait">
                  {saved ? (
                    <motion.span
                      key="saved"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Saved!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="save"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Settings'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Live Preview</h3>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {/* Browser chrome */}
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-3 h-5 rounded bg-white border border-slate-200" />
                </div>

                {/* Preview content */}
                <div
                  className="p-6 text-center transition-colors duration-500"
                  style={{ background: `linear-gradient(135deg, ${form.primary_color}, ${form.primary_color}cc)` }}
                >
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="h-8 mx-auto mb-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-white/20 mx-auto mb-3" />
                  )}
                  <h4 className="text-white font-semibold text-lg">{form.company_name || 'Company Name'}</h4>
                  <p className="text-white/70 text-sm mt-1">{form.tagline || 'Your tagline here'}</p>
                </div>
                <div className="p-4 bg-white space-y-2">
                  <div
                    className="h-3 rounded-full w-3/4 transition-colors duration-500"
                    style={{ backgroundColor: form.primary_color + '20' }}
                  />
                  <div
                    className="h-3 rounded-full w-1/2 transition-colors duration-500"
                    style={{ backgroundColor: form.accent_color + '30' }}
                  />
                  <div className="mt-3 flex gap-2">
                    <div
                      className="h-8 rounded-md flex-1 transition-colors duration-500"
                      style={{ backgroundColor: form.primary_color }}
                    />
                    <div
                      className="h-8 rounded-md flex-1 transition-colors duration-500"
                      style={{ backgroundColor: form.accent_color }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Text & Labels tab */}
      {activeTab === 'text' && (
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-3">Header Display</label>
            <div className="flex gap-3">
              {([['both', 'Logo + Name'], ['name', 'Name Only'], ['logo', 'Logo Only']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, header_display: val }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    form.header_display === val
                      ? 'border-current bg-white shadow-sm'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                  style={form.header_display === val ? { borderColor: settings.primary_color, color: settings.primary_color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Hero Title</label>
            <input
              type="text"
              value={form.hero_title}
              onChange={(e) => setForm(f => ({ ...f, hero_title: e.target.value }))}
              className="input-modern"
              placeholder="How can we help?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Search Placeholder</label>
            <input
              type="text"
              value={form.search_placeholder}
              onChange={(e) => setForm(f => ({ ...f, search_placeholder: e.target.value }))}
              className="input-modern"
              placeholder="Search..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Products Label</label>
              <input
                type="text"
                value={form.products_label}
                onChange={(e) => setForm(f => ({ ...f, products_label: e.target.value }))}
                className="input-modern"
                placeholder="Products"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Popular Label</label>
              <input
                type="text"
                value={form.popular_label}
                onChange={(e) => setForm(f => ({ ...f, popular_label: e.target.value }))}
                className="input-modern"
                placeholder="Popular Questions"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">No Results Text</label>
              <input
                type="text"
                value={form.no_results_text}
                onChange={(e) => setForm(f => ({ ...f, no_results_text: e.target.value }))}
                className="input-modern"
                placeholder="No results found"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Back Label</label>
              <input
                type="text"
                value={form.back_label}
                onChange={(e) => setForm(f => ({ ...f, back_label: e.target.value }))}
                className="input-modern"
                placeholder="Back"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Footer Text</label>
            <input
              type="text"
              value={form.footer_text}
              onChange={(e) => setForm(f => ({ ...f, footer_text: e.target.value }))}
              className="input-modern"
              placeholder="© 2024 Company Name"
            />
          </div>

          {/* Save button */}
          <motion.button
            type="submit"
            disabled={saving}
            className="btn-modern-primary flex items-center gap-2 relative overflow-hidden"
            whileTap={{ scale: 0.97 }}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Saved!
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      )}

      {/* AI Configuration tab */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Anthropic API Key</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-modern font-mono text-sm !pr-10"
                  placeholder="sk-ant-..."
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="btn-modern-primary flex items-center gap-2"
              >
                {apiKeySaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Key</>}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Required for AI template generation. Get your key from console.anthropic.com</p>
          </div>
        </div>
      )}

      {/* Data tab */}
      {activeTab === 'data' && (
        <div className="space-y-8">
          {/* Export section */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Download className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Export Data</h3>
                <p className="text-xs text-slate-500">Download all products, categories, FAQ items and settings</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleExport('json')}
                className="btn-modern-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                className="px-4 py-2 rounded-lg text-sm font-medium border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Import section */}
          <div className="card-modern p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Upload className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Import Data</h3>
                <p className="text-xs text-slate-500">Upload a JSON file to import products, categories and FAQ items</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportResult(null);
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer"
                />
              </div>

              {/* Mode toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Import Mode</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      importMode === 'merge'
                        ? 'border-indigo-500 text-indigo-600 bg-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                      importMode === 'replace'
                        ? 'border-red-400 text-red-600 bg-white shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Replace All
                  </button>
                </div>
                {importMode === 'replace' && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Replace mode will delete all existing products, categories and FAQ items before importing.</span>
                  </div>
                )}
              </div>

              {/* Import button */}
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || importing}
                className="btn-modern-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {importing ? 'Importing...' : 'Import'}
              </button>

              {/* Result message */}
              {importResult && (
                <div className={`rounded-lg p-3 text-sm ${
                  importResult.ok
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {importResult.ok ? 'Import completed successfully!' : `Error: ${importResult.error}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
