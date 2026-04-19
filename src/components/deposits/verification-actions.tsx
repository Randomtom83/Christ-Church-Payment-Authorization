'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { verifyDeposit, rejectVerification } from '@/lib/actions/deposits';

type Props = {
  depositId: string;
  currentUserId: string;
  counter1Id: string;
};

export function VerificationActions({ depositId, currentUserId, counter1Id }: Props) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Counter 1 can't verify their own deposit
  if (currentUserId === counter1Id) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <p className="text-lg text-amber-800">
            Waiting for a second counter to verify this deposit.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleVerify = async () => {
    setIsVerifying(true);
    setError(null);
    const result = await verifyDeposit(depositId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Verification failed');
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      setError('Please describe what doesn\'t match');
      return;
    }
    setIsRejecting(true);
    setError(null);

    const formData = new FormData();
    formData.set('notes', rejectNotes);

    const result = await rejectVerification(depositId, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed');
      setIsRejecting(false);
    }
  };

  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-xl text-green-900">Verify This Deposit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}

        <p className="text-lg text-green-800">
          Review the totals above and confirm they match the physical count.
        </p>

        {!showConfirm ? (
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
            onClick={() => setShowConfirm(true)}
          >
            ✓ I Verify This Deposit
          </Button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg bg-green-100 border border-green-300">
            <p className="text-lg text-green-900 font-medium">
              I confirm the digital totals match the physical count.
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? <LoadingSpinner className="h-5 w-5" /> : 'Confirm Verification'}
              </Button>
              <Button variant="outline" size="lg" className="h-14 text-lg"
                onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showReject ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg font-semibold border-orange-300 text-orange-800"
            onClick={() => { setShowReject(true); setShowConfirm(false); }}
          >
            Totals Don&apos;t Match
          </Button>
        ) : (
          <div className="space-y-3 border-t border-green-200 pt-4">
            <Label htmlFor="reject-notes" className="text-base font-medium">
              What doesn&apos;t match?
            </Label>
            <textarea
              id="reject-notes"
              className="w-full h-20 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Describe the discrepancy"
            />
            <div className="flex gap-3">
              <Button variant="outline" size="lg"
                className="flex-1 h-14 text-lg font-semibold border-orange-300 text-orange-800"
                onClick={handleReject} disabled={isRejecting}>
                {isRejecting ? <LoadingSpinner className="h-5 w-5" /> : 'Return for Correction'}
              </Button>
              <Button variant="outline" size="lg" className="h-14 text-lg"
                onClick={() => { setShowReject(false); setRejectNotes(''); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
