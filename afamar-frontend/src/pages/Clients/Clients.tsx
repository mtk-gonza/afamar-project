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
import styles from "./Clients.module.css";

export function Clients() {
  const navigate = useNavigate();
  const { confirm, dialog } = useConfirm();
  const [search, setSearch] = useState("");
  const { items, loading, error, load } = useList(
    ["clients", search],
    () => search ? api.searchClients(search) : api.getClients()
  );

  const handleDelete = async (id: number, name: string) => {
    if (!(await confirm(`¿Eliminar cliente "${name}"?`, "Eliminar", true))) return;
    await api.deleteClient(id);
    load();
  };

  return (
    <div className={styles.clients}>
      <PageHeader title="Clientes" addLink="/admin/clients/new">
        <SearchInput value={search} onChange={setSearch} />
      </PageHeader>

      {loading && <LoadingSpinner />}
      {error && <ErrorBlock message={error} onRetry={() => load()} />}
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
                <TableActions onEdit={() => navigate(`/admin/clients/${c.id}/edit`)} onDelete={() => handleDelete(c.id, c.name)} />
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog}
    </div>
  );
}
