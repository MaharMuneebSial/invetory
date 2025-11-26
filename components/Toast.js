"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, X, Info, AlertCircle } from "lucide-react";

export default function Toast({ message, type = "info", duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  };

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  return (
    <div
      className={`fixed top-12 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        styles[type]
      } ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
    >
      {icons[type]}
      <span className="text-[12px] font-medium">{message}</span>
      <button onClick={handleClose} className="ml-2 p-0.5 rounded hover:bg-black/5 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Toast Container to manage multiple toasts
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-12 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg animate-in slide-in-from-right duration-300 ${
            toast.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
            toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
            toast.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
            "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {toast.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
          {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          {toast.type === "info" && <Info className="w-4 h-4 text-blue-500" />}
          <span className="text-[12px] font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-2 p-0.5 rounded hover:bg-black/5 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Custom hook for toast management
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}
