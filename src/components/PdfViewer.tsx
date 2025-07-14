"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore, Annotation } from "@/lib/store";
import AnnotationEditor from "./AnnotationEditor";
import ContextMenu from "./ContextMenu";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfViewerProps {
  file: File;
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const {
    tool,
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectedAnnotation,
    selectAnnotation,
    undo,
    redo,
    commit,
  } = useStore();

  const [pdfUrl, setPdfUrl] = useState("");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageDimensions, setPageDimensions] = useState<
    Map<number, { width: number; height: number }>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(
    null
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    annotation: Annotation;
  } | null>(null);
  const [currentMousePosition, setCurrentMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPageRenderSuccess = (page: any) => {
    const pageElement = containerRef.current?.querySelector(
      `.react-pdf__Page[data-page-number="${page.pageNumber}"]`
    );
    if (pageElement) {
      const { width, height } = pageElement.getBoundingClientRect();
      setPageDimensions((prev) =>
        new Map(prev).set(page.pageNumber, { width, height })
      );
    }
  };

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const getPageAndRelativeCoords = (absoluteY: number) => {
    let cumulativeHeight = 0;
    for (let i = 1; i <= (numPages || 0); i++) {
      const pageHeight = pageDimensions.get(i)?.height || 0;
      if (absoluteY < cumulativeHeight + pageHeight) {
        return { pageNumber: i, y: absoluteY - cumulativeHeight };
      }
      cumulativeHeight += pageHeight;
    }
    return { pageNumber: numPages || 1, y: absoluteY - cumulativeHeight };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getAbsoluteY = (pageNumber: number, relativeY: number) => {
    let cumulativeHeight = 0;
    for (let i = 1; i < pageNumber; i++) {
      cumulativeHeight += pageDimensions.get(i)?.height || 0;
    }
    return cumulativeHeight + relativeY;
  };

  const getCoords = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, pageNumber: 1 };

    const pageElement = (e.target as HTMLElement).closest(".react-pdf__Page");
    if (!pageElement) {
      // Fallback for when the event target is not within a page (e.g., on the canvas)
      const firstPageElement = container.querySelector(".react-pdf__Page");
      const containerRect = container.getBoundingClientRect();
      const offsetX = firstPageElement
        ? firstPageElement.getBoundingClientRect().left - containerRect.left
        : 0;
      const x = e.clientX - containerRect.left - offsetX;
      const y = e.clientY - containerRect.top + container.scrollTop;
      const { pageNumber } = getPageAndRelativeCoords(y);
      return { x, y, pageNumber };
    }

    const rect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top + (pageElement as HTMLElement).scrollTop;
    const absoluteY = e.clientY - containerRect.top + container.scrollTop;
    const { pageNumber } = getPageAndRelativeCoords(absoluteY);

    return { x, y, pageNumber };
  };

  const findAnnotationAt = (x: number, y: number): string | null => {
    const { pageNumber, y: relativeY } = getPageAndRelativeCoords(y);

    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];
      if (ann.page !== pageNumber) continue;

      if (ann.type === "text" && ann.x && ann.y && ann.text) {
        const textHeight = ann.fontSize || 16;
        if (
          x >= ann.x &&
          x <= ann.x + 100 &&
          relativeY >= ann.y - textHeight &&
          relativeY <= ann.y
        ) {
          return ann.id;
        }
      } else if (
        ann.type === "rectangle" &&
        ann.x &&
        ann.y &&
        ann.width &&
        ann.height
      ) {
        if (
          x >= ann.x &&
          x <= ann.x + ann.width &&
          relativeY >= ann.y &&
          relativeY <= ann.y + ann.height
        ) {
          return ann.id;
        }
      } else if (ann.type === "circle" && ann.x && ann.y && ann.radius) {
        const distance = Math.sqrt(
          Math.pow(x - ann.x, 2) + Math.pow(relativeY - ann.y, 2)
        );
        if (distance <= ann.radius) {
          return ann.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editingAnnotation) return;
    const { x, y } = getCoords(e);
    const { pageNumber, y: relativeY } = getPageAndRelativeCoords(y);
    const state = useStore.getState();

    if (state.tool === "select") {
      const clickedAnnotationId = findAnnotationAt(x, y);
      selectAnnotation(clickedAnnotationId);
      if (clickedAnnotationId) {
        const ann = state.annotations.find((a) => a.id === clickedAnnotationId);
        if (ann) {
          setIsDragging(true);
          setDragOffset({
            x: x - (ann.x || 0),
            y: y - getAbsoluteY(ann.page, ann.y || 0),
          });
        }
      }
      return;
    }

    if (state.tool === "text") {
      const newAnnotation: Annotation = {
        id: new Date().toISOString(),
        type: "text",
        text: "New Text",
        x,
        y: relativeY,
        page: pageNumber,
        color: state.color,
        fontSize: state.fontSize,
      };
      addAnnotation(newAnnotation);
      setEditingAnnotation(newAnnotation);
      return;
    }

    if (state.tool === "polygon") {
      const currentAnnotation = state.annotations.find(
        (a) =>
          a.id === state.selectedAnnotation && a.type === "polygon" && !a.closed
      );
      if (currentAnnotation) {
        const firstPoint = currentAnnotation.points?.[0];
        if (firstPoint) {
          const distance = Math.sqrt(
            Math.pow(x - firstPoint.x, 2) +
              Math.pow(relativeY - firstPoint.y, 2)
          );
          if (distance < 10) {
            updateAnnotation(currentAnnotation.id, { closed: true });
            commit();
            selectAnnotation(null);
            return;
          }
        }
        updateAnnotation(currentAnnotation.id, {
          points: [
            ...(currentAnnotation.points || []),
            { x, y: relativeY, page: pageNumber },
          ],
        });
      } else {
        const newAnnotation: Annotation = {
          id: new Date().toISOString(),
          type: "polygon",
          points: [{ x, y: relativeY, page: pageNumber }],
          page: pageNumber,
          closed: false,
          color: state.color,
          strokeWidth: state.strokeWidth,
        };
        addAnnotation(newAnnotation);
      }
      return;
    }

    setIsDrawing(true);
    const newAnnotation: Annotation = {
      id: new Date().toISOString(),
      type: state.tool,
      page: pageNumber,
      points: [{ x, y: relativeY, page: pageNumber }],
      x,
      y: relativeY,
      color: state.color,
      strokeWidth: state.strokeWidth,
      fontSize: state.fontSize,
    };
    addAnnotation(newAnnotation);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    const state = useStore.getState();
    const currentAnnotation = state.annotations.find(
      (a) => a.id === state.selectedAnnotation
    );
    setCurrentMousePosition({ x, y });

    if (isDragging && currentAnnotation) {
      const newX = x - dragOffset.x;
      const newAbsoluteY = y - dragOffset.y;
      const { pageNumber, y: newRelativeY } =
        getPageAndRelativeCoords(newAbsoluteY);
      updateAnnotation(currentAnnotation.id, {
        x: newX,
        y: newRelativeY,
        page: pageNumber,
      });
    } else if (isDrawing && currentAnnotation) {
      const { pageNumber, y: relativeY } = getPageAndRelativeCoords(y);
      if (state.tool === "pen" || state.tool === "highlighter") {
        const newPoints = [
          ...(currentAnnotation.points || []),
          { x, y: relativeY, page: pageNumber },
        ];
        updateAnnotation(currentAnnotation.id, { points: newPoints });
      } else if (state.tool === "arrow") {
        const newPoints = [
          currentAnnotation.points![0],
          { x, y: relativeY, page: pageNumber },
        ];
        updateAnnotation(currentAnnotation.id, { points: newPoints });
      } else if (state.tool === "rectangle") {
        updateAnnotation(currentAnnotation.id, {
          width: x - (currentAnnotation.x || 0),
          height: relativeY - (currentAnnotation.y || 0),
        });
      } else if (state.tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(x - (currentAnnotation.x || 0), 2) +
            Math.pow(relativeY - (currentAnnotation.y || 0), 2)
        );
        updateAnnotation(currentAnnotation.id, { radius });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing || isDragging) {
      commit();
    }
    setIsDrawing(false);
    setIsDragging(false);
    const state = useStore.getState();
    if (state.tool !== "select" && state.tool !== "polygon") {
      selectAnnotation(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x, y } = getCoords(e);
    const clickedAnnotationId = findAnnotationAt(x, y);
    if (clickedAnnotationId) {
      const ann = annotations.find((a) => a.id === clickedAnnotationId);
      if (ann && ann.type === "text") {
        setEditingAnnotation(ann);
      }
    } else {
      const state = useStore.getState();
      const currentAnnotation = state.annotations.find(
        (a) =>
          a.id === state.selectedAnnotation && a.type === "polygon" && !a.closed
      );
      if (currentAnnotation) {
        updateAnnotation(currentAnnotation.id, { closed: true });
        commit();
        selectAnnotation(null);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const { x, y } = getCoords(e);
    const clickedAnnotationId = findAnnotationAt(x, y);
    if (clickedAnnotationId) {
      const ann = annotations.find((a) => a.id === clickedAnnotationId);
      if (ann) {
        setContextMenu({ x: e.clientX, y: e.clientY, annotation: ann });
      }
    } else {
      setContextMenu(null);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const container = containerRef.current;
    if (!ctx || !canvas || !container) return;

    const firstPageElement = container.querySelector(".react-pdf__Page");
    const containerRect = container.getBoundingClientRect();
    const offsetX = firstPageElement
      ? firstPageElement.getBoundingClientRect().left - containerRect.left
      : 0;

    const totalHeight = Array.from(pageDimensions.values()).reduce(
      (sum, dim) => sum + dim.height,
      0
    );
    canvas.width = container.clientWidth;
    canvas.height = totalHeight;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach((ann) => {
      if (editingAnnotation?.id === ann.id) return;

      const isSelected = ann.id === selectedAnnotation;

      ctx.save();
      ctx.strokeStyle = isSelected ? "blue" : ann.color || "black";
      ctx.lineWidth = ann.strokeWidth || (isSelected ? 3 : 2);
      ctx.fillStyle = ann.color ? `${ann.color}33` : "rgba(0, 0, 0, 0.2)";

      const annOffsetX =
        pageDimensions.get(ann.page)?.width === container.clientWidth
          ? 0
          : offsetX;

      if (
        (ann.type === "pen" || ann.type === "highlighter") &&
        ann.points &&
        ann.points.length > 1
      ) {
        ctx.globalAlpha = ann.type === "highlighter" ? 0.5 : 1;
        ctx.beginPath();
        const firstPointAbsoluteY = getAbsoluteY(
          ann.points[0].page,
          ann.points[0].y
        );
        ctx.moveTo(ann.points[0].x + annOffsetX, firstPointAbsoluteY);
        for (let i = 1; i < ann.points.length; i++) {
          const pointAbsoluteY = getAbsoluteY(
            ann.points[i].page,
            ann.points[i].y
          );
          ctx.lineTo(ann.points[i].x + annOffsetX, pointAbsoluteY);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (ann.type === "arrow" && ann.points && ann.points.length > 1) {
        const p1 = ann.points[0];
        const p2 = ann.points[1];
        const p1AbsY = getAbsoluteY(p1.page, p1.y);
        const p2AbsY = getAbsoluteY(p2.page, p2.y);
        const angle = Math.atan2(p2AbsY - p1AbsY, p2.x - p1.x);
        ctx.beginPath();
        ctx.moveTo(p1.x + annOffsetX, p1AbsY);
        ctx.lineTo(p2.x + annOffsetX, p2AbsY);
        ctx.lineTo(
          p2.x + annOffsetX - 10 * Math.cos(angle - Math.PI / 6),
          p2AbsY - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(p2.x + annOffsetX, p2AbsY);
        ctx.lineTo(
          p2.x + annOffsetX - 10 * Math.cos(angle + Math.PI / 6),
          p2AbsY - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      } else if (
        ann.type === "polygon" &&
        ann.points &&
        ann.points.length > 0
      ) {
        ctx.beginPath();
        const firstPointAbsoluteY = getAbsoluteY(
          ann.points[0].page,
          ann.points[0].y
        );
        ctx.moveTo(ann.points[0].x + annOffsetX, firstPointAbsoluteY);
        for (let i = 1; i < ann.points.length; i++) {
          const pointAbsoluteY = getAbsoluteY(
            ann.points[i].page,
            ann.points[i].y
          );
          ctx.lineTo(ann.points[i].x + annOffsetX, pointAbsoluteY);
        }
        if (ann.closed) {
          ctx.closePath();
        } else if (isSelected && currentMousePosition) {
          ctx.lineTo(
            currentMousePosition.x + annOffsetX,
            currentMousePosition.y
          );
        }
        ctx.stroke();
      } else if (
        ann.type === "rectangle" &&
        ann.x != null &&
        ann.y != null &&
        ann.width != null &&
        ann.height != null
      ) {
        const absoluteY = getAbsoluteY(ann.page, ann.y);
        ctx.strokeRect(ann.x + annOffsetX, absoluteY, ann.width, ann.height);
      } else if (
        ann.type === "circle" &&
        ann.x != null &&
        ann.y != null &&
        ann.radius != null
      ) {
        const absoluteY = getAbsoluteY(ann.page, ann.y);
        ctx.beginPath();
        ctx.arc(ann.x + annOffsetX, absoluteY, ann.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === "text" && ann.x != null && ann.y != null) {
        const absoluteY = getAbsoluteY(ann.page, ann.y);
        ctx.font = `${ann.fontSize || 16}px Arial`;
        ctx.fillStyle = isSelected ? "blue" : ann.color || "black";
        ctx.fillText(ann.text || "", ann.x + annOffsetX, absoluteY);
      }
      ctx.restore();
    });
  }, [
    annotations,
    selectedAnnotation,
    editingAnnotation,
    pageDimensions,
    currentMousePosition,
    getAbsoluteY,
  ]);

  useEffect(() => {
    draw();
  }, [draw, annotations]);

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const pdfBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pdfPages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const colorToRgb = (color: string) => {
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        return rgb(r, g, b);
      };

      for (const ann of annotations) {
        const page = pdfPages[ann.page - 1];
        const renderedPageDims = pageDimensions.get(ann.page);

        if (!page || !renderedPageDims) continue;

        const { width: actualWidth, height: actualHeight } = page.getSize();
        const { width: renderedWidth } = renderedPageDims;
        const scale = actualWidth / renderedWidth;

        const annColor = ann.color ? colorToRgb(ann.color) : rgb(0, 0, 0);

        if (
          (ann.type === "pen" || ann.type === "highlighter") &&
          ann.points &&
          ann.points.length > 1
        ) {
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];
            page.drawLine({
              start: { x: p1.x * scale, y: actualHeight - p1.y * scale },
              end: { x: p2.x * scale, y: actualHeight - p2.y * scale },
              thickness: (ann.strokeWidth || 2) * scale,
              color: annColor,
              opacity: ann.type === "highlighter" ? 0.5 : 1,
            });
          }
        } else if (
          ann.type === "rectangle" &&
          ann.x != null &&
          ann.y != null &&
          ann.width != null &&
          ann.height != null
        ) {
          const rectX = (ann.width > 0 ? ann.x : ann.x + ann.width) * scale;
          const rectY = (ann.height > 0 ? ann.y : ann.y + ann.height) * scale;
          const rectWidth = Math.abs(ann.width) * scale;
          const rectHeight = Math.abs(ann.height) * scale;

          page.drawRectangle({
            x: rectX,
            y: actualHeight - rectY - rectHeight,
            width: rectWidth,
            height: rectHeight,
            borderColor: annColor,
            borderWidth: (ann.strokeWidth || 2) * scale,
          });
        } else if (
          ann.type === "circle" &&
          ann.x != null &&
          ann.y != null &&
          ann.radius != null
        ) {
          page.drawCircle({
            x: ann.x * scale,
            y: actualHeight - ann.y * scale,
            size: ann.radius * scale,
            borderColor: annColor,
            borderWidth: (ann.strokeWidth || 2) * scale,
          });
        } else if (
          ann.type === "polygon" &&
          ann.points &&
          ann.points.length > 0 &&
          ann.closed
        ) {
          const points = ann.points.map((p) => ({
            x: p.x * scale,
            y: actualHeight - p.y * scale,
          }));

          for (let i = 0; i < points.length; i++) {
            const start = points[i];
            const end = points[(i + 1) % points.length]; // Wraps around to the first point
            page.drawLine({
              start,
              end,
              thickness: (ann.strokeWidth || 2) * scale,
              color: annColor,
            });
          }
        } else if (
          ann.type === "text" &&
          ann.x != null &&
          ann.y != null &&
          ann.text
        ) {
          page.drawText(ann.text, {
            x: ann.x * scale,
            y: actualHeight - ann.y * scale,
            size: (ann.fontSize || 16) * scale,
            font,
            color: annColor,
          });
        } else if (
          ann.type === "arrow" &&
          ann.points &&
          ann.points.length > 1
        ) {
          const p1 = {
            x: ann.points[0].x * scale,
            y: actualHeight - ann.points[0].y * scale,
          };
          const p2 = {
            x: ann.points[1].x * scale,
            y: actualHeight - ann.points[1].y * scale,
          };
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          const arrowheadLength = 10 * scale;
          const arrowheadAngle = Math.PI / 6;

          const arrowheadP1 = {
            x: p2.x - arrowheadLength * Math.cos(angle - arrowheadAngle),
            y: p2.y - arrowheadLength * Math.sin(angle - arrowheadAngle),
          };
          const arrowheadP2 = {
            x: p2.x - arrowheadLength * Math.cos(angle + arrowheadAngle),
            y: p2.y - arrowheadLength * Math.sin(angle + arrowheadAngle),
          };

          page.drawLine({
            start: p1,
            end: p2,
            thickness: (ann.strokeWidth || 2) * scale,
            color: annColor,
          });
          page.drawLine({
            start: p2,
            end: arrowheadP1,
            thickness: (ann.strokeWidth || 2) * scale,
            color: annColor,
          });
          page.drawLine({
            start: p2,
            end: arrowheadP2,
            thickness: (ann.strokeWidth || 2) * scale,
            color: annColor,
          });
        }
      }

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annotated-${file.name}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert("PDF saved successfully!");
    } catch (error) {
      console.error("Failed to save PDF:", error);
      alert("Failed to save PDF. See console for details.");
    } finally {
      setIsSaving(false);
    }
  }, [annotations, file, pageDimensions]);

  useEffect(() => {
    const handleSave = () => save();
    window.addEventListener("save-pdf", handleSave);
    return () => {
      window.removeEventListener("save-pdf", handleSave);
    };
  }, [save]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedAnnotation) {
        deleteAnnotation(selectedAnnotation);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        redo();
      } else if (e.key === "Escape") {
        const state = useStore.getState();
        const currentAnnotation = state.annotations.find(
          (a) =>
            a.id === state.selectedAnnotation &&
            a.type === "polygon" &&
            !a.closed
        );
        if (currentAnnotation) {
          updateAnnotation(currentAnnotation.id, { closed: true });
          commit();
          selectAnnotation(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedAnnotation,
    deleteAnnotation,
    undo,
    redo,
    updateAnnotation,
    commit,
  ]);

  const finishPolygon = () => {
    const state = useStore.getState();
    const currentAnnotation = state.annotations.find(
      (a) =>
        a.id === state.selectedAnnotation && a.type === "polygon" && !a.closed
    );
    if (currentAnnotation) {
      updateAnnotation(currentAnnotation.id, { closed: true });
      commit();
      selectAnnotation(null);
    }
  };

  const isDrawingPolygon =
    tool === "polygon" &&
    !!selectedAnnotation &&
    !!annotations.find(
      (a) => a.id === selectedAnnotation && a.type === "polygon" && !a.closed
    );

  return (
    <div className="flex flex-col items-center">
      {isDrawingPolygon && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 bg-white p-2 rounded-md shadow-md">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md"
            onClick={finishPolygon}
          >
            Finish Polygon
          </button>
        </div>
      )}
      <div ref={containerRef} className="relative w-full">
        {isSaving && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
            <Loader2 className="animate-spin h-12 w-12 text-white" />
          </div>
        )}
        <Document
          ref={docRef}
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<Loader2 className="animate-spin" />}
          className="flex flex-col items-center"
        >
          {Array.from(new Array(numPages || 0), (el, index) => (
            <div
              key={`page_container_${index + 1}`}
              className="mb-4 border-b-2 border-gray-300"
            >
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                onRenderSuccess={onPageRenderSuccess}
              />
            </div>
          ))}
        </Document>
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 z-10 pointer-events-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setCurrentMousePosition(null)}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
        <div
          className="absolute top-0 left-0 w-full h-full z-20"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setCurrentMousePosition(null)}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        >
          {editingAnnotation && (
            <AnnotationEditor
              annotation={editingAnnotation}
              onClose={() => {
                setEditingAnnotation(null);
                commit();
              }}
            />
          )}
          {contextMenu && (
            <ContextMenu
              {...contextMenu}
              onClose={() => setContextMenu(null)}
              onEdit={() => {
                setEditingAnnotation(contextMenu.annotation);
                setContextMenu(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
