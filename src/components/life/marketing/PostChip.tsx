import { Chip } from '@/components/life/ui';
import { STATUS_LABEL, type PostStatus } from '@/lib/blog/publish';

const TONE: Record<PostStatus, 'gray' | 'navy' | 'blue' | 'mint' | 'magenta'> = {
  idea: 'gray',
  drafted: 'blue',
  approved: 'magenta',
  scheduled: 'navy',
  published: 'mint',
  skipped: 'gray',
};

export function StatusChip({ status }: { status: PostStatus }) {
  return <Chip tone={TONE[status]}>{STATUS_LABEL[status]}</Chip>;
}
