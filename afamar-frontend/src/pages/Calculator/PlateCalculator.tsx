import { useState } from "react";
import styles from "./Calculator.module.css";

const ANCHO_DISCO = 0.003;

interface PlatePiece {
  id: number;
  length: number;
  width: number;
  quantity: number;
}

let nextPieceId = 1;

export function PlateCalculator() {
  const [pieces, setPieces] = useState<PlatePiece[]>([]);
  const [formLength, setFormLength] = useState(0);
  const [formWidth, setFormWidth] = useState(0);
  const [formQuantity, setFormQuantity] = useState(1);
  const [plateW, setPlateW] = useState(3.0);
  const [plateH, setPlateH] = useState(1.8);

  const addPiece = () => {
    if (formLength <= 0 || formWidth <= 0 || formQuantity <= 0) return;
    setPieces([
      ...pieces,
      { id: nextPieceId++, length: formLength, width: formWidth, quantity: formQuantity },
    ]);
    setFormLength(0);
    setFormWidth(0);
    setFormQuantity(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addPiece();
  };

  const removePiece = (id: number) => {
    setPieces(pieces.filter((p) => p.id !== id));
  };

  const totalM2 = pieces.reduce((s, p) => s + p.length * p.width * p.quantity, 0);
  const totalM2Bruto = pieces.reduce(
    (s, p) => s + (p.length + ANCHO_DISCO) * (p.width + ANCHO_DISCO) * p.quantity,
    0,
  );
  const plateArea = plateW * plateH;
  const placasNecesarias = plateArea > 0 ? Math.ceil(totalM2Bruto / plateArea) : 0;
  const utilizacion =
    placasNecesarias > 0 && plateArea > 0
      ? (totalM2Bruto / (placasNecesarias * plateArea)) * 100
      : 0;
  const desperdicio = 100 - utilizacion;

  const barColor =
    utilizacion >= 80 ? "#27ae60" : utilizacion >= 60 ? "#f39c12" : "#e74c3c";

  return (
    <div className={styles.calculator}>
      <h2 className={styles.calculator__title}>Calculadora de Placas</h2>

      <div className={`${styles.calculator__toolbar} ${styles.calculator__plateTools}`}>
        <label className={styles.calculator__plateLabel}>
          Placa Ancho (m)
          <input
            className={styles.calculator__plateInput}
            type="number"
            step="0.01"
            value={plateW}
            onChange={(e) => setPlateW(Number(e.target.value))}
          />
        </label>
        <label className={styles.calculator__plateLabel}>
          Placa Alto (m)
          <input
            className={styles.calculator__plateInput}
            type="number"
            step="0.01"
            value={plateH}
            onChange={(e) => setPlateH(Number(e.target.value))}
          />
        </label>
        <span style={{ fontSize: "0.8rem", color: "#888", alignSelf: "center" }}>
          Disco: {ANCHO_DISCO}m por lado
        </span>
      </div>

      <div className={styles.calculator__plateForm}>
        <label className={styles.calculator__plateLabel}>
          Largo (m)
          <input
            className={styles.calculator__plateInput}
            type="number"
            step="0.001"
            value={formLength || ""}
            onChange={(e) => setFormLength(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="0.000"
          />
        </label>
        <label className={styles.calculator__plateLabel}>
          Ancho (m)
          <input
            className={styles.calculator__plateInput}
            type="number"
            step="0.001"
            value={formWidth || ""}
            onChange={(e) => setFormWidth(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="0.000"
          />
        </label>
        <label className={styles.calculator__plateLabel}>
          Cant.
          <input
            className={styles.calculator__plateInput}
            type="number"
            value={formQuantity}
            min={1}
            onChange={(e) => setFormQuantity(Math.max(1, Number(e.target.value)))}
            onKeyDown={handleKeyDown}
          />
        </label>
        <button
          className={styles.calculator__addBtn}
          onClick={addPiece}
          style={{ alignSelf: "flex-end", width: "auto", padding: "0.4rem 1rem" }}
        >
          + Agregar pieza
        </button>
      </div>

      {pieces.length > 0 ? (
        <>
          <div className={styles.calculator__table} style={{ marginTop: "1rem" }}>
            <div className={`${styles.calculator__thRow} ${styles["calculator__thRow--plate"]}`}>
              <span>#</span>
              <span>Largo</span>
              <span>Ancho</span>
              <span>M² c/u</span>
              <span>Cant.</span>
              <span>Total M²</span>
              <span />
            </div>
            {pieces.map((p, i) => (
              <div
                key={p.id}
                className={`${styles.calculator__tdRow} ${styles["calculator__tdRow--plate"]}`}
              >
                <span style={{ fontSize: "0.82rem", color: "#888" }}>{i + 1}</span>
                <span className={styles.calculator__m2}>{p.length.toFixed(3)}</span>
                <span className={styles.calculator__m2}>{p.width.toFixed(3)}</span>
                <span className={styles.calculator__m2}>{(p.length * p.width).toFixed(4)}</span>
                <span className={styles.calculator__m2}>{p.quantity}</span>
                <span className={styles.calculator__m2}>
                  {(p.length * p.width * p.quantity).toFixed(4)}
                </span>
                <button className={styles.calculator__removeBtn} onClick={() => removePiece(p.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button className={styles.calculator__plateClearBtn} onClick={() => setPieces([])}>
            Limpiar todas las piezas
          </button>

          <div
            className={`${styles.calculator__totals} ${styles.calculator__plateResults}`}
            style={{ maxWidth: "100%", marginTop: "1rem" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 2rem" }}>
              <div className={styles.calculator__totalRow}>
                <span>Total M² Neto</span>
                <span>{totalM2.toFixed(4)}</span>
              </div>
              <div className={styles.calculator__totalRow}>
                <span>Total M² Bruto</span>
                <span>{totalM2Bruto.toFixed(4)}</span>
              </div>
              <div className={styles.calculator__totalRow}>
                <span>Placas Necesarias</span>
                <span>{placasNecesarias}</span>
              </div>
              <div className={styles.calculator__totalRow}>
                <span>Utilización</span>
                <span>{utilizacion.toFixed(1)}%</span>
              </div>
              <div className={styles.calculator__totalRow}>
                <span>Desperdicio</span>
                <span>{desperdicio.toFixed(1)}%</span>
              </div>
            </div>

            <div className={styles.calculator__plateBar} style={{ marginTop: "1rem" }}>
              <div
                className={styles.calculator__plateBarFill}
                style={{
                  width: `${Math.min(utilizacion, 100)}%`,
                  backgroundColor: barColor,
                }}
              >
                {utilizacion >= 15 && `${utilizacion.toFixed(1)}%`}
              </div>
            </div>
            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 500,
                color: barColor,
                marginTop: "0.25rem",
                display: "inline-block",
              }}
            >
              {utilizacion >= 80
                ? "✓ Buena utilización"
                : utilizacion >= 60
                  ? "⚠ Utilización media"
                  : "✗ Baja utilización"}
            </span>
          </div>
        </>
      ) : (
        <div className={styles.calculator__plateEmpty}>
          No hay piezas cargadas. Agregue piezas utilizando el formulario superior.
        </div>
      )}
    </div>
  );
}
