import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AdminPageHeader({
  title,
  subtitle,
  backTo,
  backLabel = "Back",
  actions = null,
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        {backTo ? (
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 rounded-full border border-[#D9E5EC] bg-white px-4 py-2 text-sm font-semibold text-[#4E5D72] shadow-sm hover:border-[#BBD6D7] hover:bg-[#FBFCFD]"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#0F1729] md:text-4xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[#65758B]">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
