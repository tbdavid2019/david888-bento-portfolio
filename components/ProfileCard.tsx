import React from 'react';
import { CardWrapper } from './cards/CardWrapper';
import profileData from '../data/bento-profile.json';

export const ProfileCard: React.FC = () => {
    return (
        <CardWrapper className="col-span-1 md:col-span-1 row-span-2 p-6 flex flex-col">
            {/* Avatar */}
            <div className="mb-8">
                <img
                    src="/bento/me.jpg"
                    alt={profileData.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-primary shadow-sm"
                />
            </div>

            {/* Name & Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                    {profileData.name}
                </h1>
                <p className="text-base font-medium text-slate-600 dark:text-slate-400">
                    {profileData.headline}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2 font-light italic">
                    {profileData.subHeadline}
                </p>
            </div>

            {/* Bio */}
            <div className="flex-1 space-y-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {profileData.bio.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>

            {/* Contact */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Get in touch
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {profileData.contactLine}
                </p>
            </div>

            {/* Threads Link with Image */}
            <a
                href="https://www.threads.net/@david.chinag"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block hover:opacity-80 transition-opacity"
            >
                <img
                    src="/bento/threads.jpg"
                    alt="Threads Profile"
                    className="w-full rounded-lg"
                />
            </a>
        </CardWrapper>
    );
};
