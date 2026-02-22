import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, Heading2, Link, Code, List } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = '200px' }: MarkdownEditorProps) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertMarkdown(before: string, after: string = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newValue = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Heading2, action: () => insertMarkdown('## '), title: 'Heading' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), title: 'Link' },
    { icon: Code, action: () => insertMarkdown('`', '`'), title: 'Code' },
    { icon: List, action: () => insertMarkdown('- '), title: 'List' },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50/50 border-b border-slate-100">
        <button type="button" onClick={() => setTab('write')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === 'write' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Write
        </button>
        <button type="button" onClick={() => setTab('preview')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tab === 'preview' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          Preview
        </button>
        {tab === 'write' && (
          <>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            {toolbarButtons.map((btn) => (
              <button key={btn.title} type="button" onClick={btn.action} title={btn.title}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                <btn.icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </>
        )}
      </div>
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm font-normal bg-white/60 outline-none resize-y"
          style={{ minHeight }}
        />
      ) : (
        <div className="px-4 py-3 prose prose-sm prose-slate max-w-none" style={{ minHeight }}>
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-slate-400 italic">Nothing to preview</p>
          )}
        </div>
      )}
    </div>
  );
}
