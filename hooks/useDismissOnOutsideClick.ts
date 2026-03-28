import { useEffect, type RefObject } from "react";

/** Calls setOpen(false) when user clicks outside `ref`. */
export function useDismissOnOutsideClick(
  ref: RefObject<HTMLElement | null>,
  isOpen: boolean,
  setOpen: (open: boolean) => void
) {
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, ref, setOpen]);
}
