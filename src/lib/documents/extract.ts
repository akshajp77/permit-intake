import { extractText, getDocumentProxy } from "unpdf";
export type Page={documentId:string;page:number;text:string;readable:boolean};
export async function extractPages(bytes:Uint8Array,documentId:string):Promise<Page[]> {
 if(bytes.byteLength>25*1024*1024)throw new Error("PDF exceeds 25 MB");
 if(!new TextDecoder().decode(bytes.slice(0,1024)).includes("%PDF-"))throw new Error("Not a PDF");
 const doc=await getDocumentProxy(bytes);
 try {
 if(doc.numPages>40)throw new Error("PDF exceeds 40 pages");
 const {text}=await extractText(doc,{mergePages:false});
 return text.map((text,i)=>({documentId,page:i+1,text,readable:text.trim().length>=30}));
 } finally {await doc.loadingTask.destroy();}
}
