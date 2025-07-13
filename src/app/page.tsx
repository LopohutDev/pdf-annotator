"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import FileUpload from "@/components/FileUpload";
import Toolbar from "@/components/Toolbar";
import LayersPanel from "@/components/LayersPanel";
import { Loader2 } from "lucide-react";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full">
      <Loader2 className="animate-spin h-12 w-12" />
    </div>
  ),
});

export default function Home() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-md z-10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">PDF Annotator</h1>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <main className="flex-1 overflow-y-auto">
          {file ? (
            <PdfViewer file={file} />
          ) : (
            <FileUpload onFileSelect={setFile} />
          )}
        </main>
        {file && <LayersPanel />}
      </div>
    </div>
  );
}
