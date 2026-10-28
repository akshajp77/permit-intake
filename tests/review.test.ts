import {describe,it,expect} from "vitest";
import {validateFindings} from "../src/lib/ai/validate";
import {extractPages} from "../src/lib/documents/extract";
import {readFile} from "node:fs/promises";
import type {FindingType} from "../src/lib/contracts/review";
const finding:FindingType={ruleId:"scope",proposedStatus:"evidence_found",reason:"Located",evidence:[{documentId:"doc",page:1,quote:"Kitchen remodel",verification:"staff_required"}],suggestedCorrection:null};
const pages=[{documentId:"doc",page:1,text:"Kitchen remodel",readable:true}];
describe("citation boundary",()=>{
 it("verifies actual text",()=>expect(validateFindings([finding],["scope"],pages)[0].evidence[0].verification).toBe("text_matched"));
 it("rejects fabricated citations",()=>expect(()=>validateFindings([finding],["scope"],[{...pages[0],text:"Unrelated"}])).toThrow());
 it("rejects duplicate rules",()=>expect(()=>validateFindings([finding,finding],["scope","contractor"],pages)).toThrow());
 it("does not call unreadable evidence missing",()=>expect(validateFindings([{...finding,proposedStatus:"not_found",evidence:[]}],["scope"],[{...pages[0],readable:false}])[0].proposedStatus).toBe("needs_review"));
 it("requires evidence for found",()=>expect(()=>validateFindings([{...finding,evidence:[]}],["scope"],pages)).toThrow());
 it("does not accept model-only exclusions",()=>expect(validateFindings([{...finding,proposedStatus:"not_applicable",evidence:[]}],["scope"],pages)[0].proposedStatus).toBe("needs_review"));
 it("extracts the synthetic PDF with its original page",async()=>{const result=await extractPages(new Uint8Array(await readFile("fixtures/synthetic-complete.pdf")),"test");expect(result[0].page).toBe(1);expect(result[0].text).toContain("builder@example.com");});
});
