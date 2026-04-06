import { useEffect } from "react";

export default function ConfirmDialog({
  open = false,
  title = "Confirm Action",
  description = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-[#0F1729]/55 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,41,0.28)] sm:p-7">
        <div className="inline-flex rounded-full bg-[#FFF4DE] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B86D00]">
          Confirm
        </div>

        <h2 className="mt-4 text-2xl font-bold text-[#0F1729]">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-[#65758B]">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-[#D9E5EC] px-5 py-3 text-sm font-semibold text-[#4E5D72] hover:bg-[#F8FAFC]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-full bg-[#F59F0A] px-5 py-3 text-sm font-semibold text-[#0F1729] shadow-[0_12px_24px_rgba(245,159,10,0.22)] hover:bg-[#E89206]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
