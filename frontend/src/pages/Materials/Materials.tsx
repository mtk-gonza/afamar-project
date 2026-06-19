import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { TableActions } from "../../components/ui/TableActions";
import type { Material, MaterialColor, MaterialThickness } from "../../types";
import styles from "./Materials.module.css";

export function Materials() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Material[]>([]);
  const [colors, setColors] = useState<MaterialColor[]>([]);
  const [thicknesses, setThicknesses] = useState<MaterialThickness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newColor, setNewColor] = useState("");
  const [newThickness, setNewThickness] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mat, col, thick] = await Promise.all([api.getMaterials(), api.getColors(), api.getThicknesses()]);
      setItems(mat);
      setColors(col);
      setThicknesses(thick);
    } catch {
      setError("Error al cargar materiales");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, name: string) => {
    if (!(await confirm(`¿Eliminar material "${name}"?`, "Eliminar", true))) return;
    await api.deleteMaterial(id);
    load();
  };

  const addColor = async () => {
    if (!newColor.trim()) return;
    await api.createColor({ name: newColor.trim() });
    setNewColor("");
    api.getColors().then(setColors);
  };

  const addThickness = async () => {
    if (!newThickness.trim()) return;
    await api.createThickness({ name: newThickness.trim() });
    setNewThickness("");
    api.getThicknesses().then(setThicknesses);
  };

  return (
    <div className={styles.materials}>
      <PageHeader title="Materiales" addLink="/admin/materials/new">
        <button className={styles.materials__adminBtn} onClick={() => setShowAdmin(!showAdmin)}>
          {showAdmin ? "Cerrar" : "Gestionar colores/espesores"}
        </button>
      </PageHeader>

      {showAdmin && (
        <div className={styles.materials__admin}>
          <div className={styles.materials__adminCol}>
            <h4>Colores</h4>
            <div className={styles.materials__adminRow}>
              <input className={styles.materials__adminInput} value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Nuevo color..." />
              <button className={styles.materials__adminAdd} onClick={addColor}>+</button>
            </div>
            <ul className={styles.materials__adminList}>
              {colors.map((c) => (
                <li key={c.id}>
                  {c.name}
                  <button className={styles.materials__adminRemove} onClick={async () => { await api.deleteColor(c.id); api.getColors().then(setColors); }}>✕</button>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.materials__adminCol}>
            <h4>Espesores</h4>
            <div className={styles.materials__adminRow}>
              <input className={styles.materials__adminInput} value={newThickness} onChange={(e) => setNewThickness(e.target.value)} placeholder="Nuevo espesor..." />
              <button className={styles.materials__adminAdd} onClick={addThickness}>+</button>
            </div>
            <ul className={styles.materials__adminList}>
              {thicknesses.map((t) => (
                <li key={t.id}>
                  {t.name}
                  <button className={styles.materials__adminRemove} onClick={async () => { await api.deleteThickness(t.id); api.getThicknesses().then(setThicknesses); }}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState message="No hay materiales aún." />}

      {!loading && !error && items.length > 0 && (
        <table className={styles.materials__table}>
          <thead>
            <tr><th>Nombre</th><th>Categoría</th><th>Color</th><th>Espesor</th><th>Precio/m²</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.category_id}</td>
                <td>{m.color}</td>
                <td>{m.available_thickness}</td>
                <td>$ {m.base_price.toFixed(2)}</td>
                <TableActions onEdit={() => navigate(`/admin/materials/${m.id}/edit`)} onDelete={() => handleDelete(m.id, m.name)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
