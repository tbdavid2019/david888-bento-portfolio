import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BentoGrid } from './components/BentoGrid';

export type Locale = 'zh' | 'en';

const getInitialLocale = (): Locale => {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'zh';
};

const getInitialCategory = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('category') || 'social';
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [activeCategoryId, setActiveCategoryId] = useState(getInitialCategory);

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

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    updateUrlState(nextLocale, activeCategoryId);
  };

  const changeCategory = (nextCategory: string) => {
    setActiveCategoryId(nextCategory);
    updateUrlState(locale, nextCategory);
  };

  return (
    <div className="min-h-screen px-4 pb-4 pt-28 transition-colors duration-300 md:px-6 md:pb-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <Navbar darkMode={darkMode} toggleTheme={toggleTheme} locale={locale} onLocaleChange={changeLocale} />
        <BentoGrid locale={locale} activeCategoryId={activeCategoryId} onCategoryChange={changeCategory} />
      </div>
    </div>
  );
}
