import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { Toast, type ToastData } from "./Toast";

type ToastContextValue = {
  showToast: (title: string, description: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([
    {
      id: 1,
      title: "Frontend preview ready",
      description: "Navigation and mock interactions are active across all six routes."
    }
  ]);

  const showToast = useCallback((title: string, description: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description }]);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              toast={toast}
              onDismiss={(id) => setToasts((current) => current.filter((item) => item.id !== id))}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
