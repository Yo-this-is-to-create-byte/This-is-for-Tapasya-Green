import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Save, Plus, Trash2, Upload, X } from "lucide-react";

const resolveFileUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";

  if (/^https?:\/\//i.test(value)) return value;

  return new URL(value, api.defaults.baseURL).href;
};

const uploadFile = async (file) => {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api.post("/admin/uploads", fd);
  return r.data.url;
};

/* Single image field: preview + upload + manual value */
function ImageField({ label, value, onChange, testid }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const isImg = typeof value === "string" && (value.startsWith("/api/files/") || value.startsWith("/products/") || value.startsWith("http"));

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadFile(f));
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="font-mono uppercase text-[0.6rem] tracking-[0.2em] text-ink/50 block mb-1">{label}</span>
      <div className="flex items-start gap-3">
        {isImg && (
<img
  src={resolveFileUrl(value)}
  alt={label}
  data-testid={`${testid}-preview`}
  className="w-20 h-20 object-cover border border-black/10 bg-slate-50"
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>        )}
        <div className="flex-1">
          <input
            className="w-full bg-white border border-black/15 px-3 py-2 font-mono text-sm focus:outline-none focus:border-tapasya-blue"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="machinery_1 or upload →"
            data-testid={`${testid}-input`}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            data-testid={`${testid}-upload`}
            className="mt-2 inline-flex items-center gap-1.5 border border-black/15 px-3 py-1.5 font-mono uppercase text-[0.6rem] tracking-widest text-ink/70 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            <Upload size={12} /> {busy ? "Uploading…" : "Upload photo"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={pick} />
        </div>
      </div>
    </div>
  );
}

/* Single file field (PDF datasheets): link + upload + clear */
function FileField({ label, value, onChange, testid }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const hasFile = typeof value === "string" && value.trim().length > 0;

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadFile(f));
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="font-mono uppercase text-[0.6rem] tracking-[0.2em] text-ink/50 block mb-1">{label}</span>
      <div className="flex items-center gap-3 flex-wrap">
        {hasFile ? (
          <>
            <a
              href={resolveFileUrl(value)}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`${testid}-link`}
              className="inline-flex items-center gap-1.5 border border-black/15 px-3 py-1.5 font-mono uppercase text-[0.6rem] tracking-widest text-tapasya-blue hover:border-tapasya-blue truncate max-w-[280px]"
            >
              {value.split("/").pop()}
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              data-testid={`${testid}-clear`}
              className="inline-flex items-center gap-1 border border-black/15 px-2 py-1.5 font-mono uppercase text-[0.6rem] tracking-widest text-ink/60 hover:bg-slate-800 hover:text-white"
            >
              <X size={12} /> Clear
            </button>
          </>
        ) : (
          <span className="font-mono text-[0.6rem] tracking-widest text-ink/40 uppercase">No file attached</span>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          data-testid={`${testid}-upload`}
          className="inline-flex items-center gap-1.5 border border-black/15 px-3 py-1.5 font-mono uppercase text-[0.6rem] tracking-widest text-ink/70 hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          <Upload size={12} /> {busy ? "Uploading…" : hasFile ? "Replace PDF" : "Upload PDF"}
        </button>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={pick} />
      </div>
    </div>
  );
}

/* Multi image field: thumb grid + multi upload + remove */
function ImagesField({ label, value, onChange, testid }) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  let arr = [];
  if (Array.isArray(value)) arr = value;
  else if (typeof value === "string" && value.trim()) {
    try { arr = JSON.parse(value); } catch { arr = []; }
  }

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadFile(f));
      onChange([...arr, ...urls]);
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="md:col-span-2">
      <span className="font-mono uppercase text-[0.6rem] tracking-[0.2em] text-ink/50 block mb-1">{label}</span>
      <div className="flex flex-wrap gap-3">
        {arr.map((u, i) => (
          <div key={`${u}-${i}`} className="relative group">
            <img   src={resolveFileUrl(u)}   alt={`Gallery image ${i + 1}`}   data-testid={`${testid}-thumb-${i}`}   className="w-20 h-20 object-cover border border-black/10 bg-slate-50" />
            <button
              type="button"
              onClick={() => onChange(arr.filter((_, j) => j !== i))}
              data-testid={`${testid}-remove-${i}`}
              className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          data-testid={`${testid}-upload`}
          className="w-20 h-20 border border-dashed border-black/25 inline-flex flex-col items-center justify-center gap-1 text-ink/50 hover:border-tapasya-blue hover:text-tapasya-blue disabled:opacity-50"
        >
          <Upload size={14} />
          <span className="font-mono uppercase text-[0.5rem] tracking-widest">{busy ? "…" : "Add"}</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />
      </div>
    </div>
  );
}

/* Reusable simple resource manager (list on left, editor on right) */
export default function ResourceManager({
  title,
  kicker = "(Manage)",
  endpoint,           // "/blog" for GET list, PUT admin/blog, DELETE admin/{endpoint}/:id
  adminEndpoint,      // "/admin/blog"
  fields,             // [{name, label, type?, placeholder?, options?, colspan?}]
  labelKey = "title",
  slugField = "slug",
  testidPrefix,
}) {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () => api.get(endpoint).then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const emptyItem = () => Object.fromEntries(fields.map((f) => [f.name, f.type === "list" ? [] : ""]));

  const save = async () => {
    setBusy(true);
    try {
      const payload = { ...current };
      // strip client id when creating new? server uses slug upsert or id for news/events
      await api.put(adminEndpoint, payload);
      setMsg("Saved");
      load();
      setTimeout(() => setMsg(""), 1500);
    } catch (e) {
      setMsg(e.response?.data?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (it) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`${adminEndpoint}/${it.id}`);
    if (current?.id === it.id) setCurrent(null);
    load();
  };

  const inputCls = "w-full bg-white border border-black/15 px-3 py-2 font-mono text-sm focus:outline-none focus:border-tapasya-blue";
  const labelCls = "font-mono uppercase text-[0.6rem] tracking-[0.2em] text-ink/50 block mb-1";

  return (
    <div className="p-8 md:p-12" data-testid={`admin-${testidPrefix}`}>
      <p className="font-mono uppercase text-[0.65rem] tracking-[0.3em] text-tapasya-blue">{kicker}</p>
      <h1 className="mt-4 font-display font-bold uppercase tracking-tighter leading-none text-4xl md:text-5xl text-ink">{title}</h1>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-black/10">
          <div className="p-4 border-b border-black/10 flex items-center justify-between">
            <span className="font-mono uppercase text-[0.65rem] tracking-widest text-ink/50">Items ({items.length})</span>
            <button data-testid={`${testidPrefix}-new`} onClick={() => setCurrent(emptyItem())} className="inline-flex items-center gap-1 text-tapasya-blue font-mono uppercase text-[0.6rem] tracking-widest">
              <Plus size={12} /> New
            </button>
          </div>
          <ul className="max-h-[70vh] overflow-y-auto">
            {items.map((it) => (
              <li key={it.id} className={`border-b border-black/5 ${current?.id === it.id ? "bg-slate-800/5" : ""}`}>
                <button onClick={() => setCurrent(it)} className="w-full text-left px-4 py-3">
                  <p className="font-display uppercase tracking-tight text-sm text-ink truncate">{it[labelKey] || it.slug || "(untitled)"}</p>
                  {it[slugField] && <p className="font-mono text-[0.6rem] tracking-widest text-ink/40 mt-1">{it[slugField]}</p>}
                </button>
              </li>
            ))}
            {items.length === 0 && <li className="p-4 text-sm text-ink/50">No items yet.</li>}
          </ul>
        </div>

        <div className="lg:col-span-2">
          {!current ? (
            <div className="bg-white border border-black/10 p-6 text-ink/50">Select an item to edit or click <b>New</b>.</div>
          ) : (
            <div className="bg-white border border-black/10 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((f) => {
                  const val = current[f.name] ?? "";
                  const cs = f.colspan === 2 ? "md:col-span-2" : "";
                  if (f.type === "image") {
                    return (
                      <ImageField
                        key={f.name}
                        label={f.label}
                        value={val}
                        onChange={(v) => setCurrent({ ...current, [f.name]: v })}
                        testid={`${testidPrefix}-${f.name}`}
                      />
                    );
                  }
                  if (f.type === "file") {
                    return (
                      <FileField
                        key={f.name}
                        label={f.label}
                        value={val}
                        onChange={(v) => setCurrent({ ...current, [f.name]: v })}
                        testid={`${testidPrefix}-${f.name}`}
                      />
                    );
                  }
                  if (f.type === "images") {
                    return (
                      <ImagesField
                        key={f.name}
                        label={f.label}
                        value={val}
                        onChange={(v) => setCurrent({ ...current, [f.name]: v })}
                        testid={`${testidPrefix}-${f.name}`}
                      />
                    );
                  }
                  if (f.type === "textarea") {
                    return (
                      <div key={f.name} className={cs || "md:col-span-2"}>
                        <span className={labelCls}>{f.label}</span>
                        <textarea rows={5} className={inputCls} value={val} onChange={(e) => setCurrent({ ...current, [f.name]: e.target.value })} />
                      </div>
                    );
                  }
                  if (f.type === "select") {
                    return (
                      <div key={f.name} className={cs}>
                        <span className={labelCls}>{f.label}</span>
                        <select className={inputCls} value={val} onChange={(e) => setCurrent({ ...current, [f.name]: e.target.value })}>
                          <option value="">Select…</option>
                          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    );
                  }
                  if (f.type === "json") {
                    return (
                      <div key={f.name} className="md:col-span-2">
                        <span className={labelCls}>{f.label} (JSON)</span>
                        <textarea
                          rows={6}
                          className={inputCls + " font-mono"}
                          value={typeof val === "string" ? val : JSON.stringify(val, null, 2)}
                          onChange={(e) => {
                            const v = e.target.value;
                            try { setCurrent({ ...current, [f.name]: JSON.parse(v) }); }
                            catch { setCurrent({ ...current, [f.name]: v }); }
                          }}
                        />
                      </div>
                    );
                  }
                  return (
                    <div key={f.name} className={cs}>
                      <span className={labelCls}>{f.label}</span>
                      <input type={f.type || "text"} placeholder={f.placeholder} className={inputCls} value={val} onChange={(e) => setCurrent({ ...current, [f.name]: e.target.value })} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button disabled={busy} onClick={save} data-testid={`${testidPrefix}-save`} className="inline-flex items-center gap-2 bg-slate-800 text-white pl-5 pr-4 py-2.5 font-mono uppercase text-[0.65rem] tracking-widest hover:bg-slate-900 disabled:opacity-50">
                  <Save size={14} /> Save
                </button>
                {current.id && (
                  <button onClick={() => remove(current)} className="inline-flex items-center gap-2 border border-black/15 px-4 py-2.5 font-mono uppercase text-[0.65rem] tracking-widest text-ink/70 hover:bg-slate-800 hover:text-white hover:border-ink">
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                {msg && <span className="font-mono uppercase text-[0.6rem] tracking-widest text-green-600">{msg}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
