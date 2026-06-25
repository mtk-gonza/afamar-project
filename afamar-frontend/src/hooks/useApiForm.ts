import { useCallback, useEffect, useRef, useState } from "react";

interface UseApiFormResult {
  dataLoading: boolean;
  dataError: string | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  loadData: () => Promise<void>;
  mounted: React.MutableRefObject<boolean>;
}

export function useApiForm(loaders: (() => Promise<unknown>)[] = []): UseApiFormResult {
  const [dataLoading, setDataLoading] = useState(loaders.length > 0);
  const [dataError, setDataError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (loaders.length === 0) return;
    setDataLoading(true);
    setDataError(null);
    const results = await Promise.allSettled(loaders.map((fn) => fn()));
    if (!mounted.current) return;
    const rejected = results.find((r) => r.status === "rejected");
    if (rejected) {
      setDataError("Error al cargar datos del formulario");
    }
    setDataLoading(false);
  }, [loaders]);

  useEffect(() => { loadData(); }, [loadData]);

  return { dataLoading, dataError, saving, setSaving, loadData, mounted };
}
