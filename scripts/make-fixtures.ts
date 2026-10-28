import {PDFDocument,StandardFonts} from "pdf-lib";
import {mkdir,writeFile} from "node:fs/promises";
async function main(){await mkdir("fixtures",{recursive:true});for(const complete of [true,false]){const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);const page=pdf.addPage();["SYNTHETIC TEST PACKET - NOT A REAL PERMIT","Project: Maple House kitchen","Scope: Interior kitchen remodel. No change to building footprint.",...(complete?["Contractor: Example Builder. Contact: builder@example.com"]:[])].forEach((line,i)=>page.drawText(line,{x:40,y:750-i*35,size:12,font}));await writeFile(`fixtures/synthetic-${complete?"complete":"missing"}.pdf`,await pdf.save());}}
main();
