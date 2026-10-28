import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { checkPacketLimits, inspectLocalPdf } from "../src/lib/documents/local-packet";
describe("local packet validation", () => {
  it("counts actual PDF pages", async () => {
    const doc = await PDFDocument.create(); doc.addPage(); doc.addPage();
    expect((await inspectLocalPdf(await doc.save())).pages).toBe(2);
  });
  it("rejects disguised or damaged PDFs", async () => {
    await expect(inspectLocalPdf(new TextEncoder().encode("not a PDF"))).rejects.toThrow("valid PDF");
    await expect(inspectLocalPdf(new TextEncoder().encode("%PDF-1.7 broken"))).rejects.toThrow("damaged");
  });
  it("enforces combined packet limits, not just individual files", () => {
    expect(() => checkPacketLimits(Array.from({length:6},()=>({bytes:1,pages:1})))).toThrow("five");
    expect(() => checkPacketLimits([{bytes:14*1024*1024,pages:20},{bytes:14*1024*1024,pages:20}])).toThrow("25 MB");
    expect(() => checkPacketLimits([{bytes:1,pages:25},{bytes:1,pages:20}])).toThrow("40 pages");
    expect(() => checkPacketLimits([{bytes:25*1024*1024,pages:40}])).not.toThrow();
  });
});
