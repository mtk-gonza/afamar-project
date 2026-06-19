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
import type { Client } from "../../types";
import styles from "./Clients.module.css";

export function Clients() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [items, setItems] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setError(null);
    try {
      const result = q ? await api.searchClients(q) : await api.getClients();
      setItems(result);
    } catch {
      setError("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(search); }, [search, load]);

  const handleDelete = async (id: number, name: string) => {
    if (!(await confirm(`¿Eliminar cliente "${name}"?`, "Eliminar", true))) return;
    await api.deleteClient(id);
    load(search);
  };

  return (
    <div className={styles.clients}>
      <PageHeader title="Clientes" addLink="/clients/new">
        <SearchInput value={search} onChange={setSearch} />
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={() => load(search)} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState message={search ? "Sin resultados." : "No hay clientes aún."} />
      )}

      {!loading && !error && items.length > 0 && (
        <table className={styles.clients__table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Total Comprado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.address}</td>
                <td>$ {c.total_purchased.toFixed(2)}</td>
                <TableActions onEdit={() => navigate(`/clients/${c.id}/edit`)} onDelete={() => handleDelete(c.id, c.name)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
