export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  status?: string;
}

export interface FAQCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  status?: string;
  subcategories?: FAQCategory[];
  items?: FAQItem[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  status?: string;
  categories: FAQCategory[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  key?: string;
  is_active: number;
  last_used: string | null;
  created_at: string;
}

export interface BrandSettings {
  company_name: string;
  tagline: string;
  primary_color: string;
  accent_color: string;
  logo_url: string;
  template: string;
  hero_title: string;
  search_placeholder: string;
  products_label: string;
  popular_label: string;
  no_results_text: string;
  footer_text: string;
  back_label: string;
  header_display: 'both' | 'name' | 'logo';
  custom_css: string;
}

export interface GeneratedTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  prompt_data: string;
  tsx_code: string;
  css_code: string;
  font: string;
  font_url: string;
  default_colors: string;
  screenshot_url: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}
