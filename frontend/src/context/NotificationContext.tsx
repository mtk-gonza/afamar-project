import { createContext, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface NotificationContextType {
  toasts: Toast[];
  notify: (message: string, type?: ToastType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

let nextId = 0;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, notify }}>
      {children}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              background: t.type === "success" ? "#27ae60" : t.type === "error" ? "#e74c3c" : "#2980b9",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotify must be inside NotificationProvider");
  return ctx.notify;
}
