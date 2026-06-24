import { useRef, useEffect, useCallback } from "react";
import styles from "./SignaturePad.module.css";

interface SignaturePadProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  label?: string;
  height?: number;
  readOnly?: boolean;
}

export function SignaturePad({
  value,
  onChange,
  label = "Firma",
  height = 120,
  readOnly = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const width = 400;

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx);
  }, [height]);

  function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.moveTo(10, height - 20);
    ctx.lineTo(width - 10, height - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.textAlign = "left";
    ctx.fillText(label, 12, height - 8);
  }

  const redrawImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = value;
  }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (readOnly && value) {
      redrawImage();
      return;
    }

    if (!value) {
      clearCanvas();
      return;
    }

    if (!drawing.current) {
      redrawImage();
    }
  }, [value, readOnly, clearCanvas, redrawImage]);

  useEffect(() => {
    if (!readOnly && !value) {
      clearCanvas();
    }
  }, [readOnly, clearCanvas]);

  function getPos(e: React.MouseEvent | MouseEvent | TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      if (!touch) return null;
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }

    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if (readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e.nativeEvent);
    if (!pos) return;

    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (readOnly || !drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e.nativeEvent);
    if (!pos) return;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!drawing.current) return;
    drawing.current = false;
    if (!onChange) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }

  function handleClear() {
    clearCanvas();
    onChange?.(null);
  }

  return (
    <div className={styles.signaturePad}>
      <canvas
        ref={canvasRef}
        className={styles.signaturePad__canvas}
        width={width}
        height={height}
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!readOnly && (
        <button
          type="button"
          className={styles.signaturePad__clearBtn}
          onClick={handleClear}
        >
          Limpiar
        </button>
      )}
    </div>
  );
}
