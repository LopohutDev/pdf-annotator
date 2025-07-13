"use client";

import {
  Pen,
  Type,
  MousePointer,
  Octagon,
  RectangleHorizontal,
  Circle,
  Save,
  Trash2,
  Undo,
  Redo,
  Eraser,
  Highlighter,
  ArrowUpRight,
} from "lucide-react";
import { useStore, Tool } from "@/lib/store";
import { TwitterPicker } from "react-color";
import { useState, ReactElement } from "react";
import Tooltip from "./Tooltip";

export default function Toolbar() {
  const {
    tool,
    setTool,
    selectedAnnotation,
    deleteAnnotation,
    clearAnnotations,
    undo,
    redo,
    history,
    historyIndex,
    color,
    setColor,
    strokeWidth,
    setStrokeWidth,
    fontSize,
    setFontSize,
  } = useStore();
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools: { name: Tool; icon: ReactElement; tooltip: string }[] = [
    { name: "pen", icon: <Pen />, tooltip: "Pen" },
    { name: "highlighter", icon: <Highlighter />, tooltip: "Highlighter" },
    { name: "text", icon: <Type />, tooltip: "Text" },
    { name: "arrow", icon: <ArrowUpRight />, tooltip: "Arrow" },
    { name: "polygon", icon: <Octagon />, tooltip: "Polygon" },
    { name: "rectangle", icon: <RectangleHorizontal />, tooltip: "Rectangle" },
    { name: "circle", icon: <Circle />, tooltip: "Circle" },
    { name: "select", icon: <MousePointer />, tooltip: "Select" },
  ];

  const strokeWidths = [2, 4, 6, 10, 14];
  const fontSizes = [12, 16, 20, 24];

  const handleSave = () => {
    const saveEvent = new CustomEvent("save-pdf");
    window.dispatchEvent(saveEvent);
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col items-center p-4 space-y-4 bg-gray-200 overflow-y-auto">
      {tools.map((t) => (
        <Tooltip key={t.name} text={t.tooltip}>
          <button
            className={`p-2 rounded-md ${
              tool === t.name ? "bg-blue-500 text-white" : "bg-white text-black"
            }`}
            onClick={() => setTool(t.name)}
          >
            {t.icon}
          </button>
        </Tooltip>
      ))}
      <div className="my-2 border-t border-gray-300 w-full" />
      <div className="relative">
        <Tooltip text="Color">
          <button
            className="p-2 rounded-md bg-white"
            onClick={() => setShowColorPicker(!showColorPicker)}
          >
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: color }}
            />
          </button>
        </Tooltip>
        {showColorPicker && (
          <div className="absolute left-full ml-2 top-0 z-10">
            <TwitterPicker
              color={color}
              onChangeComplete={(c) => {
                setColor(c.hex);
                setShowColorPicker(false);
              }}
            />
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        {strokeWidths.map((width) => (
          <Tooltip key={width} text={`Stroke: ${width}`}>
            <button
              className={`p-2 rounded-md ${
                strokeWidth === width ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => setStrokeWidth(width)}
            >
              {width}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="flex space-x-2">
        {fontSizes.map((size) => (
          <Tooltip key={size} text={`Font Size: ${size}`}>
            <button
              className={`p-2 rounded-md ${
                fontSize === size ? "bg-blue-500 text-white" : "bg-white"
              }`}
              onClick={() => setFontSize(size)}
            >
              {size}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="my-2 border-t border-gray-300 w-full" />
      <Tooltip text="Undo">
        <button
          className="p-2 rounded-md bg-white disabled:opacity-50"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo className={canUndo ? "" : "text-gray-400"} />
        </button>
      </Tooltip>
      <Tooltip text="Redo">
        <button
          className="p-2 rounded-md bg-white disabled:opacity-50"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo className={canRedo ? "" : "text-gray-400"} />
        </button>
      </Tooltip>
      <div className="my-2 border-t border-gray-300 w-full" />
      <Tooltip text="Save to PDF">
        <button
          className="p-2 bg-green-500 text-white rounded-md"
          onClick={handleSave}
        >
          <Save />
        </button>
      </Tooltip>
      <Tooltip text="Delete Selected">
        <button
          className="p-2 bg-red-500 text-white rounded-md disabled:opacity-50"
          onClick={() => selectedAnnotation && deleteAnnotation(selectedAnnotation)}
          disabled={!selectedAnnotation}
        >
          <Trash2 />
        </button>
      </Tooltip>
      <Tooltip text="Clear All">
        <button
          className="p-2 rounded-md bg-white"
          onClick={clearAnnotations}
        >
          <Eraser />
        </button>
      </Tooltip>
    </div>
  );
}
