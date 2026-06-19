import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useConfirm } from "../../components/ui/useConfirm";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ErrorBlock } from "../../components/ui/ErrorBlock";
import { EmptyState } from "../../components/ui/EmptyState";
import { SearchInput } from "../../components/ui/SearchInput";
import { TableActions } from "../../components/ui/TableActions";
import type { PoolStock as PoolStockType } from "../../types";
import styles from "./PoolStock.module.css";

export function PoolStock() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
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
    if (!(await confirm(`¿Eliminar "${brand}" del stock?`, "Eliminar", true))) return;
    await api.deletePoolStock(id);
    load(search);
  };

  return (
    <div className={styles.poolStock}>
      <PageHeader title="Stock de Piletas" addLink="/pool-stock/new">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar marca o modelo..." />
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={() => load(search)} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState message={search ? "Sin resultados." : "No hay stock aún."} />
      )}

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
                <TableActions onEdit={() => navigate(`/pool-stock/${p.id}/edit`)} onDelete={() => handleDelete(p.id, p.brand)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
