import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Gamepad2, Keyboard, MapPin, Smartphone, X } from 'lucide-react';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
import { ProfileIntroduction } from './ProfileIntroduction';
import type { Locale } from '../types';

interface ProfileCardProps {
    locale?: Locale;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ locale = 'zh' }) => {
    const [isQrGameOpen, setIsQrGameOpen] = useState(false);
    const metrics = [
        { value: '4', label: locale === 'en' ? 'Companies founded' : '創業公司' },
        { value: '111+', label: locale === 'en' ? 'Open source projects' : '開源專案' },
        { value: '9+', label: 'Chrome extensions' },
        { value: '1.10M+', label: locale === 'en' ? 'Monthly social reach' : '單月社群瀏覽' },
    ];
    const content = profileContent[locale];
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

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
        <div className="profile-panel mx-auto max-w-2xl">
            <div className="flex flex-col">
                {/* Profile Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src="/bento/me.jpg"
                            alt={profileData.name}
                            className="h-16 w-16 rounded-full object-cover ring-2 ring-white/35 md:h-20 md:w-20 lg:h-16 lg:w-16 xl:h-20 xl:w-20"
                        />
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted">
                                {profileData.name}
                            </div>
                            <h1 className="mt-1 text-2xl font-black leading-[1.2] text-text-main md:mt-2 md:text-3xl md:leading-[1.15] lg:text-2xl xl:text-3xl">
                                {content.headline}
                            </h1>
                        </div>
                    </div>

                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5">
                    {metrics.map((metric) => (
                        <div key={metric.label} className="border-t border-border pt-3">
                            <div className="font-mono text-2xl font-black text-text-main">{metric.value}</div>
                            <div className="mt-1 text-xs font-semibold text-text-muted">{metric.label}</div>
                        </div>
                    ))}
                </div>

                <ProfileIntroduction locale={locale} />

                <div className="mt-7 grid grid-cols-2 gap-3">
                    <a
                        href="https://www.linkedin.com/in/david11111/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-4 text-sm font-bold text-text-main transition-colors hover:bg-white/10"
                    >
                        <ExternalLink size={15} />
                        LinkedIn
                    </a>
                    <button
                        type="button"
                        onClick={() => setIsQrGameOpen(true)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-3 text-sm font-bold text-text-main transition-colors hover:bg-white/10"
                        aria-label={locale === 'en' ? 'Open David888 website QR' : '開啟 David888 網站 QR'}
                        aria-haspopup="dialog"
                    >
                        <Gamepad2 size={16} className="text-primary" />
                        {locale === 'en' ? 'Website QR' : '網站 QR'}
                    </button>
                </div>

                <div className="mt-7 flex items-center gap-3 border-t border-white/20 pt-5 text-sm text-text-muted">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{contactLine}</span>
                </div>
            </div>

            {isQrGameOpen && createPortal((
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="qacman-title"
                    onMouseDown={(event) => event.target === event.currentTarget && setIsQrGameOpen(false)}
                >
                    <div className="relative w-full max-w-lg rounded-2xl border border-border bg-bg-surface p-4 shadow-2xl sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white dark:text-bg-base">
                                    <Gamepad2 size={19} />
                                </span>
                                <div className="min-w-0">
                                    <h2 id="qacman-title" className="truncate text-base font-black text-text-main">
                                        {locale === 'en' ? 'David888 Website QR' : 'David888 網站 QR'}
                                    </h2>
                                    <p className="text-xs text-text-muted">
                                        {locale === 'en' ? 'Scan to open david888.com · WASD to play' : '掃描 QR Code 開啟 david888.com · WASD 可遊玩'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQrGameOpen(false)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:text-text-main"
                                aria-label={locale === 'en' ? 'Close game' : '關閉遊戲'}
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
                            <span className="inline-flex items-center gap-1.5"><Smartphone size={14} />{locale === 'en' ? 'Scan with your phone' : '手機鏡頭掃碼直達'}</span>
                            <span className="inline-flex items-center gap-1.5"><Keyboard size={14} />WASD / {locale === 'en' ? 'arrow keys' : '方向鍵'}</span>
                        </div>
                    </div>
                </div>
            ), document.body)}
        </div>
    );
};
