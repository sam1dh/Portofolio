export const TINT_HEX = {
  mint: { bg: '#E1F5EE', ink: '#085041' },
  blush: { bg: '#FBEAF0', ink: '#72243E' },
  sky: { bg: '#E6F1FB', ink: '#0C447C' },
  peach: { bg: '#FAEEDA', ink: '#633806' },
  leaf: { bg: '#EAF3DE', ink: '#27500A' },
} as const;

export type Tint = keyof typeof TINT_HEX;
