import { useEffect } from 'react';

const ATTR = 'data-template-font';

export default function FontLoader({ fontUrl }: { fontUrl: string }) {
  useEffect(() => {
    if (!fontUrl) return;

    // Remove previous template font links
    document.querySelectorAll(`link[${ATTR}]`).forEach((el) => el.remove());

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.setAttribute(ATTR, 'true');
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [fontUrl]);

  return null;
}
