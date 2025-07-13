"use client";

import { useStore, Annotation } from "@/lib/store";

interface ContextMenuProps {
  annotation: Annotation;
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
}

export default function ContextMenu({
  annotation,
  x,
  y,
  onClose,
  onEdit,
}: ContextMenuProps) {
  const { deleteAnnotation } = useStore();

  const handleDelete = () => {
    deleteAnnotation(annotation.id);
    onClose();
  };

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  return (
    <div
      className="absolute bg-white border border-gray-300 rounded-md shadow-lg z-20"
      style={{ top: y, left: x }}
    >
      <ul className="py-1">
        {annotation.type === "text" && (
          <li
            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            onClick={handleEdit}
          >
            Edit
          </li>
        )}
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
          onClick={handleDelete}
        >
          Delete
        </li>
      </ul>
    </div>
  );
}
