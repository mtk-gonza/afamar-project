import { useState, useRef, useCallback, useEffect } from "react";
import type { SketchElement, SketchPage } from "../../types";
import styles from "./SketchEditor.module.css";

type ToolType = "select" | "draw" | "line" | "rect" | "circle" | "bacha" | "anafe" | "hole" | "text" | "measure";

interface SketchEditorProps {
  croquis?: SketchPage[] | SketchElement[];
  onChange?: (pages: SketchPage[]) => void;
  readOnly?: boolean;
}

const CANVAS_W = 800;
const CANVAS_H = 500;
const GRID = 20;

let _eid = 1000;
const nextId = () => ++_eid;

const tools: { id: ToolType; label: string; icon: string }[] = [
  { id: "select", label: "Seleccionar", icon: "⬚" },
  { id: "draw", label: "Dibujo libre", icon: "✎" },
  { id: "line", label: "Línea", icon: "╱" },
  { id: "rect", label: "Rectángulo", icon: "▭" },
  { id: "circle", label: "Círculo", icon: "○" },
  { id: "bacha", label: "Bacha", icon: "⬡" },
  { id: "anafe", label: "Anafe", icon: "◉" },
  { id: "hole", label: "Perforación", icon: "⊙" },
  { id: "text", label: "Texto", icon: "T" },
  { id: "measure", label: "Medida", icon: "↔" },
];

const zoomLevels = [0.5, 1, 1.5, 2];

function normalizePages(croquis: SketchPage[] | SketchElement[] | undefined): SketchPage[] {
  if (!croquis || !Array.isArray(croquis) || croquis.length === 0) {
    return [{ nombre: "Página 1", dibujo: [] }];
  }
  if ("nombre" in croquis[0]) {
    return croquis as SketchPage[];
  }
  return [{ nombre: "Página 1", dibujo: croquis as SketchElement[] }];
}

function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function ptInRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number,
  pad = 4,
): boolean {
  return px >= rx - pad && px <= rx + rw + pad && py >= ry - pad && py <= ry + rh + pad;
}

function getElemBounds(el: SketchElement): { x: number; y: number; w: number; h: number } {
  switch (el.type) {
    case "rect":
      return { x: el.x ?? 0, y: el.y ?? 0, w: el.w ?? 0, h: el.h ?? 0 };
    case "circle":
      return { x: (el.x ?? 0) - (el.r ?? 0), y: (el.y ?? 0) - (el.r ?? 0), w: (el.r ?? 0) * 2, h: (el.r ?? 0) * 2 };
    case "line":
    case "measure":
      return {
        x: Math.min(el.x1 ?? 0, el.x2 ?? 0),
        y: Math.min(el.y1 ?? 0, el.y2 ?? 0),
        w: Math.abs((el.x2 ?? 0) - (el.x1 ?? 0)),
        h: Math.abs((el.y2 ?? 0) - (el.y1 ?? 0)),
      };
    case "bacha":
    case "anafe":
      return {
        x: (el.x ?? 0) - (el.ancho ?? 60) / 2,
        y: (el.y ?? 0) - (el.alto ?? 50) / 2,
        w: el.ancho ?? 60,
        h: el.alto ?? 50,
      };
    case "hole":
      return { x: (el.x ?? 0) - (el.r ?? 15), y: (el.y ?? 0) - (el.r ?? 15), w: (el.r ?? 15) * 2, h: (el.r ?? 15) * 2 };
    case "text":
      return { x: el.x ?? 0, y: (el.y ?? 0) - 14, w: ((el.text ?? "").length * 8) + 4, h: 20 };
    case "draw":
    case "path": {
      const pts = el.points ?? [];
      if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    }
    default:
      return { x: 0, y: 0, w: 0, h: 0 };
  }
}

function hitTest(px: number, py: number, elements: SketchElement[]): SketchElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const b = getElemBounds(el);
    if (b.w < 4 && b.h < 4) {
      b.w = 8;
      b.h = 8;
      b.x -= 4;
      b.y -= 4;
    }
    if (ptInRect(px, py, b.x, b.y, b.w, b.h, 6)) return el;
  }
  return null;
}

export function SketchEditor({ croquis, onChange, readOnly = false }: SketchEditorProps) {
  const [pages, setPages] = useState<SketchPage[]>(() => normalizePages(croquis));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tool, setTool] = useState<ToolType>("select");
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(null);
  const [editingTab, setEditingTab] = useState<number | null>(null);
  const [tabEditValue, setTabEditValue] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const endRef = useRef<{ x: number; y: number } | null>(null);
  const freehandRef = useRef<{ x: number; y: number }[]>([]);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);
  const elemOrigRef = useRef<SketchElement | null>(null);
  const isRotatingRef = useRef(false);
  const rotStartRef = useRef(0);
  const pagesRef = useRef(pages);
  const selectedIdRef = useRef(selectedId);
  const toolRef = useRef(tool);
  const zoomRef = useRef(zoom);

  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  const getElements = useCallback((pgs: SketchPage[], idx: number): SketchElement[] => {
    return pgs[idx]?.dibujo ?? pgs[idx]?.elementos ?? [];
  }, []);

  const emitChange = useCallback((pgs: SketchPage[]) => {
    if (!onChange) return;
    onChange(pgs.map((p) => ({
      pagina_id: p.pagina_id,
      nombre: p.nombre,
      dibujo: p.dibujo ?? p.elementos ?? [],
    })));
  }, [onChange]);

  const getCanvasPos = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoomRef.current,
        y: (clientY - rect.top) / zoomRef.current,
      };
    },
    [],
  );

  /* ── Drawing helpers ── */

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = "#e8e8e8";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= CANVAS_W; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_H; y += GRID) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
  }, []);

  const drawHexagon = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, w: number, h: number,
    color: string, lw: number,
  ) => {
    const rx = w / 2;
    const ry = h / 2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.stroke();
  }, []);

  const drawElement = useCallback((
    ctx: CanvasRenderingContext2D,
    el: SketchElement,
    highlight: boolean,
  ) => {
    const rot = (el.rotacion ?? 0) * (Math.PI / 180);
    const color = el.color ?? (highlight ? "#2563eb" : "#333");
    const lw = el.lineWidth ?? (highlight ? 2.5 : 1.5);
    const fill = el.fill ?? "transparent";

    const drawContent = () => {
      switch (el.type) {
        case "rect": {
          const x = el.x ?? 0;
          const y = el.y ?? 0;
          const w = el.w ?? 0;
          const h = el.h ?? 0;
          if (fill !== "transparent") {
            ctx.fillStyle = fill;
            ctx.fillRect(x, y, w, h);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.strokeRect(x, y, w, h);
          break;
        }
        case "circle": {
          const cx = el.x ?? 0;
          const cy = el.y ?? 0;
          const r = el.r ?? 0;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          if (fill !== "transparent") {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.stroke();
          break;
        }
        case "line": {
          ctx.beginPath();
          ctx.moveTo(el.x1 ?? 0, el.y1 ?? 0);
          ctx.lineTo(el.x2 ?? 0, el.y2 ?? 0);
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.stroke();
          break;
        }
        case "measure": {
          const x1 = el.x1 ?? 0;
          const y1 = el.y1 ?? 0;
          const x2 = el.x2 ?? 0;
          const y2 = el.y2 ?? 0;
          const d = dist({ x: x1, y: y1 }, { x: x2, y: y2 });
          const label = el.label ?? `${d.toFixed(0)}cm`;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#e74c3c";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.setLineDash([]);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          ctx.font = "11px sans-serif";
          ctx.fillStyle = "#e74c3c";
          ctx.textAlign = "center";
          ctx.fillText(label, mx, my - 6);
          ctx.beginPath();
          ctx.arc(x1, y1, 3, 0, Math.PI * 2);
          ctx.arc(x2, y2, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "bacha": {
          drawHexagon(ctx, el.x ?? 0, el.y ?? 0, el.ancho ?? 60, el.alto ?? 50, color, lw);
          ctx.font = "9px sans-serif";
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.fillText("BACHA", el.x ?? 0, (el.y ?? 0) + 3);
          break;
        }
        case "anafe": {
          const cx = el.x ?? 0;
          const cy = el.y ?? 0;
          const aw = el.ancho ?? 50;
          const ah = el.alto ?? 40;
          const sr = 8;
          const positions = [
            [cx - aw / 4, cy - ah / 4],
            [cx + aw / 4, cy - ah / 4],
            [cx - aw / 4, cy + ah / 4],
            [cx + aw / 4, cy + ah / 4],
          ];
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          for (const [px, py] of positions) {
            ctx.beginPath();
            ctx.arc(px, py, sr, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.font = "9px sans-serif";
          ctx.fillStyle = color;
          ctx.textAlign = "center";
          ctx.fillText("ANAFE", cx, cy + ah / 2 + 12);
          break;
        }
        case "hole": {
          const hx = el.x ?? 0;
          const hy = el.y ?? 0;
          const hr = el.r ?? 15;
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(hx, hy, hr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(hx - hr, hy);
          ctx.lineTo(hx + hr, hy);
          ctx.moveTo(hx, hy - hr);
          ctx.lineTo(hx, hy + hr);
          ctx.stroke();
          break;
        }
        case "text": {
          ctx.font = el.font ?? "14px sans-serif";
          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          ctx.fillText(el.text ?? "", el.x ?? 0, el.y ?? 0);
          break;
        }
        case "draw":
        case "path": {
          const pts = el.points ?? [];
          if (pts.length < 2) break;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.strokeStyle = color;
          ctx.lineWidth = lw;
          ctx.stroke();
          break;
        }
      }
    };

    if (rot !== 0) {
      const b = getElemBounds(el);
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);
      drawContent();
      ctx.restore();
    } else {
      drawContent();
    }
  }, [drawHexagon]);

  const drawSelectionHandles = useCallback((ctx: CanvasRenderingContext2D, el: SketchElement) => {
    const rot = (el.rotacion ?? 0) * (Math.PI / 180);
    const b = getElemBounds(el);
    let bx = b.x;
    let by = b.y;
    let bw = b.w;
    let bh = b.h;
    if (bw < 4 && bh < 4) { bw = 8; bh = 8; bx -= 4; by -= 4; }

    const cx = bx + bw / 2;
    const cy = by + bh / 2;

    const corners = [
      { x: bx, y: by },
      { x: bx + bw, y: by },
      { x: bx + bw, y: by + bh },
      { x: bx, y: by + bh },
    ];

    if (rot !== 0) {
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      corners.forEach((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        p.x = cx + dx * cos - dy * sin;
        p.y = cy + dx * sin + dy * cos;
      });
    }

    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1;

    corners.forEach((p) => {
      ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
      ctx.strokeRect(p.x - 4, p.y - 4, 8, 8);
    });

    const rotHandleY = cy - 30;
    let rhx = cx;
    let rhy = rotHandleY;
    if (rot !== 0) {
      const dy = rotHandleY - cy;
      rhx = cx - dy * Math.sin(rot);
      rhy = cy + dy * Math.cos(rot);
    }

    ctx.beginPath();
    ctx.moveTo(cx, cy - 18);
    ctx.lineTo(rhx, rhy);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rhx, rhy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, []);

  const drawPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    const start = startRef.current;
    const end = endRef.current;
    if (!start || !end) return;

    const curTool = toolRef.current;
    const color = "#2563eb";
    const lw = 1.5;

    ctx.setLineDash([5, 5]);

    switch (curTool) {
      case "line": {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
        break;
      }
      case "rect": {
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const w = Math.abs(end.x - start.x);
        const h = Math.abs(end.y - start.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.strokeRect(x, y, w, h);
        break;
      }
      case "circle":
      case "hole": {
        const r = dist(start, end);
        ctx.beginPath();
        ctx.arc(start.x, start.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
        break;
      }
      case "measure": {
        const d = dist(start, end);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = lw;
        ctx.stroke();
        const mx = (start.x + end.x) / 2;
        const my = (start.y + end.y) / 2;
        ctx.font = "11px sans-serif";
        ctx.fillStyle = "#e74c3c";
        ctx.textAlign = "center";
        ctx.fillText(`${d.toFixed(0)}cm`, mx, my - 6);
        break;
      }
      case "draw": {
        const pts = freehandRef.current;
        if (pts.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
        break;
      }
    }

    ctx.setLineDash([]);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pgs = pagesRef.current;
    const selId = selectedIdRef.current;
    const elements = getElements(pgs, currentIdx);

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawGrid(ctx);

    elements.forEach((el) => {
      const isSel = el.id === selId;
      drawElement(ctx, el, isSel);
      if (isSel) drawSelectionHandles(ctx, el);
    });

    drawPreview(ctx);
  }, [currentIdx, drawElement, drawGrid, drawPreview, drawSelectionHandles, getElements]);

  useEffect(() => { redraw(); }, [redraw, pages, currentIdx, zoom, tool, selectedId]);

  /* ── Element mutation helpers ── */

  const updateElements = useCallback(
    (fn: (elems: SketchElement[]) => SketchElement[]) => {
      setPages((prev) => {
        const next = [...prev];
        const cur = { ...next[currentIdx] };
        const elems = getElements(prev, currentIdx);
        cur.dibujo = fn([...elems]);
        next[currentIdx] = cur;
        return next;
      });
    },
    [currentIdx, getElements],
  );

  const pushElement = useCallback(
    (el: SketchElement) => {
      updateElements((elems) => [...elems, el]);
    },
    [updateElements],
  );

  /* ── Mouse handlers ── */

  const isOnRotateHandle = useCallback(
    (px: number, py: number, el: SketchElement): boolean => {
      const b = getElemBounds(el);
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const rot = (el.rotacion ?? 0) * (Math.PI / 180);
      const rhy = cy - 30;
      const rhx = cx;
      let rhxr = rhx;
      let rhyr = rhy;
      if (rot !== 0) {
        const dy = rhy - cy;
        rhxr = cx - dy * Math.sin(rot);
        rhyr = cy + dy * Math.cos(rot);
      }
      return dist({ x: px, y: py }, { x: rhxr, y: rhyr }) < 12;
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      if (e.button !== 0) return;
      if (pendingText) return;
      const pos = getCanvasPos(e.clientX, e.clientY);

      if (tool === "text") {
        setPendingText({ x: pos.x, y: pos.y });
        return;
      }

      if (tool === "bacha" || tool === "anafe") {
        const sx = snap(pos.x);
        const sy = snap(pos.y);
        const el: SketchElement = {
          id: nextId(),
          type: tool,
          x: sx,
          y: sy,
          ancho: tool === "bacha" ? 60 : 50,
          alto: tool === "bacha" ? 50 : 40,
          color: "#333",
          lineWidth: 1.5,
        };
        pushElement(el);
        setPages((prev) => { emitChange(prev); return prev; });
        return;
      }

      if (tool === "select") {
        const elements = getElements(pagesRef.current, currentIdx);
        const hit = hitTest(pos.x, pos.y, elements);
        if (hit && hit.id !== undefined) {
          if (isOnRotateHandle(pos.x, pos.y, hit)) {
            isRotatingRef.current = true;
            const b = getElemBounds(hit);
            const cx = b.x + b.w / 2;
            const cy = b.y + b.h / 2;
            rotStartRef.current = Math.atan2(pos.y - cy, pos.x - cx);
            setSelectedId(hit.id!);
            return;
          }
          moveStartRef.current = pos;
          elemOrigRef.current = { ...hit };
          setSelectedId(hit.id!);
          return;
        }
        setSelectedId(null);
        return;
      }

      isDrawingRef.current = true;
      startRef.current = pos;
      endRef.current = pos;

      if (tool === "draw") {
        freehandRef.current = [pos];
      }
    },
    [readOnly, pendingText, tool, getCanvasPos, currentIdx, pushElement, isOnRotateHandle, getElements, emitChange],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;
      const pos = getCanvasPos(e.clientX, e.clientY);

      if (isRotatingRef.current && selectedIdRef.current !== null) {
        const elements = getElements(pagesRef.current, currentIdx);
        const el = elements.find((el) => el.id === selectedIdRef.current);
        if (el) {
          const b = getElemBounds(el);
          const cx = b.x + b.w / 2;
          const cy = b.y + b.h / 2;
          const angle = Math.atan2(pos.y - cy, pos.x - cx);
          const rotDeg = (angle - rotStartRef.current) * (180 / Math.PI);
          const newRot = ((el.rotacion ?? 0) + rotDeg) % 360;
          updateElements((elems) =>
            elems.map((e) => (e.id === selectedIdRef.current ? { ...e, rotacion: newRot } : e)),
          );
          rotStartRef.current = angle;
        }
        return;
      }

      if (moveStartRef.current && elemOrigRef.current && selectedIdRef.current !== null) {
        const dx = pos.x - moveStartRef.current.x;
        const dy = pos.y - moveStartRef.current.y;
        const orig = elemOrigRef.current;
        updateElements((elems) =>
          elems.map((e) => {
            if (e.id !== selectedIdRef.current) return e;
            const upd: SketchElement = { ...e };
            switch (e.type) {
              case "rect":
              case "circle":
              case "bacha":
              case "anafe":
              case "hole":
              case "text": {
                upd.x = snap((orig.x ?? 0) + dx);
                upd.y = snap((orig.y ?? 0) + dy);
                break;
              }
              case "line":
              case "measure": {
                upd.x1 = snap((orig.x1 ?? 0) + dx);
                upd.y1 = snap((orig.y1 ?? 0) + dy);
                upd.x2 = snap((orig.x2 ?? 0) + dx);
                upd.y2 = snap((orig.y2 ?? 0) + dy);
                break;
              }
              case "draw":
              case "path": {
                upd.points = (orig.points ?? []).map((p) => ({
                  x: snap(p.x + dx),
                  y: snap(p.y + dy),
                }));
                break;
              }
            }
            return upd;
          }),
        );
        return;
      }

      if (!isDrawingRef.current) return;
      endRef.current = pos;

      if (toolRef.current === "draw") {
        freehandRef.current.push(pos);
      }

      redraw();
    },
    [readOnly, currentIdx, getCanvasPos, updateElements, getElements, redraw],
  );

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (readOnly) return;

      if (isRotatingRef.current) {
        isRotatingRef.current = false;
        setPages((prev) => { emitChange(prev); return prev; });
        return;
      }

      if (moveStartRef.current) {
        moveStartRef.current = null;
        elemOrigRef.current = null;
        setPages((prev) => { emitChange(prev); return prev; });
        return;
      }

      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;

      const start = startRef.current;
      const end = endRef.current;
      if (!start || !end) {
        startRef.current = null;
        endRef.current = null;
        return;
      }

      const curTool = toolRef.current;
      let el: SketchElement | null = null;

      switch (curTool) {
        case "line": {
          el = {
            id: nextId(),
            type: "line",
            x1: snap(start.x),
            y1: snap(start.y),
            x2: snap(end.x),
            y2: snap(end.y),
            color: "#333",
            lineWidth: 1.5,
          };
          break;
        }
        case "rect": {
          const x = Math.min(start.x, end.x);
          const y = Math.min(start.y, end.y);
          const w = Math.abs(end.x - start.x);
          const h = Math.abs(end.y - start.y);
          if (w < 5 && h < 5) break;
          el = {
            id: nextId(),
            type: "rect",
            x: snap(x),
            y: snap(y),
            w: Math.max(snap(x + w) - snap(x), GRID),
            h: Math.max(snap(y + h) - snap(y), GRID),
            color: "#333",
            lineWidth: 1.5,
          };
          break;
        }
        case "circle": {
          const r = dist(start, end);
          if (r < 5) break;
          el = {
            id: nextId(),
            type: "circle",
            x: snap(start.x),
            y: snap(start.y),
            r: Math.max(snap(start.x + r) - snap(start.x), GRID / 2),
            color: "#333",
            lineWidth: 1.5,
          };
          break;
        }
        case "hole": {
          const hr = dist(start, end);
          if (hr < 5) break;
          el = {
            id: nextId(),
            type: "hole",
            x: snap(start.x),
            y: snap(start.y),
            r: Math.max(snap(start.x + hr) - snap(start.x), GRID / 2),
            color: "#333",
            lineWidth: 1.5,
          };
          break;
        }
        case "measure": {
          const d = dist(start, end);
          if (d < 10) break;
          el = {
            id: nextId(),
            type: "measure",
            x1: snap(start.x),
            y1: snap(start.y),
            x2: snap(end.x),
            y2: snap(end.y),
            label: `${d.toFixed(0)}cm`,
            color: "#e74c3c",
          };
          break;
        }
        case "draw": {
          const pts = freehandRef.current;
          if (pts.length < 4) break;
          el = {
            id: nextId(),
            type: "draw",
            points: pts.map((p) => ({ x: snap(p.x), y: snap(p.y) })),
            color: "#333",
            lineWidth: 1.5,
          };
          break;
        }
      }

      if (el) {
        pushElement(el);
      }

      startRef.current = null;
      endRef.current = null;
      freehandRef.current = [];

      setPages((prev) => { emitChange(prev); return prev; });
    },
    [readOnly, emitChange],
  );

  /* ── Initial emit ── */

  useEffect(() => {
    if (!onChange) return;
    emitChange(pages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keyboard ── */

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (readOnly) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIdRef.current === null) return;
        updateElements((elems) => elems.filter((el) => el.id !== selectedIdRef.current));
        setSelectedId(null);
        setPages((prev) => { emitChange(prev); return prev; });
        return;
      }

      if (e.key === "Escape") {
        setPendingText(null);
        setSelectedId(null);
        return;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [readOnly, updateElements, emitChange]);

  /* ── Text commit ── */

  const commitText = useCallback(
    (value: string) => {
      if (!pendingText) return;
      if (value.trim()) {
        const el: SketchElement = {
          id: nextId(),
          type: "text",
          x: pendingText.x,
          y: pendingText.y - 14,
          text: value.trim(),
          font: "14px sans-serif",
          color: "#333",
        };
        pushElement(el);
        setPages((prev) => { emitChange(prev); return prev; });
      }
      setPendingText(null);
    },
    [pendingText, pushElement, emitChange],
  );

  /* ── Page management ── */

  const addPage = useCallback(() => {
    const name = `Página ${pages.length + 1}`;
    setPages((prev) => {
      const next = [...prev, { nombre: name, dibujo: [] }];
      emitChange(next);
      return next;
    });
    setCurrentIdx(pages.length);
    setSelectedId(null);
  }, [pages.length, emitChange]);

  const deletePage = useCallback(
    (idx: number) => {
      if (pages.length <= 1) return;
      setPages((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        emitChange(next);
        return next;
      });
      setCurrentIdx((prev) => Math.min(prev, pages.length - 2));
      setSelectedId(null);
    },
    [pages.length, emitChange],
  );

  const renamePage = useCallback(
    (idx: number, name: string) => {
      setPages((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], nombre: name };
        emitChange(next);
        return next;
      });
      setEditingTab(null);
    },
    [emitChange],
  );

  /* ── Tool / Zoom ── */

  const handleToolChange = useCallback(
    (t: ToolType) => {
      if (readOnly && t !== "select") return;
      setTool(t);
      setPendingText(null);
    },
    [readOnly],
  );

  const setZoomLevel = useCallback((z: number) => setZoom(z), []);

  return (
    <div className={styles.sketchEditor}>
      {/* Pages tabs */}
      <div className={styles.sketchEditor__pages}>
        {pages.map((page, i) => (
          <div
            key={i}
            className={`${styles.sketchEditor__pageTab} ${i === currentIdx ? styles["sketchEditor__pageTab--active"] : ""}`}
            onClick={() => { setCurrentIdx(i); setSelectedId(null); setPendingText(null); }}
          >
            {editingTab === i ? (
              <input
                className={styles.sketchEditor__pageTabInput}
                value={tabEditValue}
                onChange={(e) => setTabEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") renamePage(i, tabEditValue);
                  if (e.key === "Escape") setEditingTab(null);
                  e.stopPropagation();
                }}
                onBlur={() => renamePage(i, tabEditValue)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{page.nombre}</span>
            )}
            {!readOnly && (
              <>
                <button
                  type="button"
                  className={styles.sketchEditor__pageBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTab(i);
                    setTabEditValue(page.nombre);
                  }}
                  title="Renombrar"
                >
                  ✎
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    className={`${styles.sketchEditor__pageBtn} ${styles["sketchEditor__pageBtn--del"]}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePage(i);
                    }}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                )}
              </>
            )}
          </div>
        ))}
        {!readOnly && (
          <button type="button" className={styles.sketchEditor__addPage} onClick={addPage} title="Agregar página">
            +
          </button>
        )}
      </div>

      {/* Body */}
      <div className={styles.sketchEditor__body}>
        {/* Toolbar */}
        <div className={styles.sketchEditor__toolbar}>
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`${styles.sketchEditor__tool} ${tool === t.id ? styles["sketchEditor__tool--active"] : ""}`}
              onClick={() => handleToolChange(t.id)}
              title={t.label}
              disabled={readOnly && t.id !== "select"}
            >
              <span>{t.icon}</span>
              <span className={styles.sketchEditor__tooltip}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className={styles.sketchEditor__canvasArea}>
          <div ref={canvasWrapRef} style={{ position: "relative", display: "inline-block", lineHeight: 0 }}>
            <canvas
              ref={canvasRef}
              className={styles.sketchEditor__canvas}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ width: CANVAS_W * zoom, height: CANVAS_H * zoom }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                if (isDrawingRef.current) {
                  isDrawingRef.current = false;
                  startRef.current = null;
                  endRef.current = null;
                  freehandRef.current = [];
                  redraw();
                }
              }}
            />

            {pendingText && (
              <div
                style={{
                  position: "absolute",
                  left: pendingText.x * zoom + 2,
                  top: pendingText.y * zoom + 2,
                  zIndex: 5,
                }}
              >
                <input
                  className={styles.sketchEditor__textInput}
                  autoFocus
                  placeholder="Escribir texto..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitText((e.target as HTMLInputElement).value);
                    if (e.key === "Escape") setPendingText(null);
                    e.stopPropagation();
                  }}
                  onBlur={(e) => commitText(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.sketchEditor__bottom}>
        <div className={styles.sketchEditor__info}>
          <span>
            {zoom * 100}% &middot; {getElements(pages, currentIdx).length} elementos
          </span>
        </div>
        <div className={styles.sketchEditor__zoom}>
          {zoomLevels.map((z) => (
            <button
              key={z}
              type="button"
              className={`${styles.sketchEditor__zoomBtn} ${zoom === z ? styles["sketchEditor__zoomBtn--active"] : ""}`}
              onClick={() => setZoomLevel(z)}
            >
              {z * 100}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
