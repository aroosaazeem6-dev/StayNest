import { useMemo } from 'react';

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

export interface AvailabilityMessageProps {
  status: AvailabilityStatus;
  message?: string | null;
}

/**
 * Renders a small status message for the availability check.
 * Deliberately tiny — kept as a separate component for reuse and testability.
 */
export function AvailabilityMessage({ status, message }: AvailabilityMessageProps) {
  const text = useMemo(() => {
    if (message) return message;
    switch (status) {
      case 'checking':
        return 'Checking availability…';
      case 'available':
        return 'These dates are available.';
      case 'unavailable':
        return 'These dates are not available. Please choose different dates.';
      case 'error':
        return 'Could not check availability. Please try again.';
      default:
        return '';
    }
  }, [status, message]);

  if (status === 'idle' || !text) return null;

  const tone =
    status === 'available'
      ? 'border-green-200 bg-green-50 text-green-700'
      : status === 'unavailable'
        ? 'border-red-200 bg-red-50 text-red-700'
        : status === 'checking'
          ? 'border-gray-200 bg-gray-50 text-gray-600'
          : 'border-red-200 bg-red-50 text-red-700';

  return (
    <p
      role={status === 'error' || status === 'unavailable' ? 'alert' : 'status'}
      className={`rounded-lg border px-3 py-2 text-sm ${tone}`}
    >
      {text}
    </p>
  );
}

export default AvailabilityMessage;