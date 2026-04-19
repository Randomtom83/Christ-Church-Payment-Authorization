'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatDollars } from '@/lib/utils/currency';
import type { DepositItem } from '@/lib/db/deposit-items';

type Props = {
  checks: DepositItem[];
  imageUrls: Record<string, string>;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
};

export function CheckList({ checks, imageUrls, onDelete, readOnly }: Props) {
  if (checks.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-base font-medium text-gray-600">
        {checks.length} check{checks.length !== 1 ? 's' : ''} entered
      </p>
      {checks.map((check) => (
        <Card key={check.id} className="overflow-hidden">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              {/* Check image thumbnail */}
              {check.check_image_path && imageUrls[check.id] ? (
                <a
                  href={imageUrls[check.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 w-16 h-10 rounded border overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrls[check.id]}
                    alt="Check"
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : check.check_image_path === 'pending-upload' ? (
                <div className="shrink-0 w-16 h-10 rounded border bg-yellow-50 flex items-center justify-center text-xs text-yellow-600">
                  Uploading
                </div>
              ) : null}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-900">
                  {formatDollars(parseFloat(check.amount))}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {check.category_label ?? 'Uncategorized'}
                  {check.member_name && ` — ${check.member_name}`}
                  {check.giving_number && ` #${check.giving_number}`}
                </p>
              </div>

              {/* Delete */}
              {!readOnly && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(check.id)}
                  className="shrink-0 h-10 w-10 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center"
                  aria-label="Delete check"
                >
                  ✕
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
