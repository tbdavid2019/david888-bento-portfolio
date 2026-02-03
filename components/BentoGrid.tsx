import React from 'react';
import { ProfileCard } from './cards/ProfileCard';
import { BentoLinkCard } from './cards/BentoLinkCard';
import { GithubCard } from './cards/GithubCard';
import { TwitterCard } from './cards/TwitterCard';
import { ExperienceCard } from './cards/ExperienceCard';
import { ProjectCard } from './cards/ProjectCard';
import { TechStackCard } from './cards/TechStackCard';
import { DesignSystemCard } from './cards/DesignSystemCard';
import profileData from '../data/bento-profile.json';
import linksData from '../data/bento-links.json';
import { BentoItem } from '../types';

export const BentoGrid: React.FC = () => {
  const items = linksData as unknown as BentoItem[];

  return (
    <main className="grid grid-cols-1 lg:grid-cols-[minmax(320px,420px)_1fr] gap-8 items-start">
      <div>
        <ProfileCard profile={profileData} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, index) => {
          const colSpanClass = item.colSpan === 2 ? 'sm:col-span-2' : '';

          return (
            <div key={index} className={colSpanClass}>
              {item.type === 'github' && <GithubCard data={item} />}
              {item.type === 'twitter' && <TwitterCard data={item} />}
              {item.type === 'experience' && <ExperienceCard data={item} />}
              {item.type === 'project' && <ProjectCard data={item} />}
              {item.type === 'techstack' && <TechStackCard data={item} />}
              {item.type === 'design-system' && <DesignSystemCard data={item} />}
              {(!item.type || item.type === 'link') && <BentoLinkCard link={item as any} />}
            </div>
          );
        })}
      </div>
    </main>
  );
};
