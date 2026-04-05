import React, { useMemo, useState, useEffect } from "react";
import api from "../../api/api";

const blankPackage = {
  id: "",
  title: "",
  badge: "Recommended",
  amount: 0,
  strikeAmount: "",
  features: [],
  durationText: "",
  active: true,
  sortOrder: 1,
  sections: [],
};

const blankSection = (idx) => ({
  sectionId: idx,
  title: `Section ${idx}`,
  durationMinutes: 20,
  enabled: true,
  scoringType: "mixed",
  sheetCsvUrl: "",
  questions: [],
});

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState("");
  const [packages, setPackages] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(blankPackage);
  const [featuresText, setFeaturesText] = useState("");
  const [editingSection, setEditingSection] = useState(null);

  const selectedPackage = useMemo(() => packages.find((p) => p.id === selectedId) || null, [packages, selectedId]);

  const hydrateDraft = (pkg) => {
    if (!pkg) {
      setDraft(blankPackage);
      setFeaturesText("");
      return;
    }
    setDraft({
      ...blankPackage,
      ...pkg,
      strikeAmount: pkg.strikeAmount ?? "",
      sections: Array.isArray(pkg.sections) ? [...pkg.sections].sort((a, b) => a.sectionId - b.sectionId) : [],
    });
    setFeaturesText((pkg.features || []).join("\n"));
  };

  const load = () => {
    setLoading(true);
    api
      .get("/v1/admin/config")
      .then((res) => {
        const list = res?.data?.data?.packages || [];
        setPackages(list);
        const id = list[0]?.id || "";
        setSelectedId(id);
        hydrateDraft(list[0] || null);
      })
      .catch((err) => setError(err?.response?.data?.msg || "Failed to load packages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const pick = (id) => {
    setSelectedId(id);
    hydrateDraft(packages.find((p) => p.id === id) || null);
  };

  const createPackage = () => {
    setError("");
    setSuccess("");
    const id = `pkg-${Date.now()}`;
    const pkg = {
      ...blankPackage,
      id,
      title: "New Package",
      sortOrder: packages.length + 1,
      sections: [1, 2, 3, 4, 5].map((n) => blankSection(n)),
    };
    api
      .post("/v1/admin/packages", pkg)
      .then(() => {
        setSuccess("Package created.");
        load();
        setSelectedId(id);
      })
      .catch((err) => setError(err?.response?.data?.msg || "Failed to create package"));
  };

  const savePackage = () => {
    if (!draft.id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = {
      id: draft.id,
      title: draft.title,
      badge: draft.badge,
      amount: Number(draft.amount || 0),
      strikeAmount: draft.strikeAmount === "" ? null : Number(draft.strikeAmount),
      features: featuresText.split("\n").map((x) => x.trim()).filter(Boolean),
      durationText: draft.durationText,
      active: draft.active !== false,
      sortOrder: Number(draft.sortOrder || 1),
    };
    api
      .put(`/v1/admin/packages/${draft.id}`, payload)
      .then(() => api.put(`/v1/admin/packages/${draft.id}/sections`, { sections: draft.sections }))
      .then(() => {
        setSuccess("Package + sections saved.");
        load();
      })
      .catch((err) => setError(err?.response?.data?.msg || "Failed to save package"))
      .finally(() => setSaving(false));
  };

  const deletePackage = () => {
    if (!draft.id) return;
    if (!window.confirm(`Delete package "${draft.title}"?`)) return;
    setError("");
    setSuccess("");
    api
      .delete(`/v1/admin/packages/${draft.id}`)
      .then(() => {
        setSuccess("Package deleted.");
        load();
      })
      .catch((err) => setError(err?.response?.data?.msg || "Failed to delete package"));
  };

  const updateSection = (index, patch) => {
    const next = [...draft.sections];
    next[index] = { ...next[index], ...patch };
    setDraft((d) => ({ ...d, sections: next }));
  };

  const addSection = () => {
    const maxId = Math.max(0, ...draft.sections.map((s) => Number(s.sectionId || 0)));
    const next = blankSection(maxId + 1);
    setDraft((d) => ({ ...d, sections: [...d.sections, next] }));
    setEditingSection(String(next.sectionId));
  };

  const removeSection = (sectionId) => {
    if (!window.confirm(`Delete section ${sectionId}?`)) return;
    setDraft((d) => ({
      ...d,
      sections: d.sections.filter((s) => String(s.sectionId) !== String(sectionId)),
    }));
    if (String(editingSection) === String(sectionId)) setEditingSection(null);
  };

  const syncSection = (section) => {
    if (!draft.id || !section.sheetCsvUrl) {
      setError("Enter Google Sheet CSV URL before sync.");
      return;
    }
    setSyncing(`${draft.id}:${section.sectionId}`);
    setError("");
    setSuccess("");
    api
      .post(`/v1/admin/packages/${draft.id}/sections/${section.sectionId}/sync-google-sheet`, { csvUrl: section.sheetCsvUrl })
      .then((res) => {
        const count = res?.data?.data?.section?.totalQuestions ?? 0;
        setSuccess(`Section ${section.sectionId} synced (${count} questions).`);
        load();
      })
      .catch((err) => setError(err?.response?.data?.msg || "Failed to sync section"))
      .finally(() => setSyncing(""));
  };

  if (loading) return <div className="p-6 md:p-8">Loading settings...</div>;

  return (
    <div className="p-6 md:p-8 max-w-[1280px] mx-auto w-full flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Package Manager</h1>
          <p className="text-gray-500 mt-1">Create multiple packages with different sections/questions.</p>
        </div>
        <button onClick={createPackage} className="px-4 py-2 rounded-lg bg-[#188B8B] text-white text-sm font-semibold">
          + Add Package
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-2">
        {packages.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              selectedId === p.id ? "bg-[#188B8B] text-white border-[#188B8B]" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {selectedPackage ? (
        <>
          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={draft.id} onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Package ID" />
              <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Title" />
              <input value={draft.badge} onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Badge" />
              <input type="number" value={draft.amount} onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Amount" />
              <input type="number" value={draft.strikeAmount} onChange={(e) => setDraft((d) => ({ ...d, strikeAmount: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Strike Amount" />
              <input value={draft.durationText} onChange={(e) => setDraft((d) => ({ ...d, durationText: e.target.value }))} className="border rounded-lg px-3 py-2" placeholder="Duration text" />
            </div>
            <textarea className="mt-4 border rounded-lg px-3 py-2 w-full min-h-[110px]" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="One feature per line" />
            <div className="mt-4 flex items-center gap-3">
              <button onClick={savePackage} disabled={saving} className="px-4 py-2 rounded-lg bg-[#F59F0A] text-[#0F1729] text-sm font-semibold disabled:opacity-60">
                {saving ? "Saving..." : "Save Package"}
              </button>
              <button onClick={deletePackage} className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-semibold">
                Delete Package
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Sections for {draft.title}</h2>
              <button onClick={addSection} className="px-3 py-1.5 rounded-lg border border-[#188B8B] text-[#188B8B] text-sm font-semibold">+ Add Section</button>
            </div>

            <div className="mb-5 rounded-xl bg-[#F8FAFA] border border-[#E4E7EC] p-4">
              <p className="text-sm text-[#0F1729] font-semibold mb-2">Download Upload Format</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="/templates/section-template.csv" download className="text-[#188B8B] font-medium hover:underline">CSV Template</a>
                <a href="/templates/section-1-personality.csv" download className="text-[#188B8B] font-medium hover:underline">Section 1 Sample</a>
                <a href="/templates/section-2-intelligence.csv" download className="text-[#188B8B] font-medium hover:underline">Section 2 Sample</a>
                <a href="/templates/section-3-interest.csv" download className="text-[#188B8B] font-medium hover:underline">Section 3 Sample</a>
                <a href="/templates/section-4-aptitude.csv" download className="text-[#188B8B] font-medium hover:underline">Section 4 Sample</a>
                <a href="/templates/section-5-ei.csv" download className="text-[#188B8B] font-medium hover:underline">Section 5 Sample</a>
              </div>
            </div>

            <div className="space-y-4">
              {(draft.sections || []).map((s, idx) => (
                <div key={`${s.sectionId}-${idx}`} className="border rounded-xl p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#0F1729]">Section {s.sectionId}</p>
                    <div className="flex items-center gap-2">
                      {String(editingSection) === String(s.sectionId) ? (
                        <button
                          type="button"
                          onClick={() => setEditingSection(null)}
                          className="px-3 py-1.5 rounded-lg border border-[#188B8B] text-[#188B8B] text-xs font-semibold"
                        >
                          Save Edit
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingSection(String(s.sectionId))}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSection(s.sectionId)}
                        className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input disabled={String(editingSection) !== String(s.sectionId)} type="number" value={s.sectionId} onChange={(e) => updateSection(idx, { sectionId: Number(e.target.value || 1) })} className="border rounded-lg px-3 py-2 disabled:bg-gray-100" />
                    <input disabled={String(editingSection) !== String(s.sectionId)} value={s.title} onChange={(e) => updateSection(idx, { title: e.target.value })} className="border rounded-lg px-3 py-2 disabled:bg-gray-100" />
                    <input disabled={String(editingSection) !== String(s.sectionId)} type="number" value={s.durationMinutes} onChange={(e) => updateSection(idx, { durationMinutes: Number(e.target.value || 20) })} className="border rounded-lg px-3 py-2 disabled:bg-gray-100" />
                    <select disabled={String(editingSection) !== String(s.sectionId)} value={s.scoringType || "mixed"} onChange={(e) => updateSection(idx, { scoringType: e.target.value })} className="border rounded-lg px-3 py-2 disabled:bg-gray-100">
                      <option value="mixed">mixed</option>
                      <option value="likert">likert</option>
                      <option value="objective">objective</option>
                    </select>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-sm flex items-center gap-2">
                      <input disabled={String(editingSection) !== String(s.sectionId)} type="checkbox" checked={s.enabled !== false} onChange={(e) => updateSection(idx, { enabled: e.target.checked })} />
                      Enabled
                    </label>
                    <span className="text-xs text-gray-500">Questions: {Array.isArray(s.questions) ? s.questions.length : 0}</span>
                  </div>
                  <div className="mt-3 flex flex-col md:flex-row gap-3">
                    <input disabled={String(editingSection) !== String(s.sectionId)} value={s.sheetCsvUrl || ""} onChange={(e) => updateSection(idx, { sheetCsvUrl: e.target.value })} className="border rounded-lg px-3 py-2 flex-1 disabled:bg-gray-100" placeholder="Published Google Sheet CSV URL" />
                    <button
                      onClick={() => syncSection(s)}
                      disabled={syncing === `${draft.id}:${s.sectionId}`}
                      className="px-4 py-2 rounded-lg border border-[#188B8B] text-[#188B8B] text-sm font-semibold disabled:opacity-60"
                    >
                      {syncing === `${draft.id}:${s.sectionId}` ? "Syncing..." : "Sync Section"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
