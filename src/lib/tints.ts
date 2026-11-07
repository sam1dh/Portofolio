export const TINTS = {
  mint: { bg: 'bg-mint', ink: 'text-[#085041]' },
  blush: { bg: 'bg-blush', ink: 'text-[#72243E]' },
  sky: { bg: 'bg-sky', ink: 'text-[#0C447C]' },
  peach: { bg: 'bg-peach', ink: 'text-[#633806]' },
  leaf: { bg: 'bg-leaf', ink: 'text-[#27500A]' },
} as const;

export type Tint = keyof typeof TINTS;
