import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  reason: string;
  requisitionId: string;
  isSubmitter: boolean;
};

export function ReturnBanner({ reason, requisitionId, isSubmitter }: Props) {
  return (
    <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-3">
      <p className="text-lg font-semibold text-orange-800">
        ↩ This requisition was returned
      </p>
      <p className="text-base text-orange-700">{reason}</p>
      {isSubmitter && (
        <Link href={`/requisitions/${requisitionId}/edit`}>
          <Button
            variant="outline"
            size="lg"
            className="h-14 w-full text-lg font-semibold border-orange-300 text-orange-800 hover:bg-orange-100"
          >
            Edit & Resubmit
          </Button>
        </Link>
      )}
    </div>
  );
}
