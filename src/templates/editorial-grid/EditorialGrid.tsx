import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './editorial-grid.module.css';
import DynamicIcon from '../IconMap';

interface FlatItem {
  item: FAQItem;
  product: Product;
  category: FAQCategory;
}

function flattenItems(products: Product[]): FlatItem[] {
  const result: FlatItem[] = [];
  for (const product of products) {
    const walk = (cat: FAQCategory) => {
      for (const item of cat.items ?? []) {
        result.push({ item, product, category: cat });
      }
      for (const sub of cat.subcategories ?? []) {
        walk(sub);
      }
    };
    for (const cat of product.categories) {
      walk(cat);
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

export default function EditorialGrid({ products, settings }: TemplateProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);
  const [parents, setParents] = useState<FAQCategory[]>([]);
  const [search, setSearch] = useState('');

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

  // Get all categories for a product
  const getAllCategories = (product: Product): FAQCategory[] => {
    const cats: FAQCategory[] = [];
    const walk = (c: FAQCategory) => {
      cats.push(c);
      for (const sub of c.subcategories ?? []) walk(sub);
    };
    product.categories.forEach(walk);
    return cats;
  };

  // Get first FAQ item from a product for the card preview
  const getPreviewFaq = (product: Product): FlatItem | undefined => {
    return allItems.find((fi) => fi.product.id === product.id);
  };

  const goHome = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedItem(null);
    setParents([]);
    setSearch('');
  };

  const goCategory = (product: Product, category: FAQCategory, newParents: FAQCategory[] = []) => {
    setSelectedProduct(product);
    setSelectedCategory(category);
    setSelectedItem(null);
    setParents(newParents);
  };

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setParents([]);
    } else if (selectedProduct) {
      setSelectedProduct(null);
    }
  };

  // --- Detail view: single FAQ item ---
  if (selectedItem && selectedCategory && selectedProduct) {
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <a className={styles.navLogo} onClick={goHome}>
              {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name}</span>}
            </a>
            <div className={styles.navRight}>
              <div className={styles.navSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder={settings.search_placeholder || 'Search articles...'} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </nav>
        <main className={styles.main}>
          <nav className={styles.breadcrumbs}>
            <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <button className={styles.breadcrumbLink} onClick={goHome}>{selectedProduct.name}</button>
            {parents.map((parent, i) => (
              <Fragment key={parent.id}>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={() => goCategory(selectedProduct, parent, parents.slice(0, i))}>
                  {parent.title}
                </button>
              </Fragment>
            ))}
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <button className={styles.breadcrumbLink} onClick={() => goCategory(selectedProduct, selectedCategory, parents)}>
              {selectedCategory.title}
            </button>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <span className={styles.breadcrumbCurrent}>{selectedItem.question}</span>
          </nav>
          <article className={styles.articleDetail}>
            <div className={styles.articleDetailMeta}>
              <span className={styles.tagProduct}>{selectedProduct.name}</span>
              <span className={styles.tagCategory}>{selectedCategory.title}</span>
            </div>
            <h1 className={styles.articleDetailTitle}>{selectedItem.question}</h1>
            <div className={styles.articleDetailAnswer}><div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedItem.answer}</ReactMarkdown></div></div>
          </article>
        </main>
      </div>
    );
  }

  // --- Category view: list items in a category ---
  if (selectedCategory && selectedProduct) {
    const items = (selectedCategory.items ?? []);
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <a className={styles.navLogo} onClick={goHome}>
              {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name}</span>}
            </a>
            <div className={styles.navRight}>
              <div className={styles.navSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder={settings.search_placeholder || 'Search articles...'} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </nav>
        <main className={styles.main}>
          <nav className={styles.breadcrumbs}>
            <button className={styles.breadcrumbLink} onClick={goHome}>Home</button>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <button className={styles.breadcrumbLink} onClick={goHome}>{selectedProduct.name}</button>
            {parents.map((parent, i) => (
              <Fragment key={parent.id}>
                <span className={styles.breadcrumbSep}>&rsaquo;</span>
                <button className={styles.breadcrumbLink} onClick={() => goCategory(selectedProduct, parent, parents.slice(0, i))}>
                  {parent.title}
                </button>
              </Fragment>
            ))}
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <span className={styles.breadcrumbCurrent}>{selectedCategory.title}</span>
          </nav>
          <div className={styles.sectionHeader}>
            <h2>{selectedCategory.title}</h2>
          </div>
          {selectedCategory.description && (
            <p className={styles.categoryDesc}>{selectedCategory.description}</p>
          )}
          {(selectedCategory.subcategories ?? []).length > 0 && (
            <>
              <div className={styles.sectionLabel}>Subcategories</div>
              <div className={styles.subcategoryList}>
                {selectedCategory.subcategories!.map((sub) => (
                  <button key={sub.id} className={styles.subcategoryItem}
                    onClick={() => goCategory(selectedProduct, sub, [...parents, selectedCategory])}>
                    <span className={styles.subcategoryLeft}>
                      {sub.icon ? <DynamicIcon name={sub.icon} size={18} className={styles.catIcon} /> : (
                        <svg className={styles.folderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      )}
                      {sub.title}
                    </span>
                    <span className={styles.subcategoryRight}>
                      <span className={styles.subcategoryCount}>{countItems(sub)} items</span>
                      <span className={styles.catArrow}>&rsaquo;</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {(items.length > 0) && (
            <>
              {(selectedCategory.subcategories ?? []).length > 0 && <div className={styles.sectionLabel}>Articles</div>}
              <ul className={styles.articlesList}>
                {items.map((item) => (
                  <li key={item.id} className={styles.articleRow} onClick={() => setSelectedItem(item)}>
                    <div className={styles.articleContent}>
                      <div className={styles.articleTitle}>{item.question}</div>
                      <div className={styles.articleMeta}>
                        <span className={styles.tagProduct}>{selectedProduct.name}</span>
                        <span className={styles.tagCategory}>{selectedCategory.title}</span>
                      </div>
                    </div>
                    <svg className={styles.articleArrow} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                  </li>
                ))}
              </ul>
            </>
          )}
          {items.length === 0 && (selectedCategory.subcategories ?? []).length === 0 && (
            <ul className={styles.articlesList}>
              <li className={styles.emptyState}>No articles in this category.</li>
            </ul>
          )}
        </main>
      </div>
    );
  }

  // --- Product view: show categories for a product ---
  if (selectedProduct) {
    const categories = getAllCategories(selectedProduct);
    const productItems = allItems.filter((fi) => fi.product.id === selectedProduct.id);
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <a className={styles.navLogo} onClick={goHome}>
              {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name}</span>}
            </a>
            <div className={styles.navRight}>
              <div className={styles.navSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder={settings.search_placeholder || 'Search articles...'} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </nav>
        <main className={styles.main}>
          <button className={styles.backBtn} onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
            {settings.back_label || 'Back'}
          </button>
          <div className={styles.sectionHeader}>
            <h2>{selectedProduct.name}</h2>
          </div>
          <p className={styles.categoryDesc}>{selectedProduct.description}</p>
          <div className={styles.pillsRow}>
            {selectedProduct.categories.map((cat) => (
              <button key={cat.id} className={styles.pill} onClick={() => goCategory(selectedProduct, cat)}>
                {cat.icon && <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} />}
                {cat.title}
              </button>
            ))}
          </div>
          <div className={styles.articlesSection}>
            <div className={styles.sectionHeader}>
              <h2>All Articles</h2>
            </div>
            <ul className={styles.articlesList}>
              {productItems.map((fi) => (
                <li key={fi.item.id} className={styles.articleRow} onClick={() => setSelectedItem(fi.item)}>
                  <div className={styles.articleContent}>
                    <div className={styles.articleTitle}>{fi.item.question}</div>
                    <div className={styles.articleMeta}>
                      <span className={styles.tagCategory}>{fi.category.title}</span>
                    </div>
                  </div>
                  <svg className={styles.articleArrow} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    );
  }

  // --- Search results view ---
  if (search.trim()) {
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <a className={styles.navLogo} onClick={goHome}>
              {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name}</span>}
            </a>
            <div className={styles.navRight}>
              <div className={styles.navSearch}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder={settings.search_placeholder || 'Search articles...'} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </nav>
        <main className={styles.main}>
          <div className={styles.sectionHeader}>
            <h2>Search Results</h2>
          </div>
          <ul className={styles.articlesList}>
            {searchResults.map((fi) => (
              <li key={fi.item.id} className={styles.articleRow} onClick={() => { setSelectedItem(fi.item); setSearch(''); }}>
                <div className={styles.articleContent}>
                  <div className={styles.articleTitle}>{fi.item.question}</div>
                  <div className={styles.articleMeta}>
                    <span className={styles.tagProduct}>{fi.product.name}</span>
                    <span className={styles.tagCategory}>{fi.category.title}</span>
                  </div>
                </div>
                <svg className={styles.articleArrow} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
              </li>
            ))}
            {searchResults.length === 0 && (
              <li className={styles.emptyState}>{settings.no_results_text || `No results found for "${search}".`}</li>
            )}
          </ul>
        </main>
      </div>
    );
  }

  // --- Home view: product grid + latest articles ---
  const featured = products[0] ?? null;
  const others = products.slice(1);

  return (
    <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <a className={styles.navLogo} onClick={goHome}>
            {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name}</span>}
          </a>
          <div className={styles.navRight}>
            <ul className={styles.navLinks}>
              <li><a onClick={() => setSearch('')}>Products</a></li>
              <li><a onClick={() => setSearch('')}>Categories</a></li>
            </ul>
            <div className={styles.navSearch}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
              <input type="text" placeholder={settings.search_placeholder || 'Search articles...'} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </nav>

      <main className={styles.main}>
        {/* Product Grid */}
        <div className={styles.sectionHeader}>
          <h2>Products</h2>
        </div>
        <div className={styles.productGrid}>
          {featured && (
            <div className={styles.cardFeatured}>
              <div className={styles.cardFeaturedTop}>
                <div>
                  <h2 className={styles.cardProductName}>{featured.name}</h2>
                  <p className={styles.cardProductDesc}>{featured.description}</p>
                </div>
                <span className={styles.cardProductBadge}>Featured</span>
              </div>
              <div className={styles.cardPills}>
                {featured.categories.map((cat) => (
                  <button key={cat.id} className={styles.pill} onClick={() => goCategory(featured, cat)}>
                    {cat.icon && <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} />}
                    {cat.title}
                  </button>
                ))}
              </div>
              {(() => {
                const preview = getPreviewFaq(featured);
                if (!preview) return null;
                return (
                  <div className={styles.cardFeaturedFaq}>
                    <div className={styles.cardFeaturedFaqLabel}>{settings.popular_label || 'Popular Question'}</div>
                    <div className={styles.cardFeaturedFaqQ}>{preview.item.question}</div>
                    <div className={styles.cardFeaturedFaqA}><div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{preview.item.answer}</ReactMarkdown></div></div>
                  </div>
                );
              })()}
              <button className={styles.cardCta} onClick={() => setSelectedProduct(featured)}>
                Browse {featured.name} articles
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
              </button>
            </div>
          )}

          {others.map((product) => {
            const preview = getPreviewFaq(product);
            return (
              <div key={product.id} className={styles.cardCompact}>
                <div>
                  <h2 className={styles.cardProductNameCompact}>{product.name}</h2>
                  <p className={styles.cardProductDescCompact}>{product.description}</p>
                </div>
                <div className={styles.cardPills}>
                  {product.categories.map((cat) => (
                    <button key={cat.id} className={styles.pill} onClick={() => goCategory(product, cat)}>
                      {cat.icon && <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} />}
                      {cat.title}
                    </button>
                  ))}
                </div>
                {preview && (
                  <div className={styles.cardCompactFaq}>
                    <div className={styles.cardCompactFaqQ}>{preview.item.question}</div>
                    <div className={styles.cardCompactFaqA}><div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{preview.item.answer}</ReactMarkdown></div></div>
                  </div>
                )}
                <button className={styles.cardCta} onClick={() => setSelectedProduct(product)}>
                  Browse {product.name} articles
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Latest Articles */}
        <div className={styles.articlesSection}>
          <div className={styles.sectionHeader}>
            <h2>Latest Articles</h2>
          </div>
          <ul className={styles.articlesList}>
            {allItems.map((fi) => (
              <li key={fi.item.id} className={styles.articleRow} onClick={() => setSelectedItem(fi.item)}>
                <div className={styles.articleContent}>
                  <div className={styles.articleTitle}>{fi.item.question}</div>
                  <div className={styles.articleMeta}>
                    <span className={styles.tagProduct}>{fi.product.name}</span>
                    <span className={styles.tagCategory}>{fi.category.title}</span>
                  </div>
                </div>
                <svg className={styles.articleArrow} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerBrandName}>{settings.company_name}</div>
              <p className={styles.footerBrandDesc}>{settings.tagline}</p>
            </div>
            <div className={styles.footerCol}>
              <h4>Products</h4>
              <ul>
                {products.map((p) => (
                  <li key={p.id}><a onClick={() => setSelectedProduct(p)}>{p.name}</a></li>
                ))}
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Resources</h4>
              <ul>
                <li><a>Getting Started</a></li>
                <li><a>API Docs</a></li>
                <li><a>Release Notes</a></li>
              </ul>
            </div>
            <div className={styles.footerCol}>
              <h4>Support</h4>
              <ul>
                <li><a>Contact Us</a></li>
                <li><a>Community</a></li>
                <li><a>Status</a></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span className={styles.footerCopy}>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}. All rights reserved.`}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
