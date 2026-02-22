import type { Product, BrandSettings } from '../types';

export interface TemplateProps {
  products: Product[];
  settings: BrandSettings;
}

export interface TemplateMeta {
  slug: string;
  name: string;
  description: string;
  font: string;
  fontUrl: string;
  screenshotPath: string;
  defaultColors: { bg: string; text: string; accent: string };
}
