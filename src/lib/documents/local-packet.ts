import { PDFDocument } from "pdf-lib";
export const packetLimits = { files: 5, bytes: 25 * 1024 * 1024, pages: 40 };
export type PacketSize = { bytes: number; pages: number };
export function checkPacketLimits(files: PacketSize[]) {
  if (files.length > packetLimits.files) throw new Error("Choose no more than five PDFs.");
  if (files.reduce((n, f) => n + f.bytes, 0) > packetLimits.bytes) throw new Error("The combined packet must be 25 MB or smaller.");
  if (files.reduce((n, f) => n + f.pages, 0) > packetLimits.pages) throw new Error("The combined packet must be 40 pages or fewer.");
}
export async function inspectLocalPdf(bytes: Uint8Array) {
  if (bytes.byteLength > packetLimits.bytes) throw new Error("This PDF exceeds 25 MB.");
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-")) throw new Error("Choose a valid PDF file.");
  let pages: number;
  try { const pdf = await PDFDocument.load(bytes); pages = pdf.getPageCount(); }
  catch { throw new Error("This PDF is encrypted or damaged. Use an unencrypted, readable copy."); }
  if (!pages) throw new Error("This PDF has no pages.");
  checkPacketLimits([{ bytes: bytes.byteLength, pages }]);
  return { bytes: bytes.byteLength, pages };
}
