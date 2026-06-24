import { useCallback, useEffect, useRef, useState } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: any[] = []): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (mounted.current) setData(result);
    } catch (err: any) {
      if (mounted.current) setError(err?.message || "Error");
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    fetch();
    return () => { mounted.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useMutation<T, A extends any[]>(
  fn: (...args: A) => Promise<T>,
  options?: UseMutationOptions<T>,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (...args: A) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      options?.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const msg = err?.message || "Error";
      setError(msg);
      options?.onError?.(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn, options]);

  return { mutate, loading, error };
}
