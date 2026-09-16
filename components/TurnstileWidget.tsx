import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string;
          action?: string;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'flexible' | 'compact';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
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

  // Store callbacks in stable refs so re-renders in parent won't trigger re-mount
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const resolvedSiteKey =
    siteKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURNSTILE_SITE_KEY) ||
    '0x4AAAAAAEvqf7unH6MrhIv2';

  useEffect(() => {
    let isMounted = true;

    const render = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        const isDark = document.documentElement.classList.contains('dark');
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: resolvedSiteKey,
          action,
          theme: isDark ? 'dark' : 'light',
          size: 'normal',
          callback: (token: string) => {
            if (isMounted) onSuccessRef.current?.(token);
          },
          'error-callback': (err?: string) => {
            console.warn('[Turnstile] verification error:', err);
            if (isMounted) onErrorRef.current?.(err);
          },
          'expired-callback': () => {
            if (isMounted) onExpireRef.current?.();
          },
        });
      } catch (err) {
        console.warn('[Turnstile] render error:', err);
      }
    };

    if (window.turnstile) {
      render();
    } else {
      // Poll every 50ms until script loaded from index.html is ready
      const timer = setInterval(() => {
        if (window.turnstile) {
          clearInterval(timer);
          render();
        }
      }, 50);

      return () => {
        clearInterval(timer);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {}
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [resolvedSiteKey, action]);

  if (!resolvedSiteKey) return null;

  return (
    <div className={`my-2 flex min-h-[65px] w-full items-center justify-center ${className}`}>
      {/* Cloudflare Turnstile Native Widget Container */}
      <div ref={containerRef} className="flex min-h-[65px] min-w-[300px] justify-center" />
    </div>
  );
};
