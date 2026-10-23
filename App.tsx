import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Navbar } from './components/Navbar';
import { BentoGrid } from './components/BentoGrid';
import { ContactDialog } from './components/ContactDialog';
import { FloatingConciergeButton } from './components/FloatingConciergeButton';
import { defaultCategoryId, getVisibleCategories } from './lib/siteCatalog';
import { registerPortfolioWebMcp } from './lib/webmcp';
import type { Locale } from './types';

const AdminConsole = lazy(() =>
  import('./components/AdminConsole').then((module) => ({ default: module.AdminConsole })),
);

export const VALID_CANONICAL_ROUTES = new Set([
  'contact',
  'contact/form',
  'commitments',
  'promises',
  'executive',
  'advisory',
  'flagships',
  'social',
  'finance',
  'products',
  'agent-skills',
  'experiments',
  'metaphysics',
]);

const normalizeRouteAlias = (raw: string): string => {
  const cleaned = raw.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (cleaned === 'promises') return 'commitments';
  if (cleaned === 'advisory') return 'executive';
  if (cleaned === 'metaphysics') return 'finance';
  if (cleaned === 'experiments') return 'products';
  return cleaned;
};

export const isContactRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('contact') === '1' || params.has('contact')) return true;
  const path = normalizeRouteAlias(window.location.pathname);
  if (path === 'contact' || path === 'contact/form' || path.startsWith('contact/')) return true;
  const hash = normalizeRouteAlias(window.location.hash.replace(/^#/, ''));
  if (hash === 'contact' || hash === 'contact/form' || hash.startsWith('contact/')) return true;
  return false;
};

export const getContactInitialTab = (): 'chat' | 'form' => {
  if (typeof window === 'undefined') return 'chat';
  const path = normalizeRouteAlias(window.location.pathname);
  if (path === 'contact/form' || path === 'form') return 'form';
  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'form' || params.get('mode') === 'form' || params.has('form')) return 'form';
  const hash = normalizeRouteAlias(window.location.hash.replace(/^#/, ''));
  if (hash === 'contact/form' || hash === 'form') return 'form';
  return 'chat';
};

const getInitialLocale = (): Locale => {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') === 'en' ? 'en' : 'zh';
};

const getInitialCategory = (): string => {
  const params = new URLSearchParams(window.location.search);
  const queryCategory = params.get('category');
  if (queryCategory) {
    const normalized = normalizeRouteAlias(queryCategory);
    if (normalized !== 'contact' && normalized !== 'contact/form' && !normalized.startsWith('contact/') && VALID_CANONICAL_ROUTES.has(normalized)) {
      return normalized;
    }
  }

  const pathSegment = normalizeRouteAlias(window.location.pathname);
  if (
    pathSegment &&
    pathSegment !== 'contact' &&
    pathSegment !== 'contact/form' &&
    !pathSegment.startsWith('contact/') &&
    VALID_CANONICAL_ROUTES.has(pathSegment)
  ) {
    return pathSegment;
  }

  const hashSegment = normalizeRouteAlias(window.location.hash.replace(/^#/, ''));
  if (
    hashSegment &&
    hashSegment !== 'contact' &&
    hashSegment !== 'contact/form' &&
    !hashSegment.startsWith('contact/') &&
    VALID_CANONICAL_ROUTES.has(hashSegment)
  ) {
    return hashSegment;
  }

  return defaultCategoryId;
};

export default function App() {
  const isAdmin = new URLSearchParams(window.location.search).get('admin') === '1';
  if (isAdmin)
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-sm font-bold text-text-muted">
            載入管理後台…
          </div>
        }
      >
        <AdminConsole />
      </Suspense>
    );

  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [activeCategoryId, setActiveCategoryId] = useState(getInitialCategory);
  const [contactOpen, setContactOpen] = useState(isContactRoute);
  const [contactInitialTab, setContactInitialTab] = useState<'chat' | 'form'>(getContactInitialTab);
  const [contactDefaultSubjectId, setContactDefaultSubjectId] = useState<string>('consulting');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const localeRef = useRef(locale);
  const activeCategoryIdRef = useRef(activeCategoryId);
  const visibleCategories = getVisibleCategories();

  const openContactDialog = (defaultSubjectId = 'consulting', tab: 'chat' | 'form' = 'chat') => {
    setContactDefaultSubjectId(defaultSubjectId);
    setContactInitialTab(tab);
    setContactOpen(true);
    const targetPath = tab === 'form' ? '/contact/form' : '/contact';
    const query = window.location.search;
    const targetUrl = query ? `${targetPath}${query}` : targetPath;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetUrl);
    }
  };

  const closeContactDialog = () => {
    setContactOpen(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('contact');
    params.delete('tab');
    params.delete('mode');
    params.delete('form');

    const fallbackPath =
      activeCategoryIdRef.current &&
      activeCategoryIdRef.current !== defaultCategoryId &&
      activeCategoryIdRef.current !== 'contact' &&
      activeCategoryIdRef.current !== 'contact/form' &&
      !activeCategoryIdRef.current.startsWith('contact/')
        ? `/${activeCategoryIdRef.current}`
        : '/';

    const queryStr = params.toString();
    const nextUrl = queryStr ? `${fallbackPath}?${queryStr}` : fallbackPath;
    window.history.replaceState(null, '', nextUrl);
  };

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    activeCategoryIdRef.current = activeCategoryId;
  }, [activeCategoryId]);

  useEffect(() => {
    const cleanup = registerPortfolioWebMcp({
      getLocale: () => localeRef.current,
      getActiveCategoryId: () => activeCategoryIdRef.current,
      setActiveCategoryId: (categoryId) => setCategoryAndSyncUrl(categoryId),
      openContactForm: () => openContactDialog('consulting'),
    });

    return cleanup;
  }, []);

  useEffect(() => {
    if (
      activeCategoryId !== 'executive' &&
      activeCategoryId !== 'commitments' &&
      activeCategoryId !== 'flagships' &&
      !visibleCategories.some((category) => category.id === activeCategoryId)
    ) {
      setActiveCategoryId(visibleCategories[0]?.id ?? defaultCategoryId);
    }
  }, [activeCategoryId, visibleCategories]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveCategoryId(getInitialCategory());
      setLocale(getInitialLocale());
      setContactOpen(isContactRoute());
      setContactInitialTab(getContactInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const updateUrlState = (nextLocale = locale, nextCategory = activeCategoryId) => {
    const params = new URLSearchParams(window.location.search);
    if (nextLocale === 'en') {
      params.set('lang', 'en');
    } else {
      params.delete('lang');
    }
    params.delete('category');

    const canonicalPath =
      nextCategory === defaultCategoryId ? '/' : `/${nextCategory}`;
    const queryStr = params.toString();
    const nextUrl = queryStr ? `${canonicalPath}?${queryStr}` : canonicalPath;
    window.history.pushState(null, '', nextUrl);

    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      canonicalLink.setAttribute('href', `https://david888.com${canonicalPath}`);
    }
  };

  const setCategoryAndSyncUrl = (nextCategory: string) => {
    const normalized = normalizeRouteAlias(nextCategory);
    setActiveCategoryId(normalized);
    updateUrlState(localeRef.current, normalized);
  };

  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    updateUrlState(nextLocale, activeCategoryId);
  };

  const changeCategory = (nextCategory: string) => {
    setCategoryAndSyncUrl(nextCategory);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-main transition-colors duration-200">
      <Navbar
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        locale={locale}
        onLocaleChange={changeLocale}
        onContact={() => openContactDialog('tech_chat')}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => {
          if (isSearchOpen) {
            setSearchQuery('');
            setIsSearchOpen(false);
          } else {
            setIsSearchOpen(true);
          }
        }}
      />
      <BentoGrid
        locale={locale}
        activeCategoryId={activeCategoryId}
        onCategoryChange={changeCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        onContact={() => openContactDialog('consulting')}
      />
      {!contactOpen && (
        <FloatingConciergeButton
          locale={locale}
          onClick={() => openContactDialog('consulting', 'chat')}
        />
      )}
      {contactOpen && (
        <ContactDialog
          locale={locale}
          defaultSubjectId={contactDefaultSubjectId}
          initialTab={contactInitialTab}
          onClose={closeContactDialog}
        />
      )}
    </div>
  );
}
