import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import s from './gradient-mesh.module.css';
import DynamicIcon from '../IconMap';

type View =
  | { kind: 'home' }
  | { kind: 'category'; product: Product; category: FAQCategory; parents: FAQCategory[] }
  | { kind: 'item'; product: Product; category: FAQCategory; parents: FAQCategory[]; item: FAQItem };

interface FlatItem {
  product: Product;
  category: FAQCategory;
  item: FAQItem;
}

function flattenItems(products: Product[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const product of products) {
    for (const category of product.categories) {
      for (const item of category.items ?? []) {
        result.push({ product, category, item });
      }
      for (const sub of category.subcategories ?? []) {
        for (const item of sub.items ?? []) {
          result.push({ product, category: sub, item });
        }
      }
    }
  }
  return result;
}

function countItems(cat: FAQCategory): number {
  let count = (cat.items ?? []).length;
  for (const sub of cat.subcategories ?? []) {
    count += countItems(sub);
  }
  return count;
}

export default function GradientMesh({ products, settings }: TemplateProps) {
  const [view, setView] = useState<View>({ kind: 'home' });
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allItems = useMemo(() => flattenItems(products), [products]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return allItems.filter(
      (fi) =>
        fi.item.question.toLowerCase().includes(q) ||
        fi.item.answer.toLowerCase().includes(q),
    );
  }, [search, allItems]);

  const isSearching = search.trim().length > 0;

  function toggleFaq(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function goHome() {
    setView({ kind: 'home' });
    setSearch('');
    setExpandedId(null);
  }

  function goCategory(product: Product, category: FAQCategory, parents: FAQCategory[] = []) {
    setView({ kind: 'category', product, category, parents });
    setExpandedId(null);
  }

  return (
    <div className={s.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      <div className={s.meshBg} />

      {/* Header */}
      <header className={s.header}>
        <button className={s.headerLogo} onClick={goHome} type="button">
          {settings.header_display !== 'name' && settings.logo_url && (
            <img src={settings.logo_url} alt={settings.company_name} className={s.headerLogoImg} />
          )}
          {settings.header_display !== 'logo' && <span className={s.headerLogoText}>{settings.company_name}</span>}
        </button>
        <nav className={s.headerNav}>
          <button
            className={`${s.headerNavLink} ${view.kind === 'home' && !isSearching ? s.headerNavLinkActive : ''}`}
            onClick={goHome}
          >
            Home
          </button>
        </nav>
      </header>

      {/* Hero */}
      <section className={s.hero}>
        <h1 className={s.heroTitle}>{settings.hero_title || 'How can we help?'}</h1>
        <p className={s.heroTagline}>{settings.tagline}</p>
        <div className={s.searchWrapper}>
          <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className={s.searchInput}
            placeholder={settings.search_placeholder || 'Search for anything...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Search results */}
      {isSearching && (
        <section className={s.searchResults}>
          <h2 className={s.sectionTitle}>
            Results for &ldquo;{search}&rdquo;
          </h2>
          {searchResults.length === 0 ? (
            <p className={s.noResults}>{settings.no_results_text || 'No results found. Try a different search term.'}</p>
          ) : (
            <div className={s.faqList}>
              {searchResults.map((fi) => {
                const isOpen = expandedId === fi.item.id;
                return (
                  <div
                    key={fi.item.id}
                    className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                  >
                    <button className={s.faqQuestion} onClick={() => toggleFaq(fi.item.id)}>
                      <span>
                        <span className={s.faqProductTag}>{fi.product.name}</span>
                        <br />
                        {fi.item.question}
                      </span>
                      <span className={s.faqToggle}>+</span>
                    </button>
                    <div className={s.faqAnswer}>
                      <div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Home view */}
      {!isSearching && view.kind === 'home' && (
        <>
          {/* Products */}
          <section className={s.products}>
            <h2 className={s.sectionTitle}>Browse Products</h2>
            <div className={s.productsGrid}>
              {products.map((product) => (
                <div key={product.id} className={s.productCard}>
                  <button className={s.productName} onClick={() => {
                    if (product.categories.length > 0) {
                      goCategory(product, product.categories[0]);
                    }
                  }}>
                    {product.name}
                  </button>
                  <p className={s.productDesc}>{product.description}</p>
                  <ul className={s.categoryList}>
                    {product.categories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          className={s.categoryLink}
                          onClick={() => goCategory(product, cat)}
                        >
                          {cat.icon && <DynamicIcon name={cat.icon} size={16} className={s.catIcon} />}
                          {cat.title}
                          <span className={s.catArrow}>&rarr;</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className={s.divider}>
            <span className={s.dividerLine} />
          </div>

          {/* Top questions */}
          <section className={s.popular}>
            <h2 className={s.sectionTitle}>{settings.popular_label || 'Top Questions'}</h2>
            <div className={s.faqList}>
              {allItems.slice(0, 8).map((fi) => {
                const isOpen = expandedId === fi.item.id;
                return (
                  <div
                    key={fi.item.id}
                    className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                  >
                    <button className={s.faqQuestion} onClick={() => toggleFaq(fi.item.id)}>
                      <span>
                        <span className={s.faqProductTag}>{fi.product.name}</span>
                        <br />
                        {fi.item.question}
                      </span>
                      <span className={s.faqToggle}>+</span>
                    </button>
                    <div className={s.faqAnswer}>
                      <div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Category view */}
      {!isSearching && view.kind === 'category' && (
        <section className={s.categoryView}>
          <nav className={s.breadcrumbs}>
            <button className={s.breadcrumbLink} onClick={goHome}>Home</button>
            <span className={s.breadcrumbSep}>&rsaquo;</span>
            <button className={s.breadcrumbLink} onClick={goHome}>{view.product.name}</button>
            {view.parents.map((parent, i) => (
              <Fragment key={parent.id}>
                <span className={s.breadcrumbSep}>&rsaquo;</span>
                <button className={s.breadcrumbLink} onClick={() => goCategory(view.product, parent, view.parents.slice(0, i))}>
                  {parent.title}
                </button>
              </Fragment>
            ))}
            <span className={s.breadcrumbSep}>&rsaquo;</span>
            <span className={s.breadcrumbCurrent}>{view.category.title}</span>
          </nav>
          <h2 className={s.categoryTitle}>{view.category.title}</h2>
          {view.category.description && (
            <p className={s.categoryDesc}>{view.category.description}</p>
          )}
          {(view.category.subcategories ?? []).length > 0 && (
            <>
              <div className={s.sectionLabel}>Subcategories</div>
              <div className={s.subcategoryList}>
                {view.category.subcategories!.map((sub) => (
                  <button key={sub.id} className={s.subcategoryItem}
                    onClick={() => goCategory(view.product, sub, [...view.parents, view.category])}>
                    <span className={s.subcategoryLeft}>
                      {sub.icon ? <DynamicIcon name={sub.icon} size={18} className={s.catIcon} /> : (
                        <svg className={s.folderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      )}
                      {sub.title}
                    </span>
                    <span className={s.subcategoryRight}>
                      <span className={s.subcategoryCount}>{countItems(sub)} items</span>
                      <span className={s.catArrow}>&rsaquo;</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {(view.category.items ?? []).length > 0 && (
            <>
              {(view.category.subcategories ?? []).length > 0 && <div className={s.sectionLabel}>Articles</div>}
              <div className={s.faqList}>
                {(view.category.items ?? []).map((item) => {
                  const isOpen = expandedId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`${s.faqItem} ${isOpen ? s.faqItemActive : ''}`}
                    >
                      <button className={s.faqQuestion} onClick={() => toggleFaq(item.id)}>
                        <span>{item.question}</span>
                        <span className={s.faqToggle}>+</span>
                      </button>
                      <div className={s.faqAnswer}>
                        <div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* Item detail view */}
      {!isSearching && view.kind === 'item' && (
        <section className={s.categoryView}>
          <nav className={s.breadcrumbs}>
            <button className={s.breadcrumbLink} onClick={goHome}>Home</button>
            <span className={s.breadcrumbSep}>&rsaquo;</span>
            <button className={s.breadcrumbLink} onClick={goHome}>{view.product.name}</button>
            {view.parents.map((parent, i) => (
              <Fragment key={parent.id}>
                <span className={s.breadcrumbSep}>&rsaquo;</span>
                <button className={s.breadcrumbLink} onClick={() => goCategory(view.product, parent, view.parents.slice(0, i))}>
                  {parent.title}
                </button>
              </Fragment>
            ))}
            <span className={s.breadcrumbSep}>&rsaquo;</span>
            <button className={s.breadcrumbLink} onClick={() => goCategory(view.product, view.category, view.parents)}>
              {view.category.title}
            </button>
            <span className={s.breadcrumbSep}>&rsaquo;</span>
            <span className={s.breadcrumbCurrent}>{view.item.question}</span>
          </nav>
          <h2 className={s.categoryTitle}>{view.item.question}</h2>
          <div className={s.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{view.item.answer}</ReactMarkdown></div>
        </section>
      )}

      {/* Footer */}
      <footer className={s.footer}>
        <span className={s.footerCopy}>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</span>
        <span className={s.footerTagline}>{settings.tagline}</span>
      </footer>
    </div>
  );
}
