'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type MemberOption = {
  id: string;
  full_name: string;
  giving_number: string | null;
};

type Props = {
  members: MemberOption[];
  selectedName: string;
  selectedGivingNumber: string;
  onSelect: (name: string, givingNumber: string) => void;
};

export function MemberSearch({ members, selectedName, selectedGivingNumber, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [useManual, setUseManual] = useState(false);

  const filtered = query.length >= 2
    ? members.filter((m) => m.full_name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (member: MemberOption) => {
    onSelect(member.full_name, member.giving_number ?? '');
    setQuery('');
    setIsOpen(false);
    setUseManual(false);
  };

  const handleNotInList = () => {
    setUseManual(true);
    setIsOpen(false);
    onSelect('', '');
  };

  if (selectedName && !useManual) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-medium">Member</Label>
        <div className="flex items-center justify-between h-12 px-4 rounded-lg border border-green-200 bg-green-50">
          <span className="text-lg text-green-900">
            {selectedName} {selectedGivingNumber && `— #${selectedGivingNumber}`}
          </span>
          <button
            type="button"
            onClick={() => { onSelect('', ''); setQuery(''); }}
            className="text-gray-500 hover:text-gray-700 h-10 w-10 flex items-center justify-center"
            aria-label="Change member"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="member-search" className="text-base font-medium">
        Member Name
      </Label>

      {useManual ? (
        <div className="space-y-2">
          <Input
            type="text"
            className="h-12 text-lg"
            placeholder="Type member name"
            value={selectedName}
            onChange={(e) => onSelect(e.target.value, '')}
          />
          <button
            type="button"
            onClick={() => setUseManual(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Search member list instead
          </button>
        </div>
      ) : (
        <div className="relative">
          <Input
            id="member-search"
            type="text"
            className="h-12 text-lg"
            placeholder="Type a few letters to search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(e.target.value.length >= 2);
            }}
            onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
            autoComplete="off"
          />

          {isOpen && (
            <ul className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {filtered.map((m) => (
                <li
                  key={m.id}
                  className="px-4 py-3 text-lg cursor-pointer hover:bg-blue-50"
                  onClick={() => handleSelect(m)}
                >
                  <span className="font-medium">{m.full_name}</span>
                  {m.giving_number && (
                    <span className="text-gray-500 ml-2">— #{m.giving_number}</span>
                  )}
                </li>
              ))}
              {filtered.length === 0 && query.length >= 2 && (
                <li className="px-4 py-3 text-lg text-gray-500">No members found</li>
              )}
              <li
                className="px-4 py-3 text-lg text-blue-600 cursor-pointer hover:bg-blue-50 border-t"
                onClick={handleNotInList}
              >
                Not in list — type name manually
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
