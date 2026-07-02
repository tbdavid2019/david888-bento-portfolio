import React from 'react';
import { ExternalLink, Mail, MapPin } from 'lucide-react';
import { CardWrapper } from './cards/CardWrapper';
import profileData from '../data/bento-profile.json';
import { profileContent } from '../data/profile-content';
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
    const content = profileContent[locale];
    const contactLine = locale === 'en' ? profileData.contactLineEn || profileData.contactLine : profileData.contactLine;

    return (
        <CardWrapper className="p-6 md:p-7">
            <div className="flex h-full flex-col">
                <div className="mb-7 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src="/bento/me.jpg"
                            alt={profileData.name}
                            className="h-20 w-20 rounded-3xl object-cover ring-4 ring-[var(--primary)]/70"
                        />
                        <div>
                            <div className="text-xs font-black uppercase tracking-[0.24em] text-text-muted">
                                {profileData.name}
                            </div>
                            <h1 className="mt-2 text-3xl font-black leading-[1.15] text-text-main">
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

                <div className="mb-7 space-y-4 text-[15px] leading-8 text-text-muted">
                    <p className="text-lg font-black leading-8 text-text-main">
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
                    <div className="flex items-center gap-3">
                        <Mail size={16} className="text-text-muted opacity-60" />
                        <a href={`mailto:${profileData.email}`} className="hover:text-text-main">
                            {profileData.email}
                        </a>
                    </div>
                </div>
            </div>
        </CardWrapper>
    );
};
