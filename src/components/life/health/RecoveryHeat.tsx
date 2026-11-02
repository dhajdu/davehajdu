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
      band={(v) => `is-${zone(v)}`}
      legend={[
        { cls: 'is-green', label: '67% and up' },
        { cls: 'is-yellow', label: '34 to 66%' },
        { cls: 'is-red', label: 'under 34%' },
      ]}
      summary={`${green} green · ${red} red of ${days.length} days`}
    />
  );
}
