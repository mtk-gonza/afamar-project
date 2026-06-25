import { useCallback, useEffect, useRef, useState } from "react";

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
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetcherRef.current());
    } catch {
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [errorMsg]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, load };
}
