'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

export function CsvExport() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entity, setEntity] = useState('');
  const [status, setStatus] = useState('');

  const handleExport = async () => {
    setError(null);
    setIsExporting(true);

    try {
      const body: Record<string, string> = {};
      if (fromDate) body.fromDate = fromDate;
      if (toDate) body.toDate = toDate;
      if (entity) body.entity = entity;
      if (status) body.status = status;

      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Export failed');
        return;
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '')
        || 'churchops-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        className="h-12 text-base"
        onClick={() => setIsOpen(true)}
      >
        Export CSV
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Export Requisitions</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="h-10 w-10 flex items-center justify-center text-gray-500 hover:text-gray-700"
          aria-label="Close export"
        >
          ✕
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="export-from" className="text-sm font-medium">From</Label>
          <Input
            id="export-from"
            type="date"
            className="h-12 text-base"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="export-to" className="text-sm font-medium">To</Label>
          <Input
            id="export-to"
            type="date"
            className="h-12 text-base"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="export-entity" className="text-sm font-medium">Entity</Label>
          <select
            id="export-entity"
            className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
          >
            <option value="">All</option>
            <option value="church">Christ Church</option>
            <option value="nscc">Nursery School</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="export-status" className="text-sm font-medium">Status</Label>
          <select
            id="export-status"
            className="w-full h-12 rounded-lg border border-gray-200 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="paid">Paid</option>
            <option value="approved">Approved</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <LoadingSpinner className="mr-2 h-5 w-5" />
            Exporting...
          </>
        ) : (
          'Download CSV'
        )}
      </Button>
    </div>
  );
}
