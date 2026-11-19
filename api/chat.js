/* POST /api/chat  — luyện nói 1-1 với Claude (Anthropic Messages API).
   Cần biến môi trường: ANTHROPIC_API_KEY. Tuỳ chọn: ANTHROPIC_MODEL (mặc định claude-sonnet-5-5), NOI_DAILY_LIMIT (mặc định 150 lượt/ngày/người).
   Body: {mode:"turn"|"report", level, role, goal, targets:[], history:[{r:"user"|"ai",t}], hint?:bool}
   turn  -> {reply, fix:{ok, better, notes}, hint}
   report-> {scores:{fluency,grammar,vocab,task,overall}, cefr, strengths:[], mistakes:[{said,better,why}], phrases:[], next} */
const L = require("./_lib");
const KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const BASE = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
const LIMIT = Number(process.env.NOI_DAILY_LIMIT) || 150;

const LV = { s1: "complete beginner (Pre-A1): use 3–6 word sentences, very common words, speak slowly", s2: "A1: short simple sentences, present tense, common words", s3: "A2: simple past/future, everyday topics, short sentences", s4: "B1: connected speech, opinions with reasons, everyday vocabulary", s5: "B2: longer answers, abstract topics, natural fillers and linking words", s6: "C1: nuanced, idiomatic, precise language and abstract reasoning" };

function sys(b) {
  const lv = LV[b.stage] || LV.s3;
  return `You are an English speaking partner inside a language-learning website for Vietnamese learners. The learner SPEAKS to you; their words reach you as text from speech recognition, so ignore capitalisation/punctuation and filler hesitation, and never penalise spelling.
ROLE AND SCENARIO: ${String(b.role || "a friendly conversation partner").slice(0, 600)}
LEARNER LEVEL: ${lv}. Match your own language to this level (a little above is fine). Keep every reply to 1–3 short sentences and ALWAYS end with one question or prompt so the learner keeps talking. Stay in role. Never switch to Vietnamese in "reply".
TARGET PHRASES to encourage (do not force): ${(b.targets || []).slice(0, 8).join("; ")}.
Each turn, judge ONLY the learner's LAST message for grammar, word choice and naturalness at their level. Be kind and concrete. "fix.ok" is true only if the sentence is already natural and correct (small accent/ASR errors don't count). If not ok, give "better" (a corrected, natural version that keeps their meaning) and "notes": 1–2 short Vietnamese explanations of what was wrong. "hint": a short English sentence the learner could say next (their level), plus nothing else.
Reply with ONLY valid JSON, no markdown: {"reply":"...","fix":{"ok":true|false,"better":"...","notes":["..."]},"hint":"..."}`;
}
function sysReport(b) {
  return `You are an experienced English speaking examiner for Vietnamese learners. You receive a spoken practice conversation (transcribed text, ignore punctuation/capitalisation). Evaluate ONLY the learner's turns ("user"). Scenario: ${String(b.role || "").slice(0, 400)}. Target level: ${LV[b.stage] || LV.s3}. Be honest and encouraging; scores are 0–10 (use 1 decimal) relative to the target level.
Return ONLY valid JSON: {"scores":{"fluency":n,"grammar":n,"vocab":n,"task":n,"overall":n},"cefr":"A1|A2|B1|B2|C1","strengths":["Vietnamese, 1 short sentence each, max 3"],"mistakes":[{"said":"exact learner words","better":"corrected","why":"Vietnamese, brief"}] (max 5, most important first),"phrases":["useful English phrases the learner should review, max 5"],"next":"Vietnamese, one concrete next step"}
"task" = how well the learner completed the scenario goal: ${String(b.goal || "").slice(0, 200)}.`;
}
function msgs(h) {
  const out = [];
  for (const m of (h || []).slice(-24)) {
    const role = m.r === "ai" ? "assistant" : "user"; const t = String(m.t || "").slice(0, 600);
    if (!t) continue;
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += "\n" + t; else out.push({ role, content: t });
  }
  if (!out.length || out[0].role !== "user") out.unshift({ role: "user", content: "(start)" });
  return out;
}
function parse(t) { const a = t.indexOf("{"), z = t.lastIndexOf("}"); return JSON.parse(t.slice(a, z + 1)); }
const num = x => Math.max(0, Math.min(10, Math.round(Number(x) * 10) / 10 || 0));

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") return L.send(res, 405, { error: "Phương thức không hợp lệ." });
    if (!KEY) return L.send(res, 503, { error: "no_key" });
    if (!L.ready()) return L.send(res, 503, { error: "Máy chủ chưa được cấu hình." });
    const uid = L.readToken(req.headers.authorization);
    if (!uid) return L.send(res, 401, { error: "Hãy đăng nhập để nói chuyện với AI." });
    const b = await L.body(req);
    const mode = b.mode === "report" ? "report" : "turn";
    if (await L.limited("noi:" + uid + ":" + new Date().toISOString().slice(0, 10), LIMIT, 86400)) return L.send(res, 429, { error: "Hôm nay bạn đã dùng hết lượt nói với AI. Mai quay lại nhé." });
    if (await L.limited("noi:m:" + uid, 20, 60)) return L.send(res, 429, { error: "Bạn gửi hơi nhanh, đợi chút nhé." });
    const r = await fetch(BASE + "/v1/messages", {
      method: "POST", headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: mode === "report" ? 1200 : 500, system: mode === "report" ? sysReport(b) : sys(b), messages: mode === "report" ? [{ role: "user", content: "Conversation:\n" + (b.history || []).slice(-40).map(m => (m.r === "ai" ? "ai: " : "user: ") + String(m.t || "").slice(0, 600)).join("\n") }] : msgs(b.history) })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("anthropic", r.status, JSON.stringify(j).slice(0, 300)); return L.send(res, 502, { error: "AI đang bận, hãy thử lại." }); }
    const text = (j.content || []).map(c => c.text || "").join("");
    let o; try { o = parse(text); } catch (e) { return L.send(res, 502, { error: "AI trả lời lỗi định dạng, hãy thử lại." }); }
    if (mode === "report") {
      const s = o.scores || {};
      return L.send(res, 200, { scores: { fluency: num(s.fluency), grammar: num(s.grammar), vocab: num(s.vocab), task: num(s.task), overall: num(s.overall) }, cefr: String(o.cefr || "").slice(0, 3), strengths: (o.strengths || []).slice(0, 3).map(String), mistakes: (o.mistakes || []).slice(0, 5).map(m => ({ said: String(m.said || ""), better: String(m.better || ""), why: String(m.why || "") })), phrases: (o.phrases || []).slice(0, 5).map(String), next: String(o.next || "") });
    }
    const f = o.fix || {};
    return L.send(res, 200, { reply: String(o.reply || "").slice(0, 500), fix: { ok: !!f.ok, better: String(f.better || ""), notes: (f.notes || []).slice(0, 2).map(String) }, hint: String(o.hint || "").slice(0, 200) });
  } catch (e) { console.error(e); return L.send(res, 500, { error: "Máy chủ gặp lỗi, hãy thử lại sau." }); }
};
