import { getAdminResultStatusMeta } from "../../data/adminReview";

export default function ResultStatusBadge({ status }) {
  const meta = getAdminResultStatusMeta(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}
