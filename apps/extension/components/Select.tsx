import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface SelectProps<T extends string = string> {
  value: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  // The dialog renders inside a shadow root where document-level events still
  // work, so we don't need a Radix portal — the menu opens inline below the
  // trigger and gets click-outside via a document listener.
}

export function Select<T extends string = string>({
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  // Outside-click + Escape close. Listening on the wrap's owner document keeps
  // this working when the component is rendered inside a shadow root — the
  // events bubble up to the document either way, but composedPath() lets us
  // check whether the click lands inside our rendered tree.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const path = e.composedPath ? e.composedPath() : [];
      if (
        wrapRef.current &&
        (path.includes(wrapRef.current) ||
          wrapRef.current.contains(e.target as Node))
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) =>
          options.length === 0 ? 0 : (h + 1) % options.length,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) =>
          options.length === 0 ? 0 : (h - 1 + options.length) % options.length,
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };
    document.addEventListener("mousedown", onPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, options, highlight, onChange]);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      if (!disabled) {
        setHighlight(
          Math.max(
            0,
            options.findIndex((o) => o.value === value),
          ),
        );
        setOpen(true);
      }
    }
  };

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setHighlight(
            Math.max(
              0,
              options.findIndex((o) => o.value === value),
            ),
          );
          setOpen((v) => !v);
        }}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          ...styles.trigger,
          ...(open ? styles.triggerOpen : null),
          ...(disabled ? styles.triggerDisabled : null),
        }}
      >
        <span style={styles.triggerLabel}>
          {selected ? (
            selected.label
          ) : (
            <span style={styles.placeholder}>{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} style={styles.chevron} />
      </button>

      {open ? (
        <div role="listbox" style={styles.menu}>
          {options.length === 0 ? (
            <div style={styles.empty}>No options</div>
          ) : (
            options.map((opt, i) => {
              const active = opt.value === value;
              const isHi = i === highlight;
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={active}
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  style={{
                    ...styles.item,
                    ...(isHi ? styles.itemActive : null),
                  }}
                >
                  <span style={styles.itemBody}>
                    <span style={styles.itemLabel}>{opt.label}</span>
                    {opt.description ? (
                      <span style={styles.itemDescription}>
                        {opt.description}
                      </span>
                    ) : null}
                  </span>
                  {active ? <Check size={14} style={styles.check} /> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

// Token approximations from the web app's globals.css (oklch → rough sRGB)
// so the extension reads as part of the same product.
const T = {
  bg: "#ffffff",
  inputBg: "rgba(20, 17, 15, 0.045)", // bg-input/50
  ink: "#14110f",
  inkSoft: "#5a554f",
  inkMute: "#9e9890",
  border: "rgba(20, 17, 15, 0.10)", // matches --border at light theme
  borderStrong: "rgba(20, 17, 15, 0.18)",
  ring: "rgba(20, 17, 15, 0.15)",
  primary: "#3a62f5",
  popoverBg: "#ffffff",
  itemHover: "rgba(20, 17, 15, 0.05)",
} as const;

const styles: Record<string, React.CSSProperties> = {
  wrap: { position: "relative", flex: 1, fontFamily: "inherit" },
  trigger: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    width: "100%",
    height: 36,
    padding: "0 12px",
    background: T.inputBg,
    color: T.ink,
    border: "1px solid transparent",
    borderRadius: 9999,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    fontFamily: "inherit",
    transition:
      "background 120ms ease, box-shadow 120ms ease, border-color 120ms ease",
    outline: "none",
    textAlign: "left",
  },
  triggerOpen: {
    borderColor: T.ring,
    boxShadow: `0 0 0 3px ${T.ring}`,
    background: T.bg,
  },
  triggerDisabled: { opacity: 0.5, cursor: "not-allowed" },
  triggerLabel: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  placeholder: { color: T.inkMute },
  chevron: { color: T.inkSoft, flex: "0 0 auto" },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 100,
    background: T.popoverBg,
    border: `1px solid ${T.border}`,
    borderRadius: 18,
    padding: 6,
    boxShadow: "0 14px 40px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)",
    maxHeight: 280,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    color: T.ink,
    textAlign: "left",
    width: "100%",
  },
  itemActive: { background: T.itemHover },
  itemBody: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    overflow: "hidden",
  },
  itemLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  itemDescription: { fontSize: 11, color: T.inkSoft, fontWeight: 400 },
  check: { color: T.primary },
  empty: { padding: "10px 12px", color: T.inkMute, fontSize: 12 },
};
