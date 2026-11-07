// short, verified facts. one per day, the same for every visitor.
export const TECH_FACTS = [
  "the first computer 'bug' was a real moth, taped into a logbook in 1947.",
  'python is named after monty python, not the snake.',
  "javascript's first version was written in about 10 days in 1995.",
  "the first website went live at cern in 1991. it's still online.",
  'git was created by linus torvalds in 2005.',
  '"hello, world" became a tradition through brian kernighan\'s tutorials.',
  "the word 'robot' comes from karel čapek's 1920 play r.u.r.",
  "ada lovelace published what's seen as the first program in 1843.",
  'the transformer behind modern llms comes from a 2017 paper.',
  "'artificial intelligence' was coined for a 1956 dartmouth workshop.",
  "linux began in 1991 as linus torvalds' hobby project.",
  'the first computer mouse, built in the 1960s, had a wooden shell.',
  'unix time counts seconds since 1 january 1970.',
  'ray tomlinson picked the @ sign for email addresses in 1971.',
  'eliza, one of the first chatbots, was built at mit in the 1960s.',
  'grace hopper built one of the first compilers, a-0, in 1952.',
  "bell labs' 'audrey' (1952) could recognise spoken digits.",
  "ibm's shoebox (1962) understood 16 spoken words.",
  "32-bit unix time overflows in 2038: the 'year 2038 problem'.",
  'the qwerty layout dates back to typewriters from the 1870s.',
];

// picks by the date in pune, so the fact changes at midnight ist
export function factForToday(d = new Date()) {
  const [y, m, day] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })
    .format(d)
    .split('-')
    .map(Number);
  const n = Math.floor(Date.UTC(y, m - 1, day) / 86_400_000);
  return TECH_FACTS[n % TECH_FACTS.length];
}
