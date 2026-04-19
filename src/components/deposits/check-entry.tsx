'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { MemberSearch } from '@/components/deposits/member-search';
import { FUND_CATEGORIES } from '@/lib/constants/fund-categories';
import { compressImage } from '@/hooks/use-camera';

type MemberOption = { id: string; full_name: string; giving_number: string | null };

type Props = {
  members: MemberOption[];
  onSubmit: (data: FormData) => Promise<void>;
};

export function CheckEntry({ members, onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('pledge');
  const [memberName, setMemberName] = useState('');
  const [givingNumber, setGivingNumber] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const isPledge = category === 'pledge';

  const handleImage = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const compressed = await compressImage(files[0]);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setIsSaving(true);

    const formData = new FormData();
    formData.set('amount', amount);
    formData.set('category', category);
    const cat = FUND_CATEGORIES.find((c) => c.value === category);
    formData.set('category_label', cat?.label ?? category);
    if (isPledge && memberName) {
      formData.set('member_name', memberName);
      formData.set('giving_number', givingNumber);
    }
    if (checkNumber) formData.set('check_number', checkNumber);
    if (imageFile) formData.set('check_image', imageFile);

    await onSubmit(formData);

    // Reset form
    setAmount('');
    setCategory('pledge');
    setMemberName('');
    setGivingNumber('');
    setCheckNumber('');
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setIsOpen(false);
    setIsSaving(false);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        size="lg"
        className="w-full h-14 text-lg font-semibold"
        onClick={() => setIsOpen(true)}
      >
        + Add Check
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-white">
      {/* Camera */}
      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full h-14 text-lg font-semibold"
          onClick={() => cameraRef.current?.click()}
        >
          📷 Photograph Check
        </Button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleImage(e.target.files)}
        />
        {imagePreview && (
          <div className="mt-2 relative w-32 h-20 rounded border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Check" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => { setImageFile(null); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(null); }}
              className="absolute top-0 right-0 h-6 w-6 bg-red-600 text-white text-xs rounded-bl flex items-center justify-center"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="check-amount" className="text-base font-medium">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-500">$</span>
          <Input
            id="check-amount"
            type="text"
            inputMode="decimal"
            className="h-12 text-lg pl-8"
            value={amount}
            onChange={(e) => {
              let val = e.target.value.replace(/[^0-9.]/g, '');
              const parts = val.split('.');
              if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
              setAmount(val);
            }}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="check-category" className="text-base font-medium">Category</Label>
        <select
          id="check-category"
          className="w-full h-12 rounded-lg border border-gray-200 px-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {FUND_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Member search (for pledges) */}
      {isPledge && (
        <MemberSearch
          members={members}
          selectedName={memberName}
          selectedGivingNumber={givingNumber}
          onSelect={(name, num) => { setMemberName(name); setGivingNumber(num); }}
        />
      )}

      {/* Check number */}
      <div className="space-y-2">
        <Label htmlFor="check-number" className="text-base font-medium">Check Number (optional)</Label>
        <Input
          id="check-number"
          type="text"
          className="h-12 text-lg"
          value={checkNumber}
          onChange={(e) => setCheckNumber(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          size="lg"
          className="flex-1 h-14 text-lg font-semibold"
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0 || isSaving}
        >
          {isSaving ? <LoadingSpinner className="h-5 w-5" /> : 'Save Check'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-14 text-lg"
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
