'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDollars } from '@/lib/utils/currency';

type Props = {
  totalChecks: number;
  checkCount: number;
  totalCash: number;
  totalDeposit: number;
};

export function DepositSlipInfo({ totalChecks, checkCount, totalCash, totalDeposit }: Props) {
  const [copied, setCopied] = useState(false);

  const text = [
    `Checks: ${formatDollars(totalChecks)} (${checkCount} checks)`,
    `Cash: ${formatDollars(totalCash)}`,
    `Total Deposit: ${formatDollars(totalDeposit)}`,
  ].join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-xl">Bank Deposit Slip</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-lg">
          <span>Checks ({checkCount})</span>
          <span className="font-semibold">{formatDollars(totalChecks)}</span>
        </div>
        <div className="flex justify-between text-lg">
          <span>Cash</span>
          <span className="font-semibold">{formatDollars(totalCash)}</span>
        </div>
        <div className="flex justify-between text-2xl font-bold border-t pt-3">
          <span>Total Deposit</span>
          <span>{formatDollars(totalDeposit)}</span>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={handleCopy}
        >
          {copied ? '✓ Copied!' : 'Copy to Clipboard'}
        </Button>
      </CardContent>
    </Card>
  );
}
