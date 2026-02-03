export type CardType = 'link' | 'github' | 'twitter' | 'project' | 'experience' | 'techstack' | 'design-system';

export interface BaseCard {
    type: CardType;
    colSpan?: 1 | 2;
}

export interface LinkCardData extends BaseCard {
    type: 'link';
    title: string;
    url: string;
    image?: string | null;
    imageSource?: string | null;
}

export interface GithubCardData extends BaseCard {
    type: 'github';
    title?: string;
    username: string; // e.g., "tbdavid2019"
    repoCount?: number;
    url: string; // e.g., "https://github.com/tbdavid2019"
}

export interface TwitterCardData extends BaseCard {
    type: 'twitter';
    title?: string;
    username: string; // e.g., "@david_dev"
    url: string;
}

export interface ExperienceCardData extends BaseCard {
    type: 'experience';
    yearRange: string; // e.g., "3+ Years"
    description: string;
    history: Array<{
        name: string;
        hasSeparator?: boolean;
    }>;
}

export interface ProjectCardData extends BaseCard {
    type: 'project';
    label?: string; // e.g., "Featured Project"
    title: string;
    description: string;
    linkText?: string;
    url?: string;
    previewImage?: string;
}

export interface TechStackCardData extends BaseCard {
    type: 'techstack';
    title?: string;
    subtitle?: string;
    // Tech stack tools could be complex, for now assume they are static/hardcoded logic or could be extended later
    // We can add a list of tools if needed, but for now the design might be fixed.
    // Let's add basic configuration if we want customization, but the user plan mentioned passing "tools list".
    // Re-reading plan: "Accept tools list".
}

export interface DesignSystemCardData extends BaseCard {
    type: 'design-system';
    title: string;
    subtitle: string;
    url?: string;
}

export type BentoItem =
    | LinkCardData
    | GithubCardData
    | TwitterCardData
    | ExperienceCardData
    | ProjectCardData
    | TechStackCardData
    | DesignSystemCardData;
