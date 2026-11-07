import { SITE } from '../data/site';

export type Contributions = { total: number; weeks: number[][] }; // each day is a level from 0 to 4

const WEEKS = 26; // last ~6 months fit nicely on the board
let cache: Promise<Contributions> | null = null;

export function getContributions() {
  cache ??= load();
  return cache;
}

async function load(): Promise<Contributions> {
  const token = import.meta.env.GITHUB_TOKEN;
  if (!token || SITE.githubUser === 'your-username') return placeholder();
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{contributionCount}}}}}}',
        variables: { login: SITE.githubUser },
      }),
    });
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) return placeholder();

    const counts: number[][] = cal.weeks
      .slice(-WEEKS)
      .map((w: { contributionDays: { contributionCount: number }[] }) => w.contributionDays.map((d) => d.contributionCount));
    const max = Math.max(1, ...counts.flat());
    return {
      total: cal.totalContributions,
      weeks: counts.map((w) => w.map((c) => (c === 0 ? 0 : Math.min(4, Math.ceil((c / max) * 4))))),
    };
  } catch {
    return placeholder();
  }
}

// a calm, fixed pattern until GitHub is connected
function placeholder(): Contributions {
  const weeks = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => (((w * 7 + d) * 37) % 11) % 5));
  return { total: 0, weeks };
}
