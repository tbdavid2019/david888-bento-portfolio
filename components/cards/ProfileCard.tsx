import React from 'react';
import { Download, Mail } from 'lucide-react';
import { CardWrapper } from './CardWrapper';

interface ProfileData {
  name: string;
  avatar?: string | null;
  avatarSource?: string | null;
  bio: string[];
  contactLine?: string | null;
  email?: string | null;
}

interface ProfileCardProps {
  profile: ProfileData;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => {
  const avatar = profile.avatar || profile.avatarSource || '';
  return (
    <CardWrapper className="justify-between">
      <div>
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full mb-8 overflow-hidden p-[2px]">
            <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-800">
                <img 
                    src={avatar}
                    alt={`${profile.name} avatar`}
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-slate-900 dark:text-white">
          {profile.name}
        </h1>
        <div className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8 max-w-lg space-y-3">
          {profile.bio.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        {profile.contactLine ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {profile.contactLine}
          </p>
        ) : null}
      </div>

      <div className="flex items-center space-x-3">
        <button className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white">
          <Download size={18} />
          <span>Download CV</span>
        </button>
        {profile.email ? (
          <a
            className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 w-11 h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            href={`mailto:${profile.email}`}
            aria-label={`Email ${profile.name}`}
          >
            <Mail size={20} />
          </a>
        ) : (
          <button className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 w-11 h-11 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Mail size={20} />
          </button>
        )}
      </div>
    </CardWrapper>
  );
};
