"use client";

import { useEffect, useRef, useState } from "react";
import { FilePlus2, FileText, Download, Trash2 } from "lucide-react";
import { checkPacketLimits, inspectLocalPdf } from "@/lib/documents/local-packet";

type Document = { id: string; name: string; bytes: number; pages: number; url: string };
type Decision = { status: string; note: string; documentId: string; page: number };
const checklist = ["Written project scope", "Existing and proposed floor plans", "Contractor contact information"];
const blank = (): Decision[] => checklist.map(() => ({ status: "", note: "", documentId: "", page: 1 }));

export default function Desk() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [decisions, setDecisions] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const urls = useRef(new Set<string>());
  useEffect(() => { const owned = urls.current; return () => { for (const url of owned) URL.revokeObjectURL(url); }; }, []);
  const current = documents.find(d => d.id === selected);
  const pages = documents.reduce((n, d) => n + d.pages, 0);
  const complete = name.trim() && documents.length && decisions.every(d => d.status &&
    (d.status !== "Correction needed" || d.note.trim()) &&
    (d.status !== "Evidence found" || (d.documentId && d.page >= 1 && d.page <= (documents.find(file => file.id === d.documentId)?.pages ?? 0))));

  async function addFiles(files: FileList | null) {
    if (!files?.length || busy) return;
    setBusy(true); setError(""); setMessage("");
    const pending: Document[] = [];
    try {
      checkPacketLimits([...documents, ...Array.from(files).map(f => ({ bytes: f.size, pages: 0 }))]);
      for (const file of Array.from(files)) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const info = await inspectLocalPdf(bytes);
        checkPacketLimits([...documents, ...pending, info]);
        const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        pending.push({ id: crypto.randomUUID(), name: file.name, ...info, url });
      }
      for (const doc of pending) urls.current.add(doc.url);
      setDocuments([...documents, ...pending]);
      setSelected(pending[0].id); setPage(1); setDecisions(blank());
      setMessage("Packet added. Review decisions were cleared because the submission changed.");
    } catch (e) {
      for (const doc of pending) URL.revokeObjectURL(doc.url);
      setError(e instanceof Error ? e.message : "Unable to open this packet.");
    } finally { setBusy(false); }
  }
  function removeDocument(id: string) {
    const removed = documents.find(d => d.id === id);
    if (removed) { URL.revokeObjectURL(removed.url); urls.current.delete(removed.url); }
    const remaining = documents.filter(d => d.id !== id);
    setDocuments(remaining); setDecisions(blank());
    if (selected === id) { setSelected(remaining[0]?.id ?? ""); setPage(1); }
    setMessage("Document removed. Review decisions were cleared because the submission changed.");
  }
  function update(index: number, patch: Partial<Decision>) {
    setDecisions(decisions.map((d, i) => i === index ? { ...d, ...patch } : d));
    setMessage("");
  }
  function exportDraft() {
    if (!complete) return;
    const text = ["MANUAL INTAKE REVIEW — LOCAL DRAFT", `Project: ${name.trim()}`, `Generated: ${new Date().toISOString()}`,
      "Illustrative checklist; not city-approved. No AI review performed.", "",
      "Submission:", ...documents.map(d => `${d.name} — ${d.pages} pages`), "",
      ...decisions.flatMap((d, i) => [checklist[i], `Disposition: ${d.status}`,
        `Evidence: ${d.documentId ? `${documents.find(f => f.id === d.documentId)?.name}, page ${d.page}` : "No page cited"}`,
        `Note: ${d.note || "No additional note"}`, ""])].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "manual-intake-draft.txt"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("Manual review draft downloaded.");
  }
  return <main className="review-workspace local-desk">
    <div className="eyebrow">LOCAL REVIEW DESK</div>
    <div className="heading"><div><h1>Review your packet</h1><p>Open PDFs, inspect pages, and prepare a manual correction draft.</p></div>
      <button className="button primary" disabled={!complete || busy} onClick={exportDraft}><Download size={16}/> Export draft</button></div>
    <div className="notice">Browser-only workspace · Files stay in this tab · Refresh clears this session · Illustrative checklist, no AI review.</div>
    <div className="desk-toolbar">
      <label>Project name<input value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="e.g. Maple House kitchen"/></label>
      <label className="button upload-button"><FilePlus2 size={16}/>{busy ? "Checking PDFs…" : "Add PDFs"}<input aria-label="Add PDF files" type="file" accept="application/pdf,.pdf" multiple disabled={busy} onChange={e => { void addFiles(e.target.files); e.target.value = ""; }}/></label>
      <span>{documents.length}/5 PDFs · {pages}/40 pages · {(documents.reduce((n, d) => n + d.bytes, 0) / 1024 / 1024).toFixed(1)}/25 MB</span>
    </div>
    {error && <p role="alert" className="notice">{error}</p>}
    <div className="review-grid">
      <section className="document-pane" aria-label="Submission documents">
        <div className="document-tabs">{documents.map(d => <div key={d.id} className={selected === d.id ? "document-tab active" : "document-tab"}>
          <button disabled={busy} onClick={() => { setSelected(d.id); setPage(1); }} title={d.name}>{d.name}</button>
          <button disabled={busy} aria-label={`Remove ${d.name}`} onClick={() => removeDocument(d.id)}><Trash2 size={14}/></button></div>)}</div>
        {current ? <><div className="pdf-toolbar"><span>{current.name}</span><label>Page<input type="number" aria-label="PDF page" min={1} max={current.pages} value={page} onChange={e => setPage(Math.min(current.pages, Math.max(1, Number(e.target.value) || 1)))}/></label><span>of {current.pages}</span><a href={current.url} target="_blank" rel="noreferrer" className="text-link">Open PDF ↗</a></div>
          <iframe key={`${current.id}-${page}`} title={`PDF preview: ${current.name}`} src={`${current.url}#page=${page}&view=FitH`} className="pdf-preview"/>
        </> : <div className="document-empty"><FileText size={40}/><h2>Add a permit packet</h2><p>Choose up to five unencrypted PDFs.<br/>25 MB and 40 pages combined.</p><p>Files are opened locally in your browser.</p></div>}
      </section>
      <section className="findings-pane" aria-label="Manual checklist" tabIndex={0}>
        <div className="panel-title"><h2>Manual checklist</h2><span>{decisions.filter(d => d.status).length} / {checklist.length} decided</span></div>
        <small className="checklist-caption">Demo requirements. Confirm the city’s official checklist before using this for an actual review.</small>
        {checklist.map((rule, i) => <article className="finding" key={rule}><h2>{rule}</h2><fieldset disabled={!documents.length || busy}>
          <label>Staff decision<select value={decisions[i].status} onChange={e => update(i, { status: e.target.value })}><option value="" disabled>Choose a disposition</option><option>Evidence found</option><option>Correction needed</option><option>Not applicable</option><option>Defer to manual review</option></select></label>
          <div className="evidence-fields"><label>Evidence document<select value={decisions[i].documentId} onChange={e => update(i, { documentId: e.target.value, page: 1 })}><option value="">No page cited</option>{documents.map(d => <option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
          <label>Page<input type="number" min={1} max={documents.find(d => d.id === decisions[i].documentId)?.pages ?? 1} disabled={!decisions[i].documentId} value={decisions[i].page} onChange={e => update(i, { page: Number(e.target.value) })}/></label></div>
          {decisions[i].documentId && <button className="text-link evidence-button" disabled={decisions[i].page < 1 || decisions[i].page > (documents.find(d => d.id === decisions[i].documentId)?.pages ?? 0)} onClick={() => { setSelected(decisions[i].documentId); setPage(decisions[i].page); }}>View cited page →</button>}
          <label>Review note{decisions[i].status === "Correction needed" ? " (required)" : ""}<textarea value={decisions[i].note} maxLength={4000} onChange={e => update(i, { note: e.target.value })} placeholder="Record evidence, corrections, or why an item is deferred."/></label>
        </fieldset></article>)}
      </section>
    </div>
    <p role="status" className="desk-status">{message || "Export requires a project name, PDFs, all decisions, and page references for found evidence."}</p>
  </main>;
}
