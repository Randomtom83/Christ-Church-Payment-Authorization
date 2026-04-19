'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { approveRequisition, rejectRequisition } from '@/lib/actions/approvals';
import { formatDollars } from '@/lib/utils/currency';
import { DUAL_APPROVAL_THRESHOLD } from '@/lib/constants';

type Props = {
  requisitionId: string;
  payeeName: string;
  amount: string;
  currentUserId: string;
  submittedBy: string;
  status: string;
  existingApprovalsByUser: boolean;
  approvedCount: number;
};

export function SignerActions({
  requisitionId,
  payeeName,
  amount,
  currentUserId,
  submittedBy,
  status,
  existingApprovalsByUser,
  approvedCount,
}: Props) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Don't show actions if not eligible
  if (status !== 'pending_approval') return null;
  if (currentUserId === submittedBy) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-4">
          <p className="text-base text-gray-600">
            You cannot approve a requisition you submitted.
          </p>
        </CardContent>
      </Card>
    );
  }
  if (existingApprovalsByUser) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <p className="text-base text-green-800">
            ✓ You have already signed this requisition.
          </p>
        </CardContent>
      </Card>
    );
  }

  const amountNum = parseFloat(amount);
  const required = amountNum >= DUAL_APPROVAL_THRESHOLD ? 2 : 1;

  let prompt = 'Your signature is needed';
  if (required === 2 && approvedCount === 0) {
    prompt = 'First signature needed (2 required)';
  } else if (required === 2 && approvedCount === 1) {
    prompt = 'Second signature needed';
  }

  const handleApprove = async () => {
    setError(null);
    setIsApproving(true);

    const result = await approveRequisition(requisitionId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Approval failed');
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.length < 10) {
      setError('Please provide at least 10 characters explaining the rejection');
      return;
    }
    setError(null);
    setIsRejecting(true);

    const formData = new FormData();
    formData.set('reason', rejectReason);

    const result = await rejectRequisition(requisitionId, formData);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Rejection failed');
      setIsRejecting(false);
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-xl text-blue-900">{prompt}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3" role="alert">
            <p className="text-base text-red-800">{error}</p>
          </div>
        )}

        {/* Approve flow */}
        {!showConfirm ? (
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
            onClick={() => setShowConfirm(true)}
          >
            ✓ Approve
          </Button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-lg text-green-900">
              Approve payment of <strong>{formatDollars(amount)}</strong> to <strong>{payeeName}</strong>?
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg font-semibold bg-green-700 hover:bg-green-800"
                onClick={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  'Confirm Approval'
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={() => setShowConfirm(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reject flow */}
        {!showRejectForm ? (
          <Button
            variant="outline"
            size="lg"
            className="w-full h-14 text-lg font-semibold border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => { setShowRejectForm(true); setShowConfirm(false); }}
          >
            ✕ Reject
          </Button>
        ) : (
          <div className="space-y-3 border-t border-blue-200 pt-4">
            <Label htmlFor="reject_reason" className="text-base font-medium">
              Why are you rejecting this?
            </Label>
            <textarea
              id="reject_reason"
              className="w-full h-24 rounded-lg border border-gray-200 px-4 py-3 text-lg resize-y focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Minimum 10 characters"
            />
            <p className="text-sm text-gray-500">{rejectReason.length}/10 characters minimum</p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                size="lg"
                className="flex-1 h-14 text-lg font-semibold"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  'Confirm Rejection'
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-14 text-lg"
                onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                disabled={isRejecting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
