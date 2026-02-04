import React from 'react';
import { CardWrapper } from './cards/CardWrapper';
import profileData from '../data/bento-profile.json';

export const ProfileCard: React.FC = () => {
    return (
        <CardWrapper className="col-span-1 md:col-span-1 row-span-2 p-6 flex flex-col">
            {/* Avatar */}
            <div className="mb-6">
                <img
                    src="/bento/me.jpg"
                    alt={profileData.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-200 dark:border-slate-700"
                />
            </div>

            {/* Name & Title */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {profileData.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    {profileData.headline}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                    {profileData.subHeadline}
                </p>
            </div>

            {/* Bio */}
            <div className="flex-1 space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {profileData.bio.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>

            {/* Contact */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-400">
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
