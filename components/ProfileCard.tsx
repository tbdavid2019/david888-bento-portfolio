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
        { value: '4', label: locale === 'en' ? 'Companies founded' : '家公司創業' },
        { value: '111+', label: locale === 'en' ? 'Open source projects' : '開源專案' },
        { value: '9+', label: 'Chrome extensions' },
        { value: '1.10M+', label: locale === 'en' ? 'Monthly social reach' : '單月社群瀏覽' },
    ];
    const headline = locale === 'en' ? profileData.headlineEn || profileData.headline : profileData.headline;
    const subHeadline = locale === 'en' ? profileData.subHeadlineEn || profileData.subHeadline : profileData.subHeadline;
    const bio = locale === 'en' ? profileData.bioEn || profileData.bio : profileData.bio;
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

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
                            <h1 className="text-3xl font-black leading-tight text-slate-950 dark:text-white">
                                {profileData.name}
                            </h1>
                            <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                {headline}
                            </p>
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

                <div className="mb-7 space-y-3 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                        {subHeadline}
                    </p>
                    {bio.slice(0, 5).map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
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
