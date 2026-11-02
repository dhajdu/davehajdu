import type { DailyPoint } from '@/lib/life/metrics';
import { DayHeat } from './DayHeat';

// Day strain on Whoop's 0 to 21 scale: light, moderate, high, all out.
export function strainBand(v: number): string {
  return v >= 18 ? 'is-s4' : v >= 14 ? 'is-s3' : v >= 10 ? 'is-s2' : 'is-s1';
}

export function StrainHeat({ days, today, weeks = 20 }: { days: DailyPoint[]; today: string; weeks?: number }) {
  const hard = days.filter((p) => p.value >= 14).length;
  const avg = days.length ? Math.round((days.reduce((s, p) => s + p.value, 0) / days.length) * 10) / 10 : null;
  return (
    <DayHeat
      days={days}
      today={today}
      weeks={weeks}
      label="Strain by day"
      band={strainBand}
      legend={[
        { cls: 'is-s1', label: 'light, under 10' },
        { cls: 'is-s2', label: 'moderate, 10 to 14' },
        { cls: 'is-s3', label: 'high, 14 to 18' },
        { cls: 'is-s4', label: 'all out, 18 and up' },
      ]}
      summary={avg === null ? undefined : `${hard} hard days · avg ${avg}`}
    />
  );
}
