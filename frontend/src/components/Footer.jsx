import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import api from "../api/api";
import {
  fallbackSupportPages,
  supportPageDefinitions,
} from "../data/supportPages";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Test Packages", to: "/test" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Results", to: "/result" },
];

const defaultSupportLinks = [
  { label: "Help Center", to: "/bookcounselling" },
  ...Object.values(fallbackSupportPages)
    .filter((page) => page.enabled !== false)
    .map((page) => ({
      label: page.title,
      to: page.path || supportPageDefinitions[page.key]?.path || "/",
    })),
];

export default function Footer() {
  const [supportPages, setSupportPages] = useState(fallbackSupportPages);

  useEffect(() => {
    let cancelled = false;

    api
      .get("/v1/public/support-pages")
      .then((res) => {
        if (cancelled) return;
        setSupportPages(res?.data?.data?.pages || fallbackSupportPages);
      })
      .catch(() => {
        if (cancelled) return;
        setSupportPages(fallbackSupportPages);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const supportLinks = useMemo(() => {
    const dynamicLinks = Object.values(supportPages || {})
      .filter((page) => page?.enabled !== false)
      .map((page) => ({
        label:
          page?.title ||
          supportPageDefinitions[page?.key || ""]?.title ||
          "Support Page",
        to:
          page?.path ||
          supportPageDefinitions[page?.key || ""]?.path ||
          "/",
      }));

    if (!dynamicLinks.length) {
      return defaultSupportLinks;
    }

    return [{ label: "Help Center", to: "/bookcounselling" }, ...dynamicLinks];
  }, [supportPages]);

  return (
    <footer className="bg-[#060708] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.85fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#188B8B] text-lg font-bold text-white">
              J
            </div>
            <h3 className="text-2xl font-bold">Jumpstart</h3>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            Psychologist-designed career aptitude tests to help you discover
            your ideal career path.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Quick Links
          </h4>
          <ul className="mt-5 space-y-3 text-sm text-white/80">
            {quickLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Support
          </h4>
          <ul className="mt-5 space-y-3 text-sm text-white/80">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/60">
            Contact Us
          </h4>
          <ul className="mt-5 space-y-4 text-sm text-white/80">
            <li className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#34D3CB]" />
              support@jumpstart.com
            </li>
            <li className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#34D3CB]" />
              +1 (555) 123-4567
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-[#34D3CB]" />
              123 Education St, Learning City
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-center text-sm text-white/55 sm:px-6 lg:px-8">
        (c) 2026. Jumpstart Education. All Rights Reserved.
      </div>
    </footer>
  );
}
