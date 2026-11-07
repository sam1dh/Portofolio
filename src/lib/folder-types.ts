export type FolderKey = 'projects' | 'internships' | 'hobbies';

export type Item = {
  slug: string;
  folder: 'projects' | 'internships';
  icon: string;
  title: string;
  subtitle: string;
  tint: Tint;
  note: string;
  highlight: boolean;
  stat?: string;
  statLabel?: string;
  meta: [string, string][];
  labels: [string, string, string, string, string];
  intro: string;
  points: string[];
  flow: string[];
  stack: string[];
  result: string;
  live?: string;
  code?: string;
  cover?: string;
};

export type Hobby = { glyph: string; title: string; text: string; bg: string; ink: string };

export type Folder = {
  id: FolderKey;
  color: string;
  title: [string, string];
  sub: string;
  items: Item[];
  hobbies: Hobby[];
};

export type Folders = Record<FolderKey, Folder>;
