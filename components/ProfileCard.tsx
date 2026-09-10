import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Gamepad2, MapPin, Maximize2, QrCode, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CardWrapper } from './cards/CardWrapper';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
import type { Locale } from '../types';

interface ProfileCardProps {
    locale?: Locale;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ locale = 'zh' }) => {
    const [isExpandedMobile, setIsExpandedMobile] = useState(false);
    const [showQrGame, setShowQrGame] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const metrics = [
        { value: '4', label: locale === 'en' ? 'Companies founded' : '創業公司' },
        { value: '111+', label: locale === 'en' ? 'Open source projects' : '開源專案' },
        { value: '9+', label: 'Chrome extensions' },
        { value: '1.10M+', label: locale === 'en' ? 'Monthly social reach' : '單月社群瀏覽' },
    ];
    const content = profileContent[locale];
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

    return (
        <CardWrapper className="p-5 md:p-7">
            <div className="flex h-full flex-col">
                {/* Profile Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src="/bento/me.jpg"
                            alt={profileData.name}
                            className="h-16 w-16 rounded-2xl object-cover ring-4 ring-[var(--primary)]/70 md:h-20 md:w-20 md:rounded-3xl"
                        />
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted">
                                {profileData.name}
                            </div>
                            <h1 className="mt-1 text-2xl font-black leading-[1.2] text-text-main md:mt-2 md:text-3xl md:leading-[1.15]">
                                {content.headline}
                            </h1>
                        </div>
                    </div>

                    <a
                        href="https://www.linkedin.com/in/david11111/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-text-main transition-all duration-300 hover:opacity-80"
                        aria-label="Open LinkedIn"
                    >
                        <ExternalLink size={17} />
                    </a>
                </div>

                {/* Mobile Toggle Button */}
                <button
                    type="button"
                    onClick={() => setIsExpandedMobile(!isExpandedMobile)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-surface/60 py-2.5 text-xs font-bold text-text-muted transition-colors hover:bg-border/40 hover:text-text-main lg:hidden"
                    aria-expanded={isExpandedMobile}
                >
                    <span>
                        {isExpandedMobile
                            ? (locale === 'en' ? 'Collapse Detailed Bio' : '收起詳細簡介')
                            : (locale === 'en' ? 'Expand Detailed Bio & Experience' : '展開完整經歷與背景')}
                    </span>
                    {isExpandedMobile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Body Content - Always visible on lg+, collapsible on mobile (<lg) */}
                <div className={`${isExpandedMobile ? 'block' : 'hidden'} lg:block`}>
                    <div className="mb-7 mt-6 space-y-4 text-[15px] leading-8 text-text-muted">
                        <p className="text-base font-black leading-7 text-text-main md:text-lg md:leading-8">
                            {content.subHeadline}
                        </p>
                        <div className="space-y-3">
                            {content.body.map((block, index) => {
                                if (block.kind === 'sectionTitle') {
                                    return (
                                        <p key={index} className="pt-2 text-base font-black text-text-main">
                                            {block.text}
                                        </p>
                                    );
                                }

                                if (block.kind === 'bullet') {
                                    return (
                                        <div key={index} className="flex items-start gap-3">
                                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                            <p className="font-bold text-text-main opacity-90">{block.text}</p>
                                        </div>
                                    );
                                }

                                if (block.kind === 'note') {
                                    return (
                                        <p key={index} className="font-bold text-text-main">
                                            {block.text}
                                        </p>
                                    );
                                }

                                return <p key={index}>{block.text}</p>;
                            })}
                        </div>
                    </div>

                    <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-5">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="border-t border-border pt-3"
                            >
                                <div className="font-mono text-2xl font-black text-text-main">{metric.value}</div>
                                <div className="mt-1 text-xs font-semibold text-text-muted">{metric.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto space-y-3 border-t border-border pt-5 text-sm text-text-muted">
                        <div className="flex items-center gap-3">
                            <MapPin size={16} className="text-text-muted opacity-60" />
                            <span>{contactLine}</span>
                        </div>

                        {/* QAC-MAN Eat Beans QR Code - Option B */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setShowQrGame(!showQrGame)}
                                className="group flex w-full items-center justify-between rounded-2xl border border-primary/25 bg-primary/10 p-2.5 text-left transition-all duration-300 hover:border-primary/40 hover:bg-primary/15"
                                aria-expanded={showQrGame}
                            >
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm dark:text-bg-base">
                                        <Gamepad2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-text-main">
                                            <span>{locale === 'en' ? 'QAC-MAN QR Card' : '吃豆人 QR 名片'}</span>
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                            </span>
                                        </div>
                                        <div className="truncate text-[11px] font-semibold text-text-muted">
                                            {locale === 'en' ? 'Playable & scannable to david888.com' : '手機相機可掃描・鍵盤可遊玩'}
                                        </div>
                                    </div>
                                </div>
                                <span className="shrink-0 rounded-full border border-border bg-bg-surface px-2.5 py-0.5 text-[10px] font-black text-text-muted transition-colors group-hover:text-text-main">
                                    {showQrGame ? (locale === 'en' ? 'Hide' : '收起') : (locale === 'en' ? 'Play / Scan' : '展開')}
                                </span>
                            </button>

                            <AnimatePresence>
                                {showQrGame && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-3 rounded-2xl border border-border bg-black/90 p-3 shadow-xl">
                                            <div className="mb-2 flex items-center justify-between px-1 text-xs font-bold text-gray-300">
                                                <div className="flex items-center gap-1.5">
                                                    <QrCode size={14} className="text-primary" />
                                                    <span className="font-mono text-xs">david888.com</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(true)}
                                                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                                                    title={locale === 'en' ? 'Enlarge to popup modal' : '放大視窗遊玩'}
                                                >
                                                    <Maximize2 size={12} />
                                                    <span>{locale === 'en' ? 'Enlarge' : '放大'}</span>
                                                </button>
                                            </div>

                                            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-inner">
                                                <iframe
                                                    src="https://qacman.com/?embed=1&autoplay=1&mute=1&gh=4&q=david888.com"
                                                    title="David888 QAC-MAN Playable QR Code"
                                                    className="h-full w-full border-0"
                                                    loading="lazy"
                                                    allow="autoplay"
                                                />
                                            </div>

                                            <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-gray-400">
                                                <span>📷 手機相機掃碼直達</span>
                                                <span className="font-mono">🎮 WASD / 方向鍵</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* QAC-MAN Enlarge Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
                    role="dialog"
                    aria-modal="true"
                    onMouseDown={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
                >
                    <div className="relative w-full max-w-lg rounded-3xl border border-border bg-bg-surface p-5 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm dark:text-bg-base">
                                    <Gamepad2 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-text-main">
                                        {locale === 'en' ? 'QAC-MAN — Playable QR Maze' : 'QAC-MAN 吃豆人 QR 迷宮'}
                                    </h3>
                                    <p className="text-xs font-semibold text-text-muted">
                                        {locale === 'en' ? 'Target: david888.com (Scan with camera)' : '目標：david888.com（手機相機可直接掃描）'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:text-text-main"
                                aria-label="Close modal"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-black shadow-inner">
                            <iframe
                                src="https://qacman.com/?embed=1&autoplay=1&mute=1&gh=4&q=david888.com"
                                title="David888 QAC-MAN Fullscreen"
                                className="h-full w-full border-0"
                                allow="autoplay"
                            />
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs font-semibold text-text-muted">
                            <span>📱 手機鏡頭對準螢幕即可直達網站</span>
                            <span className="font-mono">🎮 WASD / 方向鍵 / 觸控遊玩</span>
                        </div>
                    </div>
                </div>
            )}
        </CardWrapper>
    );
};
