'use client';

import { useFormStatus } from 'react-dom';
import { buttonClass } from '@/components/life/ui';

// Asks first: deleting a trip also marks its bookings cancelled.
export function DeleteTripButton({ title }: { title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass} text-sm`}
      onClick={(e) => {
        if (!confirm(`Delete "${title}"? Its flights and hotels are marked cancelled.`)) e.preventDefault();
      }}
    >
      {pending ? 'Deleting…' : 'Delete trip'}
    </button>
  );
}
