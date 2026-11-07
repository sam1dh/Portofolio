import type { Hobby } from '../lib/folder-types';

// to add a hobby, copy one block and change the text and colors
export const HOBBIES: Hobby[] = [
  {
    glyph: '“ ”',
    title: 'debate',
    text: 'Winner of my college debate competition. Give me a topic and a side.',
    bg: '#EEEDFE',
    ink: '#3C3489',
  },
  {
    glyph: '(( · ))',
    title: 'public speaking',
    text: "1st prize at the university public speaking competition. A mic doesn't scare me.",
    bg: '#FBEAF0',
    ink: '#72243E',
  },
  {
    glyph: '{ }',
    title: 'hackathons',
    text: 'SIH internal round winner, SanDisk finalist, and 3rd of 650+ teams at Blostem.',
    bg: '#E1F5EE',
    ink: '#085041',
  },
];
