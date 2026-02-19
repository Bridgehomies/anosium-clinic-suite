// src/components/invoice/StatusPill.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

/**
 * Backend status enum (source of truth)
 */
export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "CANCELLED";

/**
 * UI configuration mapped from backend values
 */
const STATUS_CONFIG: Record<
  InvoiceStatus,
  {
    label: string;
    pillClass: string;
    dotClass: string;
    selectable?: boolean;
  }
> = {
  DRAFT: {
    label: "Draft",
    pillClass: "bg-gray-100 text-gray-800",
    dotClass: "bg-gray-400",
  },
  PENDING: {
    label: "Pending",
    pillClass: "bg-yellow-100 text-yellow-800",
    dotClass: "bg-yellow-500",
  },
  PAID: {
    label: "Paid",
    pillClass: "bg-green-100 text-green-800",
    dotClass: "bg-green-500",
  },
  PARTIALLY_PAID: {
    label: "Partially Paid",
    pillClass: "bg-blue-100 text-blue-800",
    dotClass: "bg-blue-500",
  },
  OVERDUE: {
    label: "Overdue",
    pillClass: "bg-red-100 text-red-800",
    dotClass: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelled",
    pillClass: "bg-zinc-100 text-zinc-600",
    dotClass: "bg-zinc-400",
    selectable: false,
  },
};

type Props = {
  status: InvoiceStatus;
  onChange?: (status: InvoiceStatus) => void;
  disabled?: boolean;
};

export default function StatusPill({
  status,
  onChange,
  disabled = false,
}: Props) {
  const current = STATUS_CONFIG[status];

  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const interactive = !!onChange && !disabled;

  // capture button position
  useEffect(() => {
    if (open && buttonRef.current) {
      setRect(buttonRef.current.getBoundingClientRect());
    }
  }, [open]);

  // close on outside click
  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${current.pillClass} ${
          interactive ? "cursor-pointer" : "cursor-default opacity-70"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dotClass}`} />
        {current.label}
        {interactive && <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {open && rect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[10000] min-w-[160px] rounded-md border border-border bg-popover shadow-lg py-1"
            style={{
              top: rect.bottom + 6,
              left: rect.left,
            }}
          >
            {(Object.keys(STATUS_CONFIG) as InvoiceStatus[]).map((key) => {
              const c = STATUS_CONFIG[key];
              const active = key === status;

              if (c.selectable === false) return null;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange?.(key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted ${
                    active ? "bg-muted" : ""
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${c.dotClass}`} />
                  {c.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
