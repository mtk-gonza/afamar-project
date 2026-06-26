import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/api/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useDebounce } from "@/hooks/useDebounce";
import type { Material } from "@/types";
import styles from "./MaterialConsultant.module.css";

interface SelectedMaterial extends Material {
  _uid: number;
}

let _nextUid = 1;

export function MaterialConsultant() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Material[]>([]);
  const [selected, setSelected] = useState<SelectedMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    api.getMaterials(0, 50)
      .then((all) => {
        const q = debouncedQuery.toLowerCase();
        const filtered = all.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (m.color && m.color.toLowerCase().includes(q)),
        );
        setResults(filtered);
        setShowDropdown(true);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addMaterial = useCallback((m: Material) => {
    setSelected((prev) => {
      if (prev.find((s) => s.id === m.id)) return prev;
      return [...prev, { ...m, _uid: _nextUid++ }];
    });
    setQuery("");
    setShowDropdown(false);
  }, []);

  const removeMaterial = useCallback((uid: number) => {
    setSelected((prev) => prev.filter((s) => s._uid !== uid));
  }, []);

  const clearAll = useCallback(() => {
    setSelected([]);
  }, []);

  return (
    <div className={styles.consultant}>
      <h2 className={styles.consultant__title}>Consultor de Materiales</h2>

      <div className={styles.consultant__searchRow}>
        <div className={styles.consultant__searchWrapper} ref={wrapperRef}>
          <input
            className={styles.consultant__searchInput}
            placeholder="Buscar material por nombre o color..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length) setShowDropdown(true); }}
          />
          {loading && <div className={styles.consultant__spinner}><LoadingSpinner /></div>}
          {showDropdown && results.length > 0 && (
            <ul className={styles.consultant__dropdown}>
              {results.map((m) => (
                <li
                  key={m.id}
                  className={styles.consultant__dropdownItem}
                  onClick={() => addMaterial(m)}
                >
                  <span className={styles.consultant__dropdownName}>{m.name}</span>
                  <span className={styles.consultant__dropdownPrice}>$ {m.base_price.toFixed(2)} / m²</span>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && query && !loading && results.length === 0 && (
            <div className={styles.consultant__empty}>Sin resultados</div>
          )}
        </div>
        {selected.length > 0 && (
          <button className={styles.consultant__clearBtn} onClick={clearAll}>
            Limpiar todo
          </button>
        )}
      </div>

      {selected.length > 0 && (
        <table className={styles.consultant__table}>
          <thead>
            <tr>
              <th>Material</th>
              <th>Color</th>
              <th>Espesor</th>
              <th>Precio m²</th>
              <th>Moneda</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {selected.map((m) => (
              <tr key={m._uid}>
                <td>{m.name}</td>
                <td>{m.color || "-"}</td>
                <td>{m.available_thickness || "-"}</td>
                <td>$ {m.base_price.toFixed(2)}</td>
                <td>{m.currency || "ARS"}</td>
                <td>
                  <button
                    className={styles.consultant__removeBtn}
                    onClick={() => removeMaterial(m._uid)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected.length === 0 && (
        <p className={styles.consultant__emptyState}>
          Busque materiales para agregarlos a la tabla comparativa.
        </p>
      )}
    </div>
  );
}
