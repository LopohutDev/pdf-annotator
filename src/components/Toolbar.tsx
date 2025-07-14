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
  Layers,
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
    toggleLayersPanel,
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
    <div className="sticky top-12 w-full h-16 flex flex-row items-center justify-center p-2 space-x-2 bg-gray-200 z-20">
      <div className="flex items-center space-x-2">
        {tools.map((t) => (
          <Tooltip key={t.name} text={t.tooltip}>
            <button
              className={`p-2 rounded-md ${
                tool === t.name
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black"
              }`}
              onClick={() => setTool(t.name)}
            >
              {t.icon}
            </button>
          </Tooltip>
        ))}
      </div>
      <div className="h-full border-l border-gray-300 mx-2" />
      <div className="relative flex items-center space-x-2">
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
          <div className="absolute top-full mt-2 z-40">
            <TwitterPicker
              color={color}
              onChangeComplete={(c) => {
                setColor(c.hex);
                setShowColorPicker(false);
              }}
            />
          </div>
        )}
        <div className="flex space-x-1">
          {strokeWidths.map((width) => (
            <Tooltip key={width} text={`Stroke: ${width}`}>
              <button
                className={`p-1 rounded-md text-sm ${
                  strokeWidth === width ? "bg-blue-500 text-white" : "bg-white"
                }`}
                onClick={() => setStrokeWidth(width)}
              >
                {width}
              </button>
            </Tooltip>
          ))}
        </div>
        <div className="flex space-x-1">
          {fontSizes.map((size) => (
            <Tooltip key={size} text={`Font Size: ${size}`}>
              <button
                className={`p-1 rounded-md text-sm ${
                  fontSize === size ? "bg-blue-500 text-white" : "bg-white"
                }`}
                onClick={() => setFontSize(size)}
              >
                {size}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
      <div className="h-full border-l border-gray-300 mx-2" />
      <div className="flex items-center space-x-2">
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
      </div>
      <div className="h-full border-l border-gray-300 mx-2" />
      <div className="flex items-center space-x-2">
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
            onClick={() =>
              selectedAnnotation && deleteAnnotation(selectedAnnotation)
            }
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
        <Tooltip text="Toggle Layers">
          <button
            className="p-2 rounded-md bg-white"
            onClick={toggleLayersPanel}
          >
            <Layers />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
