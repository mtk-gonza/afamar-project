import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { Client } from "../../types";
import styles from "./Clients.module.css";

export function Clients() {
  const navigate = useNavigate();
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
    if (!confirm(`¿Eliminar cliente "${name}"?`)) return;
    await api.deleteClient(id);
    load(search);
  };

  return (
    <div className={styles.clients}>
      <div className={styles.clients__header}>
        <h2 className={styles.clients__title}>Clientes</h2>
        <div className={styles.clients__toolbar}>
          <input className={styles.clients__search} type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Link to="/clients/new" className={styles.clients__addBtn}>+ Nuevo</Link>
        </div>
      </div>

      {loading && <div className={styles.clients__state}>Cargando...</div>}
      {error && (
        <div className={styles.clients__state}>
          <p>{error}</p>
          <button className={styles.clients__addBtn} onClick={() => load(search)}>Reintentar</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && <div className={styles.clients__state}>{search ? "Sin resultados." : "No hay clientes aún."}</div>}

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
                <td className={styles.clients__actions}>
                  <button className={styles.clients__actionBtn} onClick={() => navigate(`/clients/${c.id}/edit`)}>Editar</button>
                  <button className={`${styles.clients__actionBtn} ${styles["clients__actionBtn--danger"]}`} onClick={() => handleDelete(c.id, c.name)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
