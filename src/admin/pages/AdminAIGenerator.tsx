import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Palette,
  Layout,
  Type,
  Wand2,
  Trash2,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Moon,
  Zap,
  Star,
  Crown,
  CircleDot,
  Briefcase,
  Disc,
  Rocket,
  LayoutGrid,
  PanelLeft,
  Columns2,
  SplitSquareHorizontal,
  ListCollapse,
  Clock,
  Copy,
  Loader2,
  Link2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import type { GeneratedTemplate } from '../../types';

// ── Mood definitions ──

interface MoodOption {
  id: string;
  name: string;
  description: string;
  icon: typeof Sparkles;
}

const moods: MoodOption[] = [
  { id: 'minimal', name: 'Minimal', description: 'Clean lines, ample whitespace', icon: CircleDot },
  { id: 'bold', name: 'Bold', description: 'Strong contrasts, impactful feel', icon: Zap },
  { id: 'playful', name: 'Playful', description: 'Fun colors, rounded shapes', icon: Star },
  { id: 'elegant', name: 'Elegant', description: 'Refined typography, subtle tones', icon: Crown },
  { id: 'dark', name: 'Dark', description: 'Dark backgrounds, glowing accents', icon: Moon },
  { id: 'professional', name: 'Professional', description: 'Corporate, trustworthy', icon: Briefcase },
  { id: 'retro', name: 'Retro', description: 'Vintage vibes, warm palette', icon: Disc },
  { id: 'futuristic', name: 'Futuristic', description: 'Neon gradients, tech-forward', icon: Rocket },
];

// ── Preset palettes ──

interface PresetPalette {
  name: string;
  bg: string;
  text: string;
  accent: string;
}

const presetPalettes: PresetPalette[] = [
  { name: 'Ocean', bg: '#f0f9ff', text: '#0c4a6e', accent: '#0ea5e9' },
  { name: 'Forest', bg: '#f0fdf4', text: '#14532d', accent: '#22c55e' },
  { name: 'Sunset', bg: '#fff7ed', text: '#7c2d12', accent: '#f97316' },
  { name: 'Midnight', bg: '#1e1b4b', text: '#e0e7ff', accent: '#818cf8' },
  { name: 'Rose', bg: '#fff1f2', text: '#881337', accent: '#f43f5e' },
];

// ── Layout options ──

interface LayoutOption {
  id: string;
  name: string;
  icon: typeof Layout;
}

const layouts: LayoutOption[] = [
  { id: 'accordion', name: 'Accordion', icon: ListCollapse },
  { id: 'grid', name: 'Grid', icon: LayoutGrid },
  { id: 'sidebar', name: 'Sidebar', icon: PanelLeft },
  { id: 'tabs', name: 'Tabs', icon: Columns2 },
  { id: 'split', name: 'Split', icon: SplitSquareHorizontal },
];

// ── Typography options ──

interface TypographyOption {
  id: string;
  name: string;
  fontFamily: string;
  sampleText: string;
}

const typographies: TypographyOption[] = [
  { id: 'sans-serif', name: 'Sans-serif', fontFamily: 'system-ui, -apple-system, sans-serif', sampleText: 'Clean & modern' },
  { id: 'serif', name: 'Serif', fontFamily: 'Georgia, "Times New Roman", serif', sampleText: 'Classic & refined' },
  { id: 'monospace', name: 'Monospace', fontFamily: '"Courier New", Consolas, monospace', sampleText: 'Technical & precise' },
  { id: 'display', name: 'Display', fontFamily: '"Fraunces", Georgia, serif', sampleText: 'Bold & expressive' },
  { id: 'rounded', name: 'Rounded', fontFamily: '"Nunito", "Varela Round", system-ui, sans-serif', sampleText: 'Soft & friendly' },
];

// ── Constants ──

const MAX_DESCRIPTION_LENGTH = 500;

// ── Component ──

export default function AdminAIGenerator() {
  const { fetchWithAuth } = useAuth();
  const { settings } = useSettings();

  // Form state
  const [selectedMood, setSelectedMood] = useState<string>('minimal');
  const [colors, setColors] = useState({ bg: '#ffffff', text: '#1e293b', accent: '#2563eb' });
  const [selectedLayout, setSelectedLayout] = useState<string>('accordion');
  const [selectedTypography, setSelectedTypography] = useState<string>('sans-serif');
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedTsx, setGeneratedTsx] = useState<string>('');
  const [generatedCss, setGeneratedCss] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [generateError, setGenerateError] = useState<string>('');

  // History state
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Refs
  const previewRef = useRef<HTMLIFrameElement>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // ── Fetch generated templates on mount ──

  useEffect(() => {
    fetchTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchTemplates() {
    setLoadingTemplates(true);
    try {
      const res = await fetchWithAuth('/api/admin/generated-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch {
      // Silently fail; templates will show as empty
    } finally {
      setLoadingTemplates(false);
    }
  }

  // ── Handlers ──

  function applyPalette(palette: PresetPalette) {
    setColors({ bg: palette.bg, text: palette.text, accent: palette.accent });
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError('');
    setGeneratedTsx('');
    setGeneratedCss('');
    setPreviewHtml('');

    try {
      const res = await fetchWithAuth('/api/admin/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          colors,
          layout: selectedLayout,
          typography: selectedTypography,
          freeText: description,
          referenceUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      setGeneratedTsx(data.tsx_code || '');
      setGeneratedCss(data.css_code || '');
      setPreviewHtml(data.preview_html || '');

      // Refresh template list
      await fetchTemplates();

      // Scroll to preview
      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setGenerating(false);
    }
  }

  async function handleActivate(template: GeneratedTemplate) {
    if (activating) return;
    setActivating(template.id);
    try {
      await fetchWithAuth('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: template.slug }),
      });
      await fetchTemplates();
    } finally {
      setActivating(null);
    }
  }

  async function handleDelete(templateId: string) {
    if (deleting) return;
    setDeleting(templateId);
    try {
      await fetchWithAuth(`/api/admin/generated-templates/${templateId}`, {
        method: 'DELETE',
      });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } finally {
      setDeleting(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // ── Render ──

  return (
    <div className="space-y-10 max-w-6xl">
      {/* ── Page Header ── */}
      <div>
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: settings.primary_color }}
        >
          AI Template Generator
        </h2>
        <p className="text-slate-500 mt-1">Create custom FAQ templates using AI</p>
      </div>

      {/* ── 1. Mood Selector ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Mood</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moods.map((mood) => {
            const isSelected = selectedMood === mood.id;
            const Icon = mood.icon;
            return (
              <motion.button
                key={mood.id}
                type="button"
                onClick={() => setSelectedMood(mood.id)}
                whileTap={{ scale: 0.97 }}
                className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'bg-white shadow-md'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
                style={
                  isSelected
                    ? { borderColor: settings.accent_color, boxShadow: `0 4px 20px ${settings.accent_color}20` }
                    : undefined
                }
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? 'text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  style={isSelected ? { backgroundColor: settings.accent_color } : undefined}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="text-sm font-semibold text-slate-800">{mood.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{mood.description}</div>
                {isSelected && (
                  <motion.div
                    layoutId="mood-check"
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: settings.accent_color }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── 2. Color Palette Builder ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Color Palette</h3>
        </div>

        <div className="card-modern p-6 space-y-6">
          {/* Three color inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { key: 'bg' as const, label: 'Background' },
              { key: 'text' as const, label: 'Text' },
              { key: 'accent' as const, label: 'Accent' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-slate-200 shrink-0 shadow-sm"
                    style={{ backgroundColor: colors[key] }}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={colors[key]}
                      onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={colors[key]}
                      onChange={(e) => setColors((c) => ({ ...c, [key]: e.target.value }))}
                      className="input-modern flex-1 font-mono text-sm !py-2.5 !px-3"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preset palettes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {presetPalettes.map((palette) => (
                <button
                  key={palette.name}
                  type="button"
                  onClick={() => applyPalette(palette)}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex -space-x-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: palette.bg }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: palette.text }}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: palette.accent }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-800">
                    {palette.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Layout Pattern Selector ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layout className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Layout Pattern</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {layouts.map((layout) => {
            const isSelected = selectedLayout === layout.id;
            const Icon = layout.icon;
            return (
              <motion.button
                key={layout.id}
                type="button"
                onClick={() => setSelectedLayout(layout.id)}
                whileTap={{ scale: 0.96 }}
                className={`flex flex-col items-center gap-2.5 px-6 py-4 rounded-xl border-2 transition-all duration-200 min-w-[110px] ${
                  isSelected
                    ? 'bg-white shadow-md'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
                style={
                  isSelected
                    ? { borderColor: settings.accent_color, boxShadow: `0 4px 20px ${settings.accent_color}20` }
                    : undefined
                }
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected ? 'text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                  style={isSelected ? { backgroundColor: settings.accent_color } : undefined}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                  {layout.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── 4. Typography Selector ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Typography</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {typographies.map((typo) => {
            const isSelected = selectedTypography === typo.id;
            return (
              <motion.button
                key={typo.id}
                type="button"
                onClick={() => setSelectedTypography(typo.id)}
                whileTap={{ scale: 0.96 }}
                className={`text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 min-w-[150px] ${
                  isSelected
                    ? 'bg-white shadow-md'
                    : 'bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
                style={
                  isSelected
                    ? { borderColor: settings.accent_color, boxShadow: `0 4px 20px ${settings.accent_color}20` }
                    : undefined
                }
              >
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                  {typo.name}
                </div>
                <div
                  className="text-lg text-slate-700 leading-snug"
                  style={{ fontFamily: typo.fontFamily }}
                >
                  {typo.sampleText}
                </div>
                {isSelected && (
                  <div
                    className="mt-2 h-0.5 rounded-full"
                    style={{ backgroundColor: settings.accent_color }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ── 5. Reference URL ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Reference URL</h3>
          <span className="text-xs text-slate-400">(optional)</span>
        </div>
        <div className="card-modern p-6">
          <input
            type="url"
            value={referenceUrl}
            onChange={(e) => setReferenceUrl(e.target.value)}
            placeholder="https://example.com/faq — we'll analyze the design for inspiration"
            className="input-modern"
          />
        </div>
      </section>

      {/* ── 6. Free Text Description ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Description</h3>
        </div>
        <div className="card-modern p-6">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
            placeholder="Describe your ideal template... e.g., 'A warm, cozy help center with organic shapes and earth tones'"
            rows={4}
            className="input-modern resize-none !py-4"
          />
          <div className="flex justify-end mt-2">
            <span className={`text-xs font-medium ${
              description.length >= MAX_DESCRIPTION_LENGTH ? 'text-red-500' : 'text-slate-400'
            }`}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </div>
      </section>

      {/* ── 7. Generate Button ── */}
      <section className="space-y-6" ref={previewSectionRef}>
        <motion.button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="btn-modern-primary flex items-center justify-center gap-3 w-full sm:w-auto text-base !px-10 !py-4"
          whileTap={{ scale: 0.97 }}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Template...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Template
            </>
          )}
        </motion.button>

        {/* Error display */}
        <AnimatePresence>
          {generateError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            >
              {generateError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Area */}
        <AnimatePresence>
          {(previewHtml || generatedTsx) && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Preview iframe */}
              {previewHtml && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                      Preview
                    </h4>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    {/* Browser chrome */}
                    <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 mx-3 h-5 rounded bg-white border border-slate-200 px-3 flex items-center">
                        <span className="text-[10px] text-slate-400">preview</span>
                      </div>
                    </div>
                    <iframe
                      ref={previewRef}
                      srcDoc={previewHtml}
                      className="w-full bg-white"
                      style={{ height: '480px', border: 'none' }}
                      title="Template Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                </div>
              )}

              {/* Collapsible code display */}
              {(generatedTsx || generatedCss) && (
                <div className="card-modern overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowCode(!showCode)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Copy className="w-4 h-4 text-slate-400" />
                      Generated Code
                    </span>
                    {showCode ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 divide-y divide-slate-100">
                          {/* TSX Code */}
                          {generatedTsx && (
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                  TSX
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(generatedTsx)}
                                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
                                <code>{generatedTsx}</code>
                              </pre>
                            </div>
                          )}

                          {/* CSS Code */}
                          {generatedCss && (
                            <div className="p-6">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                  CSS
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(generatedCss)}
                                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              </div>
                              <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
                                <code>{generatedCss}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── 8. History Section ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800">Generated Templates</h3>
        </div>

        {loadingTemplates ? (
          <div className="card-modern p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="card-modern py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-slate-500 font-normal text-center max-w-sm">
              No templates generated yet. Configure your preferences above and hit Generate to create your first one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => {
              const isActivating = activating === template.id;
              const isDeleting = deleting === template.id;
              const colors = (() => {
                try {
                  return JSON.parse(template.default_colors);
                } catch {
                  return { bg: '#fff', text: '#000', accent: '#2563eb' };
                }
              })();

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`card-modern overflow-hidden group ${isDeleting ? 'opacity-50' : ''}`}
                >
                  {/* Preview thumbnail */}
                  <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                    {template.screenshot_url ? (
                      <img
                        src={template.screenshot_url}
                        alt={template.name}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <div className="space-y-2 w-2/3">
                          <div
                            className="h-3 rounded-full w-3/4"
                            style={{ backgroundColor: colors.accent + '40' }}
                          />
                          <div
                            className="h-2 rounded-full w-1/2"
                            style={{ backgroundColor: colors.text + '20' }}
                          />
                          <div
                            className="h-2 rounded-full w-5/6"
                            style={{ backgroundColor: colors.text + '15' }}
                          />
                          <div
                            className="h-6 rounded w-1/3 mt-3"
                            style={{ backgroundColor: colors.accent }}
                          />
                        </div>
                      </div>
                    )}

                    {template.is_active && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 truncate">{template.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(template.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Color swatches */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: colors.bg }}
                        title="Background"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: colors.text }}
                        title="Text"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: colors.accent }}
                        title="Accent"
                      />
                      {template.font && (
                        <span className="text-[11px] text-slate-400 font-medium ml-auto">{template.font}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleActivate(template)}
                        disabled={template.is_active || !!activating}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          template.is_active
                            ? 'bg-green-50 text-green-700 cursor-default'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isActivating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : template.is_active ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Use
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(template.id)}
                        disabled={!!deleting}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all duration-200"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
