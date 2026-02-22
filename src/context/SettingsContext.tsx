import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { BrandSettings } from '../types';

const defaultSettings: BrandSettings = {
  company_name: 'AskFlow',
  tagline: 'Your knowledge, instantly accessible',
  primary_color: '#2563eb',
  accent_color: '#f97316',
  logo_url: '',
  template: 'stripe-minimal',
  hero_title: '',
  search_placeholder: '',
  products_label: '',
  popular_label: '',
  no_results_text: '',
  footer_text: '',
  back_label: '',
  header_display: 'both',
  custom_css: '',
};

interface SettingsContextType {
  settings: BrandSettings;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandSettings>(defaultSettings);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/public/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          company_name: data.company_name || defaultSettings.company_name,
          tagline: data.tagline || defaultSettings.tagline,
          primary_color: data.primary_color || defaultSettings.primary_color,
          accent_color: data.accent_color || defaultSettings.accent_color,
          logo_url: data.logo_url || defaultSettings.logo_url,
          template: data.template || defaultSettings.template,
          hero_title: data.hero_title || '',
          search_placeholder: data.search_placeholder || '',
          products_label: data.products_label || '',
          popular_label: data.popular_label || '',
          no_results_text: data.no_results_text || '',
          footer_text: data.footer_text || '',
          back_label: data.back_label || '',
          header_display: data.header_display || 'both',
          custom_css: data.custom_css || '',
        });
      }
    } catch {
      // Keep defaults
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-primary', settings.primary_color);
    root.style.setProperty('--color-brand-accent', settings.accent_color);
    document.title = `${settings.company_name} - FAQ`;
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
