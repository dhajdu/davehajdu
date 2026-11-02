import type { DailyPoint } from '@/lib/life/metrics';
import { zone } from '@/lib/life/health';
import { DayHeat } from './DayHeat';

// Recovery per day in Whoop's three zones.
export function RecoveryHeat({ days, today, weeks = 20 }: { days: DailyPoint[]; today: string; weeks?: number }) {
  const green = days.filter((p) => zone(p.value) === 'green').length;
  const red = days.filter((p) => zone(p.value) === 'red').length;
  return (
    <DayHeat
      days={days}
      today={today}
      weeks={weeks}
      label="Recovery by day"
      unit="%"
      band={(v) => (v >= 84 ? 'is-s4' : v >= 67 ? 'is-s3' : v >= 34 ? 'is-s2' : 'is-s1')}
      legend={[
        { cls: 'is-s1', label: 'under 34%' },
        { cls: 'is-s2', label: '34 to 66%' },
        { cls: 'is-s3', label: '67 to 83%' },
        { cls: 'is-s4', label: '84% and up' },
      ]}
      summary={`${green} green · ${red} red of ${days.length} days`}
    />
  );
}
