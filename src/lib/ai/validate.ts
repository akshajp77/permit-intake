import type {FindingType} from "../contracts/review";
import type {Page} from "../documents/extract";
const normalize=(text:string)=>text.toLowerCase().replace(/\s+/g," ").trim();
export function validateFindings(findings:FindingType[],ruleIds:string[],pages:Page[]):FindingType[]{
 if(findings.length!==ruleIds.length || new Set(findings.map(f=>f.ruleId)).size!==ruleIds.length || findings.some(f=>!ruleIds.includes(f.ruleId)))throw new Error("Missing, duplicate or unknown rules");
 return findings.map(f=>{
 const evidence=f.evidence.map(e=>{const page=pages.find(p=>p.documentId===e.documentId&&p.page===e.page);
 if(!page||!e.quote.trim()||!normalize(page.text).includes(normalize(e.quote)))throw new Error("Invalid evidence citation");
 return {...e,verification:"text_matched" as const};});
 if(f.proposedStatus==="evidence_found"&&!evidence.length)throw new Error("Evidence required");
 if(f.proposedStatus==="not_applicable")return {...f,evidence,proposedStatus:"needs_review",reason:"Staff-confirmed applicability is not implemented in this spike.",suggestedCorrection:null};
 if(f.proposedStatus==="not_found"&&pages.some(p=>!p.readable))return {...f,evidence,proposedStatus:"needs_review",reason:"Incomplete readable coverage; staff must inspect the original pages.",suggestedCorrection:null};
 return {...f,evidence};
 });
}
