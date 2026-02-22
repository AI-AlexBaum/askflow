import { useState, useMemo, Fragment } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TemplateProps } from '../types';
import type { Product, FAQCategory, FAQItem } from '../../types';
import styles from './swiss-minimal.module.css';
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

export default function SwissMinimal({ products, settings }: TemplateProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | null>(null);
  const [selectedItem, setSelectedItem] = useState<FAQItem | null>(null);
  const [parents, setParents] = useState<FAQCategory[]>([]);
  const [search, setSearch] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

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

  const getAllCategories = (cat: FAQCategory): FAQCategory[] => {
    const cats: FAQCategory[] = [cat];
    for (const sub of cat.subcategories ?? []) {
      cats.push(...getAllCategories(sub));
    }
    return cats;
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else if (selectedProduct) {
      setSelectedProduct(null);
    }
  };

  const goHome = () => {
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedItem(null);
    setParents([]);
    setSearch('');
    setOpenAccordion(null);
  };

  const goCategory = (product: Product, category: FAQCategory, newParents: FAQCategory[] = []) => {
    setSelectedProduct(product);
    setSelectedCategory(category);
    setSelectedItem(null);
    setParents(newParents);
    setOpenAccordion(null);
  };

  // Render the navigation
  const renderNav = () => (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        <a className={styles.navLogo} onClick={goHome}>
          {settings.header_display !== 'name' && settings.logo_url && <img src={settings.logo_url} alt={settings.company_name} className={styles.logoImg} />}{settings.header_display !== 'logo' && <span className={styles.headerLogoText}>{settings.company_name.toUpperCase()}</span>}
        </a>
        <ul className={styles.navLinks}>
          <li><a onClick={goHome}>Products</a></li>
          <li><a onClick={goHome}>Help</a></li>
        </ul>
      </div>
    </nav>
  );

  // --- Detail view: single FAQ item ---
  if (selectedItem && selectedCategory && selectedProduct) {
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        {renderNav()}
        <section className={styles.hero}>
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
          <h1 className={styles.heroTitleSmall}>{selectedItem.question}</h1>
          <div className={styles.itemMeta}>
            <span className={styles.metaLabel}>{selectedProduct.name}</span>
            <span className={styles.catSeparator}>&bull;</span>
            <span className={styles.metaLabel}>{selectedCategory.title}</span>
          </div>
        </section>
        <section className={styles.faqSection}>
          <div className={styles.answerBlock}>
            <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedItem.answer}</ReactMarkdown></div>
          </div>
        </section>
        <footer className={styles.footer}>
          <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</p>
        </footer>
      </div>
    );
  }

  // --- Category view: list items in a category ---
  if (selectedCategory && selectedProduct) {
    const items = (selectedCategory.items ?? []);
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        {renderNav()}
        <section className={styles.hero}>
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
          <h1>{selectedCategory.title}</h1>
          {selectedCategory.description && (
            <p className={styles.productDesc}>{selectedCategory.description}</p>
          )}
        </section>
        <section className={styles.faqSection}>
          {(selectedCategory.subcategories ?? []).length > 0 && (
            <>
              <h2 className={styles.faqSectionTitle}>Subcategories</h2>
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
                      <span className={styles.catArrowSub}>&rsaquo;</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {items.length > 0 && (
            <>
              {(selectedCategory.subcategories ?? []).length > 0 && <h2 className={styles.faqSectionTitle}>Articles</h2>}
              {(selectedCategory.subcategories ?? []).length === 0 && <h2 className={styles.faqSectionTitle}>Articles</h2>}
          <div className={styles.accordion}>
            {items.map((item) => (
              <div key={item.id} className={styles.accordionItem}>
                <div
                  className={styles.accordionLabel}
                  onClick={() => toggleAccordion(item.id)}
                >
                  <span className={styles.accordionQuestion}>{item.question}</span>
                  <span className={styles.accordionProduct}>{selectedProduct.name}</span>
                  <span className={styles.accordionIcon}>
                    {openAccordion === item.id ? '\u2212' : '+'}
                  </span>
                </div>
                {openAccordion === item.id && (
                  <div className={styles.accordionAnswer}>
                    <div className={styles.accordionAnswerInner}>
                      <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{item.answer}</ReactMarkdown></div>
                      <p className={styles.accordionAnswerCategory}>{selectedCategory.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
            </>
          )}
          {items.length === 0 && (selectedCategory.subcategories ?? []).length === 0 && (
            <div className={styles.emptyState}>No articles in this category.</div>
          )}
        </section>
        <footer className={styles.footer}>
          <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</p>
        </footer>
      </div>
    );
  }

  // --- Product view: show categories and items for a product ---
  if (selectedProduct) {
    const productItems = allItems.filter((fi) => fi.product.id === selectedProduct.id);
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        {renderNav()}
        <section className={styles.hero}>
          <button className={styles.backBtn} onClick={handleBack}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
            {settings.back_label || 'Back'}
          </button>
          <h1>{selectedProduct.name}</h1>
          <p className={styles.productDesc}>{selectedProduct.description}</p>
          <div className={styles.productCategories}>
            {selectedProduct.categories.map((cat, i) => (
              <span key={cat.id}>
                <a className={styles.catLink} onClick={() => goCategory(selectedProduct, cat)}>
                  {cat.icon && <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} />}
                  {cat.title}
                </a>
                {i < selectedProduct.categories.length - 1 && (
                  <span className={styles.catSeparator}>&bull;</span>
                )}
              </span>
            ))}
          </div>
        </section>
        <section className={styles.faqSection}>
          <h2 className={styles.faqSectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.accordion}>
            {productItems.map((fi) => (
              <div key={fi.item.id} className={styles.accordionItem}>
                <div
                  className={styles.accordionLabel}
                  onClick={() => toggleAccordion(fi.item.id)}
                >
                  <span className={styles.accordionQuestion}>{fi.item.question}</span>
                  <span className={styles.accordionProduct}>{fi.category.title}</span>
                  <span className={styles.accordionIcon}>
                    {openAccordion === fi.item.id ? '\u2212' : '+'}
                  </span>
                </div>
                {openAccordion === fi.item.id && (
                  <div className={styles.accordionAnswer}>
                    <div className={styles.accordionAnswerInner}>
                      <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div>
                      <p className={styles.accordionAnswerCategory}>{fi.category.title}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        <footer className={styles.footer}>
          <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</p>
        </footer>
      </div>
    );
  }

  // --- Search results ---
  if (search.trim()) {
    return (
      <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
        {renderNav()}
        <section className={styles.hero}>
          <h1>Search Results</h1>
          <div className={styles.heroSearch}>
            <input
              type="text"
              placeholder={settings.search_placeholder || 'Type your question'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>
        <section className={styles.faqSection}>
          <h2 className={styles.faqSectionTitle}>
            {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
          </h2>
          <div className={styles.accordion}>
            {searchResults.map((fi) => (
              <div key={fi.item.id} className={styles.accordionItem}>
                <div
                  className={styles.accordionLabel}
                  onClick={() => toggleAccordion(fi.item.id)}
                >
                  <span className={styles.accordionQuestion}>{fi.item.question}</span>
                  <span className={styles.accordionProduct}>{fi.product.name}</span>
                  <span className={styles.accordionIcon}>
                    {openAccordion === fi.item.id ? '\u2212' : '+'}
                  </span>
                </div>
                {openAccordion === fi.item.id && (
                  <div className={styles.accordionAnswer}>
                    <div className={styles.accordionAnswerInner}>
                      <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div>
                      <p className={styles.accordionAnswerCategory}>
                        {fi.product.name} &mdash; {fi.category.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {searchResults.length === 0 && (
              <div className={styles.emptyState}>{settings.no_results_text || `No results found for "${search}".`}</div>
            )}
          </div>
        </section>
        <footer className={styles.footer}>
          <p>{settings.footer_text || `\u00A9 ${new Date().getFullYear()} ${settings.company_name}`}</p>
        </footer>
      </div>
    );
  }

  // --- Home view: hero + products + FAQ accordion ---
  return (
    <div className={styles.root} style={{ '--accent': settings.primary_color } as React.CSSProperties}>
      {renderNav()}

      {/* Hero */}
      <section className={styles.hero}>
        <h1>{settings.hero_title || settings.tagline || 'How can we help?'}</h1>
        <div className={styles.heroSearch}>
          <input
            type="text"
            placeholder={settings.search_placeholder || 'Type your question'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* Products */}
      <section className={styles.products}>
        {products.map((product) => (
          <div
            key={product.id}
            className={styles.productSection}
            onClick={() => setSelectedProduct(product)}
          >
            <div className={styles.productHeader}>
              <h2 className={styles.productName}>{product.name}</h2>
            </div>
            <p className={styles.productDesc}>{product.description}</p>
            <div className={styles.productCategories}>
              {product.categories.map((cat, i) => (
                <span key={cat.id}>
                  <span>{cat.icon && <DynamicIcon name={cat.icon} size={16} className={styles.catIcon} />}{cat.title}</span>
                  {i < product.categories.length - 1 && (
                    <span className={styles.catSeparator}>&bull;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ Accordion */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqSectionTitle}>{settings.popular_label || 'Frequently Asked Questions'}</h2>
        <div className={styles.accordion}>
          {allItems.map((fi) => (
            <div key={fi.item.id} className={styles.accordionItem}>
              <div
                className={styles.accordionLabel}
                onClick={() => toggleAccordion(fi.item.id)}
              >
                <span className={styles.accordionQuestion}>{fi.item.question}</span>
                <span className={styles.accordionProduct}>{fi.product.name}</span>
                <span className={styles.accordionIcon}>
                  {openAccordion === fi.item.id ? '\u2212' : '+'}
                </span>
              </div>
              {openAccordion === fi.item.id && (
                <div className={styles.accordionAnswer}>
                  <div className={styles.accordionAnswerInner}>
                    <div className={styles.markdownContent}><ReactMarkdown remarkPlugins={[remarkGfm]}>{fi.item.answer}</ReactMarkdown></div>
                    <p className={styles.accordionAnswerCategory}>
                      {fi.product.name} &mdash; {fi.category.title}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} {settings.company_name}</p>
      </footer>
    </div>
  );
}
