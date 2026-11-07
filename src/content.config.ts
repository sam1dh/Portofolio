import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tint = z.enum(['mint', 'blush', 'sky', 'peach', 'leaf']);

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      icon: z.string().max(3),
      tagline: z.string(),
      year: z.string(),
      type: z.string(),
      role: z.string(),
      order: z.number(),
      tint,
      badge: z.string().optional(),
      problem: z.string(),
      flow: z.array(z.string()),
      stack: z.array(z.string()),
      result: z.string(),
      live: z.string().url().optional(),
      code: z.string().url().optional(),
      cover: image().optional(),
      stat: z.string().optional(),
      statLabel: z.string().optional(),
    }),
});

const internships = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/internships' }),
  schema: z.object({
    company: z.string(),
    icon: z.string().max(3),
    role: z.string(),
    summary: z.string(),
    dates: z.string(),
    where: z.string(),
    order: z.number(),
    tint,
    context: z.string(),
    flow: z.array(z.string()),
    tools: z.array(z.string()),
    shipped: z.string(),
    stat: z.string().optional(),
    statLabel: z.string().optional(),
  }),
});

export const collections = { projects, internships };
