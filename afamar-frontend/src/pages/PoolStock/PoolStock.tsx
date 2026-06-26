import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { useConfirm } from "@/components/ui/useConfirm";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorBlock } from "@/components/ui/ErrorBlock";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { TableActions } from "@/components/ui/TableActions";
import { useList } from "@/shared/api/hooks";
import styles from "./PoolStock.module.css";

export function PoolStock() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [search, setSearch] = useState("");
  const { items, loading, error, load } = useList(
    ["poolStock", search],
    () => search ? api.searchPoolStock(search) : api.getPoolStock()
  );

  const handleDelete = async (id: number, brand: string) => {
    if (!(await confirm(`¿Eliminar "${brand}" del stock?`, "Eliminar", true))) return;
    await api.deletePoolStock(id);
    load();
  };

  return (
    <div className={styles.poolStock}>
      <PageHeader title="Stock de Piletas" addLink="/admin/pool-stock/new">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar marca o modelo..." />
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={() => load()} />}
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
                <TableActions onEdit={() => navigate(`/admin/pool-stock/${p.id}/edit`)} onDelete={() => handleDelete(p.id, p.brand)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
