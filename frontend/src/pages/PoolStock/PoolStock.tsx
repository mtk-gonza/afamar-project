import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { PoolStock as PoolStockType } from "../../types";
import styles from "./PoolStock.module.css";

export function PoolStock() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PoolStockType[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const result = q ? await api.searchPoolStock(q) : await api.getPoolStock();
      setItems(result);
    } catch {
      setError("Error al cargar stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search); }, [search, load]);

  const handleDelete = async (id: number, brand: string) => {
    if (!confirm(`¿Eliminar "${brand}" del stock?`)) return;
    await api.deletePoolStock(id);
    load(search);
  };

  return (
    <div className={styles.poolStock}>
      <div className={styles.poolStock__header}>
        <h2 className={styles.poolStock__title}>Stock de Piletas</h2>
        <div className={styles.poolStock__toolbar}>
          <input className={styles.poolStock__search} type="text" placeholder="Buscar marca o modelo..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Link to="/pool-stock/new" className={styles.poolStock__addBtn}>+ Nuevo</Link>
        </div>
      </div>

      {loading && <div className={styles.poolStock__state}>Cargando...</div>}
      {error && (
        <div className={styles.poolStock__state}>
          <p>{error}</p>
          <button className={styles.poolStock__addBtn} onClick={() => load(search)}>Reintentar</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <div className={styles.poolStock__state}>{search ? "Sin resultados." : "No hay stock aún."}</div>}

      {!loading && !error && items.length > 0 && (
        <table className={styles.poolStock__table}>
          <thead>
            <tr><th>Marca</th><th>Modelo</th><th>Material</th><th>Cantidad</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.brand}</td>
                <td>{p.model}</td>
                <td>{p.material}</td>
                <td>{p.quantity}</td>
                <td className={styles.poolStock__actions}>
                  <button className={styles.poolStock__actionBtn} onClick={() => navigate(`/pool-stock/${p.id}/edit`)}>Editar</button>
                  <button className={`${styles.poolStock__actionBtn} ${styles["poolStock__actionBtn--danger"]}`} onClick={() => handleDelete(p.id, p.brand)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
