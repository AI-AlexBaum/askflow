import { useState, useRef, useEffect, useMemo } from 'react';
import { icons, Search, X } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

const iconNames = Object.keys(icons);

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return iconNames.slice(0, 60);
    const q = search.toLowerCase();
    return iconNames.filter((n) => n.toLowerCase().includes(q)).slice(0, 60);
  }, [search]);

  const SelectedIcon = value ? icons[toPascalCase(value) as keyof typeof icons] : null;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-modern flex items-center gap-2 text-left cursor-pointer"
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="w-4 h-4 text-slate-600" />
            <span className="text-sm text-slate-700">{value}</span>
          </>
        ) : (
          <span className="text-sm text-slate-400">Choose an icon...</span>
        )}
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            className="ml-auto text-slate-300 hover:text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-80 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
          </div>
          <div className="grid grid-cols-6 gap-1 p-2 max-h-60 overflow-y-auto">
            {filtered.map((name) => {
              const Icon = icons[name as keyof typeof icons];
              if (!Icon) return null;
              const kebabName = name.replace(/([A-Z])/g, (m, c, i) => (i ? '-' : '') + c.toLowerCase());
              const isSelected = value === kebabName;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(kebabName); setOpen(false); setSearch(''); }}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-300'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                  title={kebabName}
                >
                  <Icon className="w-4.5 h-4.5" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-6 py-6 text-center text-sm text-slate-400">No icons found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
