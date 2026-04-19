'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type SelectOption = {
  value: string;
  label: string;
  group?: string;
};

type SearchableSelectProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string, option?: SelectOption) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  groupBy?: boolean;
  disabled?: boolean;
};

export function SearchableSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  required,
  error,
  groupBy,
  disabled,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Display the selected option's label
  const selectedOption = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  // Group filtered options
  const grouped = groupBy
    ? filtered.reduce<Record<string, SelectOption[]>>((acc, opt) => {
        const group = opt.group ?? 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
      }, {})
    : null;

  // Flat list for keyboard navigation
  const flatList = grouped
    ? Object.values(grouped).flat()
    : filtered;

  const handleSelect = useCallback(
    (option: SelectOption) => {
      onChange(option.value, option);
      setQuery('');
      setIsOpen(false);
      setHighlightIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, flatList.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < flatList.length) {
          handleSelect(flatList[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const errorId = `${id}-error`;

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label htmlFor={id} className="text-base font-medium">
        {label}
        {required && ' (required)'}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          className="h-12 text-lg"
          placeholder={isOpen ? placeholder : selectedOption?.label ?? placeholder}
          value={isOpen ? query : selectedOption?.label ?? ''}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            setQuery('');
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={!!error}
          autoComplete="off"
          disabled={disabled}
        />
        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700"
            onClick={() => {
              onChange('');
              setQuery('');
              setIsOpen(false);
            }}
            aria-label="Clear selection"
          >
            ✕
          </button>
        )}

        {/* Dropdown */}
        {isOpen && flatList.length > 0 && (
          <ul
            id={`${id}-listbox`}
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {grouped
              ? Object.entries(grouped).map(([group, items]) => (
                  <li key={group} role="presentation">
                    <div className="px-3 py-2 text-sm font-semibold text-gray-500 bg-gray-50 sticky top-0">
                      {group}
                    </div>
                    {items.map((opt) => {
                      const idx = flatList.indexOf(opt);
                      return (
                        <div
                          key={opt.value}
                          role="option"
                          aria-selected={opt.value === value}
                          className={`px-4 py-3 text-lg cursor-pointer ${
                            idx === highlightIndex
                              ? 'bg-blue-100 text-blue-900'
                              : opt.value === value
                                ? 'bg-blue-50'
                                : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelect(opt)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                        >
                          {opt.label}
                        </div>
                      );
                    })}
                  </li>
                ))
              : flatList.map((opt, idx) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    className={`px-4 py-3 text-lg cursor-pointer ${
                      idx === highlightIndex
                        ? 'bg-blue-100 text-blue-900'
                        : opt.value === value
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    {opt.label}
                  </li>
                ))}
          </ul>
        )}

        {isOpen && flatList.length === 0 && query && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg px-4 py-3 text-lg text-gray-500">
            No results found
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
