import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, ShieldAlert, ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          action?: string;
          theme?: 'auto' | 'light' | 'dark';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  action?: string;
  onSuccess: (token: string) => void;
  onError?: (error?: string) => void;
  onExpire?: () => void;
  className?: string;
}

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  siteKey,
  action = 'contact',
  onSuccess,
  onError,
  onExpire,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'));

  const resolvedSiteKey =
    siteKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
    '0x4AAAAAAEvqf7unH6MrhIv2';

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        const isDark = document.documentElement.classList.contains('dark');
        const id = window.turnstile.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          action,
          theme: isDark ? 'dark' : 'light',
          callback: (token: string) => {
            if (isMounted) {
              setLoading(false);
              setHasError(false);
              onSuccess(token);
            }
          },
          'expired-callback': () => {
            if (isMounted) onExpire?.();
          },
          'error-callback': (err?: string) => {
            if (isMounted) {
              console.warn('[Turnstile] Verification failed or domain rejected:', err);
              setLoading(false);
              setHasError(true);
              onError?.(err);
            }
          },
        });
        widgetIdRef.current = id;
        setLoading(false);
      } catch (renderError) {
        console.warn('Failed to render Turnstile widget:', renderError);
        setLoading(false);
        setHasError(true);
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector(
        'script[src*="challenges.cloudflare.com/turnstile"]',
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src =
          'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) renderWidget();
        };
        script.onerror = () => {
          if (isMounted) {
            setLoading(false);
            setHasError(true);
            onError?.('Script load error');
          }
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(interval);
            if (isMounted) renderWidget();
          }
        }, 100);
        return () => clearInterval(interval);
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    };
  }, [resolvedSiteKey, action, onSuccess, onError, onExpire]);

  if (!resolvedSiteKey) return null;

  return (
    <div className={`flex min-h-[52px] flex-col items-center justify-center rounded-2xl border border-border/40 bg-bg-elevated/30 p-2.5 transition-all ${className}`}>
      <div ref={containerRef} className={hasError ? 'hidden' : ''} />
      {loading && !hasError && (
        <div className="flex items-center gap-2 text-xs text-text-muted animate-pulse">
          <LoaderCircle size={14} className="animate-spin text-primary" />
          <span>Cloudflare 安全驗證加載中…</span>
        </div>
      )}
      {hasError && isLocalhost && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          <ShieldAlert size={16} className="shrink-0 text-amber-500" />
          <span>
            本機測試提示：請於 Cloudflare 後台將 <code className="font-mono font-bold">localhost</code> 加入 Turnstile Domains 白名單
          </span>
        </div>
      )}
      {hasError && !isLocalhost && (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <ShieldCheck size={16} className="shrink-0 text-primary" />
          <span>人機安全性驗證中</span>
        </div>
      )}
    </div>
  );
};
