import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface FeedbackButtonsProps {
  itemId: string;
  className?: string;
}

export default function FeedbackButtons({ itemId, className = '' }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<boolean | null>(() => {
    try {
      const stored = localStorage.getItem(`feedback_${itemId}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  async function submit(helpful: boolean) {
    if (submitted !== null || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqItemId: itemId, helpful }),
      });
      if (res.ok || res.status === 409) {
        setSubmitted(helpful);
        localStorage.setItem(`feedback_${itemId}`, JSON.stringify(helpful));
      }
    } catch {}
    setLoading(false);
  }

  if (submitted !== null) {
    return (
      <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888', marginTop: '8px' }}>
        <span>{submitted ? '\uD83D\uDC4D' : '\uD83D\uDC4E'}</span>
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888', marginTop: '8px' }}>
      <span>Was this helpful?</span>
      <button onClick={() => submit(true)} disabled={loading}
        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666', transition: 'all 0.15s' }}>
        <ThumbsUp size={12} /> Yes
      </button>
      <button onClick={() => submit(false)} disabled={loading}
        style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#666', transition: 'all 0.15s' }}>
        <ThumbsDown size={12} /> No
      </button>
    </div>
  );
}
