import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BentoGrid } from './components/BentoGrid';
import { defaultCategoryId, getVisibleCategories } from './lib/siteCatalog';
import { registerPortfolioWebMcp } from './lib/webmcp';
import type { Locale } from './types';

const ContactDialog = lazy(() => import('./components/ContactDialog').then((module) => ({ default: module.ContactDialog })));
const AdminConsole = lazy(() => import('./components/AdminConsole').then((module) => ({ default: module.AdminConsole })));

const getInitialLocale = (): Locale => {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'zh';
};

const getInitialCategory = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('category') || defaultCategoryId;
};

export default function App() {
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  if (isAdmin) return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm font-bold text-text-muted">載入管理後台…</div>}><AdminConsole /></Suspense>;

  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [activeCategoryId, setActiveCategoryId] = useState(getInitialCategory);
  const [contactOpen, setContactOpen] = useState(false);
  const localeRef = useRef(locale);
  const activeCategoryIdRef = useRef(activeCategoryId);
  const visibleCategories = getVisibleCategories();

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const cleanup = registerPortfolioWebMcp({
      getLocale: () => localeRef.current,
      getActiveCategoryId: () => activeCategoryIdRef.current,
      setActiveCategoryId: (categoryId) => setCategoryAndSyncUrl(categoryId),
    });

    return cleanup;
  }, []);

  useEffect(() => {
    if (!visibleCategories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(visibleCategories[0]?.id ?? defaultCategoryId);
    }
  }, [activeCategoryId, visibleCategories]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const updateUrlState = (nextLocale = locale, nextCategory = activeCategoryId) => {
    const params = new URLSearchParams(window.location.search);
    if (nextLocale === 'en') {
      params.set('lang', 'en');
    } else {
      params.delete('lang');
    }
    params.set('category', nextCategory);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const setCategoryAndSyncUrl = (nextCategory: string) => {
    setActiveCategoryId(nextCategory);
    updateUrlState(localeRef.current, nextCategory);
  };

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    updateUrlState(nextLocale, activeCategoryId);
  };

  const changeCategory = (nextCategory: string) => {
    setCategoryAndSyncUrl(nextCategory);
  };

  return (
    <div className="min-h-screen px-4 pb-4 pt-28 transition-colors duration-300 md:px-6 md:pb-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} locale={locale} onLocaleChange={changeLocale} onContact={() => setContactOpen(true)} />
        <BentoGrid locale={locale} activeCategoryId={activeCategoryId} onCategoryChange={changeCategory} />
      </div>
      {contactOpen && <Suspense fallback={null}><ContactDialog locale={locale} onClose={() => setContactOpen(false)} /></Suspense>}
    </div>
  );
}
