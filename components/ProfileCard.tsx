import React from 'react';
import { ExternalLink, MapPin, Mail } from 'lucide-react';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
import { ProfileIntroduction } from './ProfileIntroduction';
import type { Locale } from '../types';

interface ProfileCardProps {
    locale?: Locale;
    onContact?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ locale = 'zh', onContact }) => {
    const metrics = [
        { value: '4', label: locale === 'en' ? 'Companies founded' : '創業公司' },
        { value: '111+', label: locale === 'en' ? 'Open source projects' : '開源專案' },
        { value: '9+', label: 'Chrome extensions' },
        { value: '1.10M+', label: locale === 'en' ? 'Monthly social reach' : '單月社群瀏覽' },
    ];
    const content = profileContent[locale];
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

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
                    {onContact && (
                        <button
                            type="button"
                            onClick={onContact}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-[#231915] transition-transform hover:-translate-y-0.5"
                        >
                            <Mail size={16} />
                            {locale === 'en' ? 'Contact' : '聯絡我'}
                        </button>
                    )}
                    <a
                        href="https://www.linkedin.com/in/david11111/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/25 px-4 text-sm font-bold text-text-main transition-colors hover:bg-white/10"
                    >
                        <ExternalLink size={15} />
                        LinkedIn
                    </a>
                </div>

                <div className="mt-7 flex items-center gap-3 border-t border-white/20 pt-5 text-sm text-text-muted">
                    <MapPin size={16} aria-hidden="true" />
                    <span>{contactLine}</span>
                </div>
            </div>
        </div>
    );
};
