import type { Locale } from '../types';
import profileContentJson from './profile-content.json';

export type ProfileBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'sectionTitle'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'note'; text: string };

export type ProfileLocaleContent = {
  headline: string;
  subHeadline: string;
  body: ProfileBlock[];
};

export const profileContent = profileContentJson as unknown as Record<Locale, ProfileLocaleContent>;

