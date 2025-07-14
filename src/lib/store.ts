import { create } from "zustand";

export type Tool =
  | "pen"
  | "text"
  | "select"
  | "polygon"
  | "rectangle"
  | "circle"
  | "highlighter"
  | "arrow";

export interface Annotation {
  id: string;
  type: Tool;
  page: number;
  points?: { x: number; y: number; page: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  closed?: boolean;
  color?: string;
  strokeWidth?: number;
  fontSize?: number;
  rotation?: number;
}

interface Store {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  annotations: Annotation[];
  setAnnotations: (annotations: Annotation[]) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (
    id: string,
    updates: Partial<Omit<Annotation, "id">>
  ) => void;
  deleteAnnotation: (id: string) => void;
  clearAnnotations: () => void;
  selectedAnnotation: string | null;
  selectAnnotation: (id: string | null) => void;
  history: Annotation[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  commit: () => void;
  layersPanelVisible: boolean;
  toggleLayersPanel: () => void;
}

const useStoreImplementation = create<Store>((set, get) => {
  const commit = () => {
    const { history, historyIndex, annotations } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(annotations);
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  };

  return {
    tool: "pen",
    setTool: (tool) => set({ tool, selectedAnnotation: null }),
    color: "#000000",
    setColor: (color) => set({ color }),
    strokeWidth: 2,
    setStrokeWidth: (width) => set({ strokeWidth: width }),
    fontSize: 16,
    setFontSize: (size) => set({ fontSize: size }),
    annotations: [],
    history: [[]],
    historyIndex: 0,
    commit,
    setAnnotations: (annotations) => {
      set({ annotations });
      commit();
    },
    addAnnotation: (annotation) => {
      const { annotations } = get();
      const newAnnotations = [...annotations, annotation];
      set({ annotations: newAnnotations, selectedAnnotation: annotation.id });
      commit();
    },
    updateAnnotation: (id, updates) => {
      const { annotations } = get();
      const newAnnotations = annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      set({ annotations: newAnnotations });
    },
    deleteAnnotation: (id) => {
      const { annotations } = get();
      const newAnnotations = annotations.filter((a) => a.id !== id);
      set({ annotations: newAnnotations, selectedAnnotation: null });
      commit();
    },
    clearAnnotations: () => {
      set({ annotations: [] });
      commit();
    },
    selectedAnnotation: null,
    selectAnnotation: (id) => set({ selectedAnnotation: id }),
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        set({
          annotations: history[newIndex],
          historyIndex: newIndex,
          selectedAnnotation: null,
        });
      }
    },
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        set({
          annotations: history[newIndex],
          historyIndex: newIndex,
          selectedAnnotation: null,
        });
      }
    },
    layersPanelVisible: true,
    toggleLayersPanel: () =>
      set((state) => ({ layersPanelVisible: !state.layersPanelVisible })),
  };
});

export const useStore = useStoreImplementation;
