"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore, Annotation } from "@/lib/store";

interface AnnotationEditorProps {
  annotation: Annotation;
  onClose: () => void;
}

export default function AnnotationEditor({
  annotation,
  onClose,
}: AnnotationEditorProps) {
  const { updateAnnotation } = useStore();
  const [text, setText] = useState(annotation.text || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(() => {
    updateAnnotation(annotation.id, { text });
    onClose();
  }, [annotation.id, text, updateAnnotation, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSave();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, onClose]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  if (!annotation.x || !annotation.y) return null;

  return (
    <div
      className="absolute"
      style={{
        left: `${annotation.x}px`,
        top: `${annotation.y - 20}px`,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        className="bg-white border border-blue-500 px-1"
        autoFocus
      />
    </div>
  );
}