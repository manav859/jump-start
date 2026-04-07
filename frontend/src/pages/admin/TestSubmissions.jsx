import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";
import api from "../../api/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ResultStatusBadge from "../../components/admin/ResultStatusBadge";
import { emitAdminNotificationsRefresh } from "../../utils/adminNotifications";
import { TableSkeleton } from "../../components/admin/Skeletons";

export default function TestSubmissions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    api
      .get("/v1/admin/submissions")
      .then((res) => setRows(res?.data?.data || []))
      .catch((err) =>
        setActionError(err?.response?.data?.msg || "Failed to load submissions.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          row.name.toLowerCase().includes(query) ||
          row.email.toLowerCase().includes(query);
        const matchesStatus = statusFilter ? row.status === statusFilter : true;
        const matchesType = typeFilter ? row.type === typeFilter : true;
        return matchesSearch && matchesStatus && matchesType;
      }),
    [rows, search, statusFilter, typeFilter]
  );

  const availableTests = useMemo(
    () => [...new Set(rows.map((row) => row.type).filter(Boolean))].sort(),
    [rows]
  );

  const handleApprove = async (row) => {
    setActionError("");
    setApprovingId(row.id);
    try {
      await api.patch(`/v1/admin/results/${row.id}/approve`);
      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, status: "Published", canApprove: false }
            : item
        )
      );
      emitAdminNotificationsRefresh();
    } catch (err) {
      setActionError(err?.response?.data?.msg || "Failed to publish this result.");
    } finally {
      setApprovingId("");
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      "Delete this submitted result from the admin workflow?"
    );
    if (!confirmed) return;

    setActionError("");
    setDeletingId(row.id);
    try {
      await api.delete(`/v1/admin/results/${row.id}`);
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      emitAdminNotificationsRefresh();
    } catch (err) {
      setActionError(err?.response?.data?.msg || "Failed to delete this result.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-8">
      <AdminPageHeader
        title="Test Submission"
        subtitle="Review submitted student assessments, inspect the detailed score breakdown, and publish results only after an admin review."
      />

      <section className="surface-card mt-8 rounded-[28px] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94A6]" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-[16px] border border-[#E1EAF0] bg-[#FBFCFD] py-3 pl-11 pr-4 text-sm text-[#0F1729] outline-none focus:border-[#9BD9D6]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:w-auto">
            <div className="relative min-w-[180px]">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-[16px] border border-[#E1EAF0] bg-[#FBFCFD] px-4 py-3 text-sm text-[#4E5D72] outline-none focus:border-[#9BD9D6]"
              >
                <option value="">All Status</option>
                <option value="Submitted">Submitted</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Published">Published</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94A6]" />
            </div>

            <div className="relative min-w-[160px]">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full appearance-none rounded-[16px] border border-[#E1EAF0] bg-[#FBFCFD] px-4 py-3 text-sm text-[#4E5D72] outline-none focus:border-[#9BD9D6]"
              >
                <option value="">All Tests</option>
                {availableTests.map((testName) => (
                  <option key={testName} value={testName}>
                    {testName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94A6]" />
            </div>
          </div>
        </div>

        {actionError ? <p className="mt-4 text-sm text-red-600">{actionError}</p> : null}

        <div className="mt-6 overflow-hidden rounded-[24px] border border-[#E5EEF2]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-[#F7FBFB]">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Student
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Test
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A94A6]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F6] bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-0 border-none">
                      <TableSkeleton rows={5} cols={6} />
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-[#65758B]"
                    >
                      No submitted tests found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#FBFCFD]">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#CFEDED] bg-[#EAFBFB] text-xs font-bold text-[#188B8B]">
                            {row.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#0F1729]">{row.name}</p>
                            <p className="text-xs text-[#8A94A6]">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-[#4E5D72]">
                        {row.type}
                      </td>
                      <td className="px-6 py-5 text-sm text-[#4E5D72]">{row.date}</td>
                      <td className="px-6 py-5 text-sm text-[#4E5D72]">{row.duration}</td>
                      <td className="px-6 py-5">
                        <ResultStatusBadge status={row.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/testsubmissions/${row.id}`)}
                            className="inline-flex items-center gap-2 rounded-[12px] border border-[#D7E4EA] bg-white px-3 py-2 text-xs font-semibold text-[#0F1729] hover:bg-[#F8FAFC]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View / Process
                          </button>

                          {row.canApprove ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(row)}
                              disabled={approvingId === row.id}
                              className="inline-flex items-center gap-2 rounded-[12px] bg-[#188B8B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#147979] disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {approvingId === row.id
                                ? "Publishing..."
                                : "Approve & Publish"}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === row.id}
                            className="inline-flex items-center gap-2 rounded-[12px] border border-[#F3C7C7] bg-[#FFF5F5] px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FEEBEC] disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingId === row.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
