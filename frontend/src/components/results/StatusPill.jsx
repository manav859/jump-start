export default function StatusPill({ label, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
