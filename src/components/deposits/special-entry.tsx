'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { FUND_CATEGORIES } from '@/lib/constants/fund-categories';

type Props = {
  onSubmit: (data: FormData) => Promise<void>;
};

export function SpecialEntry({ onSubmit }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');

  const handleSubmit = async () => {
    if (!description || !amount || parseFloat(amount) <= 0) return;
    setIsSaving(true);

    const formData = new FormData();
    formData.set('description', description);
    formData.set('amount', amount);
    formData.set('category', category);
    const cat = FUND_CATEGORIES.find((c) => c.value === category);
    formData.set('category_label', cat?.label ?? category);

    await onSubmit(formData);
    setDescription('');
    setAmount('');
    setCategory('other');
    setIsOpen(false);
    setIsSaving(false);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full h-12 text-base"
        onClick={() => setIsOpen(true)}
      >
        + Add Special Item
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-gray-200 bg-white">
      <div className="space-y-2">
        <Label htmlFor="special-desc" className="text-base font-medium">Description</Label>
        <Input id="special-desc" className="h-12 text-lg" value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Loose checks for Building Fund" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="special-amount" className="text-base font-medium">Amount</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-500">$</span>
          <Input id="special-amount" type="text" inputMode="decimal" className="h-12 text-lg pl-8"
            value={amount} onChange={(e) => {
              let val = e.target.value.replace(/[^0-9.]/g, '');
              const parts = val.split('.'); if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
              setAmount(val);
            }} placeholder="0.00" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="special-cat" className="text-base font-medium">Category</Label>
        <select id="special-cat" className="w-full h-12 rounded-lg border border-gray-200 px-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          value={category} onChange={(e) => setCategory(e.target.value)}>
          {FUND_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}
        </select>
      </div>
      <div className="flex gap-3">
        <Button type="button" size="lg" className="flex-1 h-14 text-lg font-semibold" onClick={handleSubmit}
          disabled={!description || !amount || isSaving}>
          {isSaving ? <LoadingSpinner className="h-5 w-5" /> : 'Save'}
        </Button>
        <Button type="button" variant="outline" size="lg" className="h-14 text-lg" onClick={() => setIsOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
