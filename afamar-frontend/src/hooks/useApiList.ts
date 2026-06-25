import { useCallback, useEffect, useState } from "react";

interface UseApiListResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export function useApiList<T>(
  fetcher: () => Promise<T[]>,
  errorMsg = "Error al cargar datos",
): UseApiListResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetcher());
    } catch {
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetcher, errorMsg]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, load };
}
