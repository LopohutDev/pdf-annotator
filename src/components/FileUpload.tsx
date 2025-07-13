"use client";

import { Upload } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="w-12 h-12 text-gray-400" />
        <p className="mt-4 text-lg text-gray-600">
          Drag and drop your PDF here
        </p>
        <p className="mt-1 text-sm text-gray-500">or</p>
        <label className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer">
          Browse for a file
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={(e) => {
              if (e.target.files) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}
