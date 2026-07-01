import React from 'react';
import { ExternalLink, Mail, MapPin } from 'lucide-react';
import { CardWrapper } from './cards/CardWrapper';
import profileData from '../data/bento-profile.json';
import type { Locale } from '../App';

interface ProfileCardProps {
    locale?: Locale;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ locale = 'zh' }) => {
    const metrics = [
        { value: '4', label: locale === 'en' ? 'Companies founded' : '創業公司' },
        { value: '111+', label: locale === 'en' ? 'Open source projects' : '開源專案' },
        { value: '9+', label: 'Chrome extensions' },
        { value: '1.10M+', label: locale === 'en' ? 'Monthly social reach' : '單月社群瀏覽' },
    ];
    const headline = locale === 'en' ? profileData.headlineEn || profileData.headline : profileData.headline;
    const subHeadline = locale === 'en' ? profileData.subHeadlineEn || profileData.subHeadline : profileData.subHeadline;
    const bio = locale === 'en' ? profileData.bioEn || profileData.bio : profileData.bio;
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;
    const sectionTitles = new Set(['我專注幫你做到三件事：', '代表經歷：', '特別適合以下情境：', '合作方式：']);
    const listItems = new Set([
        '看清技術路線的真實風險與機會',
        '重整破碎的資料流與系統架構',
        '必要時直接進場，帶領團隊把事情做對、做完',
        '準備評估技術團隊的提案，卻需要第二意見把關',
        '系統已出現明顯瓶頸，擔心繼續投資會踩雷',
        '創投機構或投資人需要專業技術盡職調查（Tech Due Diligence），判斷標的物的技術可信度與潛在風險',
    ]);
    const noteItems = new Set([
        '正職｜兼職｜專案顧問（可依專案規模與深度彈性調整）',
        '謝絕博弈、加密貨幣與交易所相關項目。',
    ]);

    return (
        <CardWrapper className="p-6 md:p-7">
            <div className="flex h-full flex-col">
                <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src="/bento/me.jpg"
                            alt={profileData.name}
                            className="h-20 w-20 rounded-3xl object-cover ring-4 ring-primary/70"
                        />
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                {profileData.name}
                            </div>
                            <h1 className="mt-2 text-3xl font-black leading-[1.15] text-slate-950 dark:text-white">
                                {headline}
                            </h1>
                        </div>
                    </div>

                    <a
                        href="https://www.linkedin.com/in/david11111/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-slate-700 transition-all duration-300 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                        aria-label="Open LinkedIn"
                    >
                        <ExternalLink size={17} />
                    </a>
                </div>

                <div className="mb-7 space-y-4 text-[15px] leading-8 text-slate-700 dark:text-slate-300">
                    <p className="text-lg font-black leading-8 text-slate-900 dark:text-white">
                        {subHeadline}
                    </p>
                    <div className="space-y-3">
                        {bio.map((line, index) => {
                            if (sectionTitles.has(line)) {
                                return (
                                    <p key={index} className="pt-2 text-base font-black text-slate-950 dark:text-white">
                                        {line}
                                    </p>
                                );
                            }

                            if (listItems.has(line)) {
                                return (
                                    <div key={index} className="flex items-start gap-3">
                                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{line}</p>
                                    </div>
                                );
                            }

                            if (noteItems.has(line)) {
                                return (
                                    <p key={index} className="font-bold text-slate-900 dark:text-white">
                                        {line}
                                    </p>
                                );
                            }

                            return <p key={index}>{line}</p>;
                        })}
                    </div>
                </div>

                <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-5">
                    {metrics.map((metric) => (
                        <div
                            key={metric.label}
                            className="border-t border-black/10 pt-3 dark:border-white/10"
                        >
                            <div className="font-mono text-2xl font-black text-slate-950 dark:text-white">{metric.value}</div>
                            <div className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto space-y-3 border-t border-black/10 pt-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
                    <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-slate-400" />
                        <span>{contactLine}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail size={16} className="text-slate-400" />
                        <a href={`mailto:${profileData.email}`} className="hover:text-slate-950 dark:hover:text-white">
                            {profileData.email}
                        </a>
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};
