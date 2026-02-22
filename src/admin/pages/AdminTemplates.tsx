import { useState, useEffect, Suspense } from 'react';
import { Check, Sparkles, Trash2, Eye, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import registry, { templateList } from '../../templates';
import FontLoader from '../../templates/FontLoader';
import type { GeneratedTemplate } from '../../types';

export default function AdminTemplates() {
  const { fetchWithAuth } = useAuth();
  const { settings, refreshSettings } = useSettings();
  const { products } = useData();
  const [saving, setSaving] = useState<string | null>(null);
  const [generatedTemplates, setGeneratedTemplates] = useState<GeneratedTemplate[]>([]);
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const currentTemplate = settings.template || 'stripe-minimal';

  useEffect(() => {
    fetchWithAuth('/api/admin/generated-templates')
      .then((r) => r.json())
      .then((data) => setGeneratedTemplates(data))
      .catch(() => {});
  }, []);

  async function handleSelect(slug: string) {
    if (slug === currentTemplate || saving) return;
    setSaving(slug);
    try {
      await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: slug }),
      });
      await refreshSettings();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight" style={{ color: settings.primary_color }}>
          Templates
        </h2>
        <p className="text-slate-500 mt-1">Choose a visual theme for your public FAQ page.</p>
      </div>

      {/* Built-in Templates */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Built-in Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templateList.map((entry) => {
            const isSelected = entry.slug === currentTemplate;
            const isSaving = saving === entry.slug;

            return (
              <button
                key={entry.slug}
                type="button"
                onClick={() => handleSelect(entry.slug)}
                disabled={!!saving}
                className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                } ${saving && !isSaving ? 'opacity-60' : ''}`}
              >
                {/* Screenshot thumbnail */}
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <img
                    src={entry.screenshotPath}
                    alt={entry.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Preview button */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setPreviewSlug(entry.slug); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setPreviewSlug(entry.slug); } }}
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/70 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-black/90"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {isSaving && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{entry.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Font label */}
                    <span className="text-[11px] text-slate-400 font-medium">{entry.font}</span>

                    {/* Color swatches */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: entry.defaultColors.bg }}
                        title="Background"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: entry.defaultColors.text }}
                        title="Text"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: entry.defaultColors.accent }}
                        title="Accent"
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Generated Templates */}
      {generatedTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Generated Templates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {generatedTemplates.map((gt) => {
              const isSelected = gt.slug === currentTemplate;
              const isSaving = saving === gt.slug;
              const colors = gt.default_colors ? JSON.parse(gt.default_colors) : {};

              return (
                <button
                  key={gt.id}
                  type="button"
                  onClick={() => handleSelect(gt.slug)}
                  disabled={!!saving}
                  className={`group relative text-left rounded-xl border-2 overflow-hidden transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${saving && !isSaving ? 'opacity-60' : ''}`}
                >
                  {/* Generated template color preview */}
                  <div
                    className="relative aspect-[16/10] overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: colors.bg || '#f0f0f0' }}
                  >
                    <div className="text-center p-4">
                      <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: colors.accent || '#8B5CF6' }} />
                      <span className="text-sm font-semibold" style={{ color: colors.text || '#333' }}>
                        {gt.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {isSaving && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{gt.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{gt.description || 'AI-generated template'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">{gt.font}</span>
                      <div className="flex items-center gap-1.5">
                        {colors.bg && (
                          <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: colors.bg }} title="Background" />
                        )}
                        {colors.text && (
                          <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: colors.text }} title="Text" />
                        )}
                        {colors.accent && (
                          <span className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: colors.accent }} title="Accent" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-screen template preview overlay */}
      {previewSlug && (() => {
        const entry = registry[previewSlug];
        if (!entry) return null;
        const PreviewComponent = entry.component;
        return (
          <div className="fixed inset-0 z-50 bg-white" style={{ isolation: 'isolate' }}>
            <FontLoader fontUrl={entry.fontUrl} />
            {/* Floating toolbar */}
            <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between px-4 py-2 bg-slate-900/90 backdrop-blur-sm text-white">
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">{entry.name}</span>
                <span className="text-xs text-slate-400">Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { handleSelect(previewSlug); setPreviewSlug(null); }}
                  className="px-3 py-1 text-xs font-medium bg-blue-500 hover:bg-blue-600 rounded-md transition-colors"
                >
                  Use this template
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSlug(null)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Template render area */}
            <div className="pt-10 h-full overflow-auto">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-[80vh]">
                    <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                }
              >
                <PreviewComponent products={products} settings={settings} />
              </Suspense>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
