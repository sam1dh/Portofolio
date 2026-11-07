import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';
import { HOBBIES } from '../data/hobbies';
import type { Folders, Item } from './folder-types';

// the "- " bullet lines in each Markdown file become the "what i built / did" list
const bullets = (body?: string) =>
  (body ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim());

export async function getFolders(): Promise<Folders> {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const internships = (await getCollection('internships')).sort((a, b) => a.data.order - b.data.order);

  const projectItems = await Promise.all(
    projects.map(
      async ({ id, data: d, body }): Promise<Item> => ({
        slug: id,
        folder: 'projects',
        icon: d.icon,
        title: d.title,
        subtitle: d.tagline,
        tint: d.tint,
        note: d.badge ? `✦ ${d.badge}` : d.stack.slice(0, 3).join(' · ').toLowerCase(),
        highlight: Boolean(d.badge),
        stat: d.stat,
        statLabel: d.statLabel,
        meta: [
          ['year', d.year],
          ['type', d.type],
          ['my part', d.role],
        ],
        labels: ['the problem', 'what i built', 'how it works', 'stack', 'result'],
        intro: d.problem,
        points: bullets(body),
        flow: d.flow,
        stack: d.stack,
        result: d.result,
        live: d.live,
        code: d.code,
        cover: d.cover ? (await getImage({ src: d.cover, width: 1200 })).src : undefined,
      }),
    ),
  );

  const internshipItems: Item[] = internships.map(
    ({ id, data: d, body }) => ({
      slug: id,
      folder: 'internships',
      icon: d.icon,
      title: d.company,
      subtitle: d.summary,
      tint: d.tint,
      note: d.dates,
      highlight: false,
      stat: d.stat,
      statLabel: d.statLabel,
      meta: [
        ['when', d.dates],
        ['where', d.where],
        ['role', d.role],
      ],
      labels: ['the context', 'what i did', 'how it fits together', 'tools i used', 'what shipped'],
      intro: d.context,
      points: bullets(body),
      flow: d.flow,
      stack: d.tools,
      result: d.shipped,
    }),
  );

  return {
    projects: {
      id: 'projects',
      color: '#9FE1CB',
      title: ['things i', 'built'],
      sub: `${projectItems.length} projects`,
      items: projectItems,
      hobbies: [],
    },
    internships: {
      id: 'internships',
      color: '#B5D4F4',
      title: ["places i've", 'worked'],
      sub: `${internshipItems.length} internships`,
      items: internshipItems,
      hobbies: [],
    },
    hobbies: {
      id: 'hobbies',
      color: '#F4C0D1',
      title: ['things i love', 'besides code'],
      sub: 'off the clock',
      items: [],
      hobbies: HOBBIES,
    },
  };
}
