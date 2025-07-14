"use client";

import { useStore } from "@/lib/store";
import { Trash2 } from "lucide-react";

export default function LayersPanel() {
  const {
    annotations,
    selectedAnnotation,
    selectAnnotation,
    deleteAnnotation,
  } = useStore();

  return (
    <div className="fixed top-16 right-4 h-full w-64 bg-gray-200 p-4 pt-12 overflow-y-auto z-10">
      <h2 className="text-lg font-bold mb-4 text-black">Layers</h2>
      <ul>
        {annotations.map((ann, index) => (
          <li
            key={ann.id}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
              ann.id === selectedAnnotation
                ? "bg-blue-500 text-white"
                : "bg-white text-black"
            }`}
            onClick={() => selectAnnotation(ann.id)}
          >
            <span>
              {index + 1}. {ann.type}
            </span>
            <button
              className="p-1 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                deleteAnnotation(ann.id);
              }}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
