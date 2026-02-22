import { Suspense, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useData } from './context/DataContext';
import { useSettings } from './context/SettingsContext';
import registry, { DEFAULT_TEMPLATE } from './templates';
import FontLoader from './templates/FontLoader';

export default function App() {
  const { products } = useData();
  const { settings } = useSettings();

  const allItems = useMemo(() => {
    const items: { question: string; answer: string }[] = [];
    for (const p of products) {
      function collectItems(cats: any[]) {
        for (const c of cats) {
          for (const i of c.items || []) items.push(i);
          if (c.subcategories) collectItems(c.subcategories);
        }
      }
      collectItems(p.categories);
    }
    return items.slice(0, 50);
  }, [products]);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allItems.map(i => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };

  const seoHelmet = (
    <Helmet>
      <title>{settings.company_name ? `${settings.company_name} - FAQ` : 'FAQ'}</title>
      <meta name="description" content={settings.tagline || 'FAQ and Knowledge Base'} />
      <meta property="og:title" content={`${settings.company_name || 'AskFlow'} - FAQ`} />
      <meta property="og:description" content={settings.tagline || 'FAQ and Knowledge Base'} />
      {settings.logo_url && <meta property="og:image" content={settings.logo_url} />}
      <meta property="og:type" content="website" />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </Helmet>
  );

  const slug = settings.template || DEFAULT_TEMPLATE;

  // Generated templates (slug starts with "gen-") are rendered via iframe
  if (slug.startsWith('gen-')) {
    return (
      <>
        {seoHelmet}
        <iframe
          src={`/api/public/generated-template/${slug}`}
          sandbox="allow-scripts"
          style={{ width: '100%', height: '100vh', border: 'none' }}
          title="FAQ Template"
        />
      </>
    );
  }

  const entry = registry[slug] || registry[DEFAULT_TEMPLATE];
  const TemplateComponent = entry.component;

  return (
    <>
      {seoHelmet}
      {settings.custom_css && <style>{settings.custom_css}</style>}
      <FontLoader fontUrl={entry.fontUrl} />
      <Suspense
        fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: settings.primary_color, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        }
      >
        <TemplateComponent products={products} settings={settings} />
      </Suspense>
    </>
  );
}
