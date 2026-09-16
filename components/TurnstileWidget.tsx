import React, { useEffect, useRef, useState } from 'react';

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

  const resolvedSiteKey =
    siteKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
    '';

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
            if (isMounted) onSuccess(token);
          },
          'expired-callback': () => {
            if (isMounted) onExpire?.();
          },
          'error-callback': (err?: string) => {
            if (isMounted) {
              setLoading(false);
              onError?.(err);
            }
          },
        });
        widgetIdRef.current = id;
        setLoading(false);
      } catch (renderError) {
        console.warn('Failed to render Turnstile widget:', renderError);
        setLoading(false);
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
    <div className={`flex min-h-[65px] flex-col items-center justify-center ${className}`}>
      <div ref={containerRef} />
      {loading && (
        <span className="text-[11px] text-text-muted animate-pulse">
          Cloudflare 安全驗證加載中…
        </span>
      )}
    </div>
  );
};
