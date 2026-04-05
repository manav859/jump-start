import AssessmentConfig from "../models/AssessmentConfig.js";

const parseCsv = (raw = "") => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i];
    const next = raw[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && c === ",") {
      row.push(value.trim());
      value = "";
      continue;
    }
    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (c === "\r" && next === "\n") i += 1;
      row.push(value.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }
    value += c;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
};

const mapRowsToQuestions = (rows) => {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.toLowerCase());
  const idx = {
    questionId: headers.findIndex((h) => ["question_id", "qid", "id"].includes(h)),
    text: headers.findIndex((h) => ["question", "text", "statement"].includes(h)),
    type: headers.findIndex((h) => h === "type"),
    optionA: headers.findIndex((h) => ["option_a", "a"].includes(h)),
    optionB: headers.findIndex((h) => ["option_b", "b"].includes(h)),
    optionC: headers.findIndex((h) => ["option_c", "c"].includes(h)),
    optionD: headers.findIndex((h) => ["option_d", "d"].includes(h)),
    optionE: headers.findIndex((h) => ["option_e", "e"].includes(h)),
    correctOption: headers.findIndex((h) => ["correct_option", "answer", "correct"].includes(h)),
    reverseScored: headers.findIndex((h) => ["reverse_scored", "reverse"].includes(h)),
    weight: headers.findIndex((h) => h === "weight"),
  };

  return rows
    .slice(1)
    .map((cells, i) => {
      const typeValue = (idx.type >= 0 ? cells[idx.type] : "").toLowerCase();
      const type = typeValue === "single" || typeValue === "objective" ? "single" : "likert";
      const options = [idx.optionA, idx.optionB, idx.optionC, idx.optionD, idx.optionE]
        .map((col) => (col >= 0 ? cells[col] : ""))
        .map((v) => String(v || "").trim())
        .filter(Boolean);
      return {
        questionId: idx.questionId >= 0 ? String(cells[idx.questionId] || "") : `${i + 1}`,
        text: idx.text >= 0 ? String(cells[idx.text] || "").trim() : "",
        type,
        options: type === "single" ? options : [],
        correctOption: idx.correctOption >= 0 ? String(cells[idx.correctOption] || "").trim() : "",
        reverseScored:
          idx.reverseScored >= 0
            ? ["1", "true", "yes", "y"].includes(String(cells[idx.reverseScored] || "").toLowerCase())
            : false,
        weight: idx.weight >= 0 ? Number(cells[idx.weight] || 1) : 1,
        subscale:
          headers.findIndex((h) => h === "subscale") >= 0
            ? String(cells[headers.findIndex((h) => h === "subscale")] || "").trim()
            : "",
        notes:
          headers.findIndex((h) => h === "notes") >= 0
            ? String(cells[headers.findIndex((h) => h === "notes")] || "").trim()
            : "",
      };
    })
    .filter((q) => q.text);
};

const toPublicPackage = (p) => ({
  id: p.id,
  title: p.title,
  badge: p.badge,
  amount: p.amount,
  strikeAmount: p.strikeAmount,
  features: p.features || [],
  durationText: p.durationText || "",
  active: p.active,
  sortOrder: p.sortOrder || 0,
  sectionCount: Array.isArray(p.sections) ? p.sections.filter((s) => s.enabled !== false).length : 0,
});

const toPublicSection = (s) => ({
  sectionId: s.sectionId,
  title: s.title,
  durationMinutes: s.durationMinutes,
  enabled: s.enabled,
  scoringType: s.scoringType,
  totalQuestions: Array.isArray(s.questions) ? s.questions.length : 0,
});

const getQuestionCount = (pkg) =>
  (pkg.sections || [])
    .filter((section) => section.enabled !== false)
    .reduce(
      (sum, section) => sum + ((section.questions || []).length || 0),
      0
    );

const normalizePackage = (p, sortOrder = 1) => ({
  id: String(p.id || `pkg-${Date.now()}`),
  title: String(p.title || "Package"),
  badge: String(p.badge || "Recommended"),
  amount: Number(p.amount || 0),
  strikeAmount: p.strikeAmount !== undefined && p.strikeAmount !== null && p.strikeAmount !== "" ? Number(p.strikeAmount) : null,
  features: Array.isArray(p.features) ? p.features.map((f) => String(f)).filter(Boolean) : [],
  durationText: String(p.durationText || ""),
  active: p.active !== false,
  sortOrder: Number.isFinite(Number(p.sortOrder)) ? Number(p.sortOrder) : sortOrder,
  sections: Array.isArray(p.sections)
    ? p.sections.map((s, i) => ({
      sectionId: Number(s.sectionId || i + 1),
      title: String(s.title || `Section ${i + 1}`),
      durationMinutes: Number(s.durationMinutes || 20),
      enabled: s.enabled !== false,
      scoringType: ["likert", "objective", "mixed"].includes(s.scoringType) ? s.scoringType : "mixed",
      sheetCsvUrl: String(s.sheetCsvUrl || ""),
      questions: Array.isArray(s.questions) ? s.questions : [],
    }))
    : [],
});

const getCfg = async () => AssessmentConfig.getOrCreateDefault();

const findPackage = (cfg, packageId) => (cfg.packages || []).find((p) => p.id === packageId);

// GET /api/v1/public/config
export const getPublicConfig = async (req, res) => {
  try {
    const cfg = await getCfg();
    const packages = (cfg.packages || [])
      .filter((p) => p.active !== false && getQuestionCount(p) > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return res.status(200).json({ success: true, data: { packages: packages.map(toPublicPackage) } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load config" });
  }
};

// GET /api/v1/public/packages/:packageId/sections
export const getPublicPackageSections = async (req, res) => {
  try {
    const cfg = await getCfg();
    const pkg = findPackage(cfg, req.params.packageId);
    if (!pkg) return res.status(404).json({ success: false, msg: "Package not found" });
    const sections = (pkg.sections || []).filter((s) => s.enabled !== false).sort((a, b) => a.sectionId - b.sectionId);
    return res.status(200).json({ success: true, data: { package: toPublicPackage(pkg), sections: sections.map(toPublicSection) } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load package sections" });
  }
};

// GET /api/v1/public/packages/:packageId/sections/:sectionId/questions
export const getPublicSectionQuestions = async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    const cfg = await getCfg();
    const pkg = findPackage(cfg, req.params.packageId);
    if (!pkg) return res.status(404).json({ success: false, msg: "Package not found" });
    const section = (pkg.sections || []).find((s) => s.sectionId === sectionId && s.enabled !== false);
    if (!section) return res.status(404).json({ success: false, msg: "Section not found" });
    const questions = (section.questions || []).map((q, index) => ({
      index,
      questionId: q.questionId || `${index + 1}`,
      text: q.text,
      type: q.type,
      options: q.options || [],
    }));
    return res.status(200).json({ success: true, data: { section: toPublicSection(section), questions } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load questions" });
  }
};

// GET /api/v1/admin/config
export const getAdminConfig = async (req, res) => {
  try {
    const cfg = await getCfg();
    return res.status(200).json({ success: true, data: { key: cfg.key, packages: cfg.packages || [] } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to load admin config" });
  }
};

// POST /api/v1/admin/packages
export const postAdminPackage = async (req, res) => {
  try {
    const cfg = await getCfg();
    const next = normalizePackage(req.body || {}, (cfg.packages || []).length + 1);
    if ((cfg.packages || []).some((p) => p.id === next.id)) {
      return res.status(400).json({ success: false, msg: "Package id already exists" });
    }
    cfg.packages = [...(cfg.packages || []), next];
    await cfg.save();
    return res.status(201).json({ success: true, data: { package: next } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to create package" });
  }
};

// PUT /api/v1/admin/packages/:packageId
export const putAdminPackage = async (req, res) => {
  try {
    const cfg = await getCfg();
    const idx = (cfg.packages || []).findIndex((p) => p.id === req.params.packageId);
    if (idx < 0) return res.status(404).json({ success: false, msg: "Package not found" });
    const existing = cfg.packages[idx];
    const next = normalizePackage({ ...existing.toObject(), ...req.body, sections: existing.sections }, existing.sortOrder);
    cfg.packages[idx] = next;
    await cfg.save();
    return res.status(200).json({ success: true, data: { package: next } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to update package" });
  }
};

// DELETE /api/v1/admin/packages/:packageId
export const deleteAdminPackage = async (req, res) => {
  try {
    const cfg = await getCfg();
    const before = (cfg.packages || []).length;
    cfg.packages = (cfg.packages || []).filter((p) => p.id !== req.params.packageId);
    if (cfg.packages.length === before) return res.status(404).json({ success: false, msg: "Package not found" });
    await cfg.save();
    return res.status(200).json({ success: true, data: { ok: true } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to delete package" });
  }
};

// PUT /api/v1/admin/packages/:packageId/sections
export const putAdminPackageSections = async (req, res) => {
  try {
    const { sections } = req.body || {};
    if (!Array.isArray(sections)) return res.status(400).json({ success: false, msg: "sections array is required" });
    const cfg = await getCfg();
    const pkg = findPackage(cfg, req.params.packageId);
    if (!pkg) return res.status(404).json({ success: false, msg: "Package not found" });
    pkg.sections = sections.map((s, i) => {
      const existing = (pkg.sections || []).find((x) => x.sectionId === Number(s.sectionId));
      return {
        sectionId: Number(s.sectionId || i + 1),
        title: String(s.title || `Section ${i + 1}`),
        durationMinutes: Number(s.durationMinutes || 20),
        enabled: s.enabled !== false,
        scoringType: ["likert", "objective", "mixed"].includes(s.scoringType) ? s.scoringType : "mixed",
        sheetCsvUrl: String(s.sheetCsvUrl || ""),
        questions: existing?.questions || [],
      };
    });
    await cfg.save();
    return res.status(200).json({ success: true, data: { sections: pkg.sections } });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to update sections" });
  }
};

// POST /api/v1/admin/packages/:packageId/sections/:sectionId/sync-google-sheet
export const postSyncSectionFromGoogleSheet = async (req, res) => {
  try {
    const sectionId = Number(req.params.sectionId);
    const { csvUrl } = req.body || {};
    if (!csvUrl) return res.status(400).json({ success: false, msg: "csvUrl is required" });

    const cfg = await getCfg();
    const pkg = findPackage(cfg, req.params.packageId);
    if (!pkg) return res.status(404).json({ success: false, msg: "Package not found" });
    const section = (pkg.sections || []).find((s) => s.sectionId === sectionId);
    if (!section) return res.status(404).json({ success: false, msg: "Section not found" });

    const response = await fetch(csvUrl);
    if (!response.ok) return res.status(400).json({ success: false, msg: `Failed to fetch CSV (${response.status})` });
    const raw = await response.text();
    const rows = parseCsv(raw);
    const questions = mapRowsToQuestions(rows);
    if (!questions.length) return res.status(400).json({ success: false, msg: "No questions parsed from CSV" });

    section.questions = questions;
    section.sheetCsvUrl = csvUrl;
    await cfg.save();
    return res.status(200).json({
      success: true,
      data: { section: { sectionId: section.sectionId, title: section.title, totalQuestions: section.questions.length } },
    });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err.message || "Failed to sync section" });
  }
};
