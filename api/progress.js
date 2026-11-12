/* GET /api/progress?app=vocab|writing -> {data:{map}, rev}
   PUT /api/progress?app=... {data:{map}, ifRev} -> {ok, rev}
   Dùng chung Redis và tài khoản với Super Honki. Khoá của web này: prog:vocab:<uid>, prog:writing:<uid> (và rev:...),
   không trùng với prog:<uid>, prog:goi:<uid>, prog:kanji:<uid> của Super Honki. */
const L = require("./_lib");
const CAS = `local rev = tonumber(redis.call('GET', KEYS[2]) or '0')
if rev ~= tonumber(ARGV[1]) then return {0, rev} end
redis.call('SET', KEYS[1], ARGV[2]); redis.call('SET', KEYS[2], rev + 1)
return {1, rev + 1}`;
module.exports = async (req, res) => {
  try {
    if (!L.ready()) return L.send(res, 503, { error: "Máy chủ chưa được cấu hình." });
    const uid = L.readToken(req.headers.authorization);
    if (!uid) return L.send(res, 401, { error: "Phiên đăng nhập đã hết hạn." });
    const app = String((req.query && req.query.app) || new URL(req.url, "http://x").searchParams.get("app") || "");
    if (!/^(vocab|writing)$/.test(app)) return L.send(res, 400, { error: "Ứng dụng không hợp lệ." });
    const kd = "prog:" + app + ":" + uid, kr = "rev:" + app + ":" + uid;
    if (req.method === "GET") {
      const [raw, rev] = await Promise.all([L.redis("GET", kd), L.redis("GET", kr)]);
      return L.send(res, 200, { data: raw ? JSON.parse(raw) : null, rev: Number(rev || 0) });
    }
    if (req.method === "PUT") {
      const b = await L.body(req), d = b.data;
      if (!d || typeof d !== "object" || !d.map || typeof d.map !== "object") return L.send(res, 400, { error: "Dữ liệu không hợp lệ." });
      const text = JSON.stringify({ map: d.map });
      if (text.length > 1500000) return L.send(res, 413, { error: "Dữ liệu quá lớn." });
      const [okFlag, rev] = await L.redis("EVAL", CAS, 2, kd, kr, String(Number(b.ifRev) || 0), text);
      return L.send(res, 200, { ok: okFlag === 1, rev });
    }
    return L.send(res, 405, { error: "Phương thức không hợp lệ." });
  } catch (e) { console.error(e); return L.send(res, 500, { error: "Máy chủ gặp lỗi, hãy thử lại sau." }); }
};
