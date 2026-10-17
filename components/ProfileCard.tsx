import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Briefcase,
  ExternalLink,
  Gamepad2,
  Keyboard,
  MapPin,
  ShieldCheck,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
import { ProfileIntroduction } from './ProfileIntroduction';
import type { Locale } from '../types';

interface ProfileCardProps {
  locale?: Locale;
  onContact?: () => void;
  onSelectRoute?: (routeId: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  locale = 'zh',
  onContact,
  onSelectRoute,
}) => {
  const [isQrGameOpen, setIsQrGameOpen] = useState(false);
  const isEn = locale === 'en';
  const metrics = [
    {
      value: '300+',
      label: isEn ? 'Max Engineering & Tech Org Scale' : '跨國科技與研發組織管理規模',
    },
    {
      value: '70+ Eng',
      label: isEn ? 'Global SAP eCommerce Team Led' : '親帶全球零售 SAP 電商工程軍團',
    },
    {
      value: '5 Flagships',
      label: isEn ? 'Live Production Quant & AI Systems' : '自研生產級量化金融與 AI 主力艦',
    },
    {
      value: '1.10M+',
      label: isEn ? 'Monthly Tech & Media Reach' : '單月技術社群與商業媒體觸及',
    },
  ];
  const engagementPills = isEn
    ? [
        { icon: Briefcase, text: '12-Month Enterprise Advisory Retainer (Fractional CTO)' },
        { icon: Users, text: 'Full-Time CTO / VP of Engineering (Target NT$ 3M+ / Global)' },
        { icon: ShieldCheck, text: 'VC / Board Technical Due Diligence & Architecture Audit' },
      ]
    : [
        { icon: Briefcase, text: '一年期企業技術顧問約 (Annual Retainer / Fractional CTO)' },
        { icon: Users, text: '高階技術長正職 (CTO / VPE · 目標年薪 NT$ 300萬+)' },
        { icon: ShieldCheck, text: '創投與董事會技術盡職調查 (Tech Due Diligence)' },
      ];

  const content = profileContent[locale];
  const contactLine =
    locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

  useEffect(() => {
    if (!isQrGameOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsQrGameOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isQrGameOpen]);

  return (
    <div className="dossier-card p-5 sm:p-7 md:p-8">
      <div className="flex flex-col gap-6">
        {/* Top Executive Identity Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src="/bento/me.jpg"
              alt={profileData.name}
              className="h-20 w-20 shrink-0 rounded-2xl border-2 border-[#17324d] object-cover shadow-sm sm:h-24 sm:w-24 dark:border-[#ffb010]"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-[#a9471d] dark:text-[#ffb010]">
                  {profileData.name} (David888)
                </span>
                <span className="rounded-md border border-[#17324d] bg-[#17324d] px-2.5 py-0.5 text-xs font-extrabold text-[#fff9e8] dark:border-[#ffb010] dark:bg-[#ffb010] dark:text-[#2b251a]">
                  {isEn ? 'OPEN FOR CTO & ANNUAL RETAINER' : '開放年度顧問約 & CTO 高階職缺'}
                </span>
              </div>
              <h1 className="mt-2 max-w-[36ch] text-2xl font-extrabold leading-[1.22] tracking-tight text-text-main sm:text-3xl md:text-[2rem]">
                {content.headline}
              </h1>
            </div>
          </div>

          {/* Primary Executive CTAs */}
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {onContact && (
              <button
                type="button"
                onClick={onContact}
                className="btn-saffron inline-flex min-h-[46px] items-center justify-center gap-2 px-5 py-2.5 text-sm"
              >
                <span>{isEn ? 'Book Advisory / CTO Inquiry' : '洽談年度顧問 / CTO 職缺'}</span>
                <ArrowRight size={16} />
              </button>
            )}
            <a
              href="https://www.linkedin.com/in/david11111/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-[10px] border border-[#17324d] bg-bg-elevated px-4 text-sm font-bold text-text-main no-underline transition-colors hover:bg-[#fff0cc] dark:border-[#ffb010]/60 dark:hover:bg-[#17324d]"
            >
              <ExternalLink size={15} />
              <span>LinkedIn</span>
            </a>
            <button
              type="button"
              onClick={() => setIsQrGameOpen(true)}
              className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-[10px] border border-border bg-bg-elevated px-3.5 text-sm font-bold text-text-main transition-colors hover:border-[#17324d] dark:hover:border-[#ffb010]"
              aria-label={isEn ? 'Open David888 website QR' : '開啟 David888 網站 QR'}
              aria-haspopup="dialog"
            >
              <Gamepad2 size={16} className="text-[#a9471d] dark:text-[#ffb010]" />
              <span>{isEn ? 'Website QR' : '網站 QR'}</span>
            </button>
          </div>
        </div>

        {/* 3 Target Engagement Mandates */}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {engagementPills.map((pill, idx) => {
            const Icon = pill.icon;
            return (
              <div
                key={idx}
                onClick={() => onSelectRoute?.('executive')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectRoute?.('executive');
                  }
                }}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-bg-elevated px-3.5 py-3 text-xs font-extrabold text-text-main transition-colors hover:border-[#17324d] hover:bg-[#fff0cc] sm:text-sm dark:hover:border-[#ffb010] dark:hover:bg-[#17324d]"
              >
                <Icon size={17} className="shrink-0 text-[#17324d] dark:text-[#ffb010]" />
                <span>{pill.text}</span>
              </div>
            );
          })}
        </div>

        {/* 4 Key Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg-elevated p-4 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="border-l-2 border-[#ffb010] pl-3">
              <div className="font-mono text-xl font-extrabold tabular-nums text-text-main sm:text-2xl">
                {metric.value}
              </div>
              <div className="mt-0.5 text-xs font-bold text-text-muted">{metric.label}</div>
            </div>
          ))}
        </div>

        <ProfileIntroduction locale={locale} />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs font-bold text-text-muted sm:text-sm">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#a9471d] dark:text-[#ffb010]" aria-hidden="true" />
            <span>{contactLine}</span>
          </div>
          <div className="font-mono text-xs text-text-muted">
            {isEn
              ? 'Canonical Routes: /executive · /flagships · /finance · /products · /agent-skills'
              : '支援路由直達：/executive · /flagships · /finance · /products · /agent-skills'}
          </div>
        </div>
      </div>

      {isQrGameOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qacman-title"
            onMouseDown={(event) => event.target === event.currentTarget && setIsQrGameOpen(false)}
          >
            <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#17324d] bg-bg-surface p-4 shadow-2xl sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2b251a] bg-[#ffb010] text-[#2b251a]">
                    <Gamepad2 size={19} />
                  </span>
                  <div className="min-w-0">
                    <h2 id="qacman-title" className="truncate text-base font-extrabold text-text-main">
                      {isEn ? 'David888 Website QR' : 'David888 網站 QR'}
                    </h2>
                    <p className="text-xs text-text-muted">
                      {isEn
                        ? 'Scan to open david888.com · WASD to play'
                        : '掃描 QR Code 開啟 david888.com · WASD 可遊玩'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrGameOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:text-text-main"
                  aria-label={isEn ? 'Close game' : '關閉遊戲'}
                >
                  <X size={17} />
                </button>
              </div>

              <div className="aspect-square w-full overflow-hidden rounded-xl border border-border bg-black">
                <iframe
                  src="https://qacman.com/?embed=1&autoplay=1&mute=1&gh=4&q=david888.com"
                  title="David888 website QR code game"
                  className="h-full w-full border-0"
                  allow="autoplay"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone size={14} />
                  {isEn ? 'Scan with your phone' : '手機鏡頭掃碼直達'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Keyboard size={14} />
                  WASD / {isEn ? 'arrow keys' : '方向鍵'}
                </span>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
