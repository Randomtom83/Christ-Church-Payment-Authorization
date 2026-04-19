'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { compressImage, validateFileSize } from '@/hooks/use-camera';

type FileUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  error?: string;
};

const ACCEPTED = '.jpg,.jpeg,.png,.heic,.heif,.webp,.pdf';

export function FileUpload({ files, onChange, maxFiles = 10, error }: FileUploadProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (selected: FileList | null) => {
    if (!selected) return;
    setFileError(null);

    const newFiles: File[] = [];
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i];

      // Validate size
      const sizeError = validateFileSize(file);
      if (sizeError) {
        setFileError(sizeError);
        continue;
      }

      // Compress images
      const processed = await compressImage(file);
      newFiles.push(processed);
    }

    const total = [...files, ...newFiles].slice(0, maxFiles);
    onChange(total);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const previews = files.map((file, index) => {
    const isImage = file.type.startsWith('image/');
    const url = isImage ? URL.createObjectURL(file) : null;
    return { file, index, isImage, url };
  });

  return (
    <div className="space-y-3">
      <label className="text-base font-medium block">
        Backup Documentation
      </label>

      <div className="flex gap-3">
        {/* Camera button — prominent on mobile */}
        <Button
          type="button"
          variant="outline"
          className="h-14 flex-1 text-lg font-semibold"
          onClick={() => cameraRef.current?.click()}
        >
          📷 Take Photo
        </Button>

        {/* File browse button */}
        <Button
          type="button"
          variant="outline"
          className="h-14 flex-1 text-lg font-semibold"
          onClick={() => fileRef.current?.click()}
        >
          📎 Choose File
        </Button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error messages */}
      {(fileError || error) && (
        <p className="text-sm text-red-700" role="alert">
          {fileError || error}
        </p>
      )}

      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map(({ file, index, isImage, url }) => (
            <div
              key={index}
              className="relative rounded-lg border border-gray-200 overflow-hidden aspect-square bg-gray-50 flex items-center justify-center"
            >
              {isImage && url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-2xl">📄</span>
                  <p className="text-xs text-gray-600 truncate mt-1">{file.name}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center text-sm font-bold shadow"
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        JPG, PNG, HEIC, or PDF. Max 5MB per file.
      </p>
    </div>
  );
}
