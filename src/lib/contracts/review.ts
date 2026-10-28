import { z } from "zod";
export const ReviewStatus = z.enum(["queued", "extracting", "checking", "ready", "failed"]);
export const Finding = z.object({
 ruleId: z.string(), proposedStatus: z.enum(["evidence_found", "not_found", "needs_review", "not_applicable"]),
 reason: z.string(), evidence: z.array(z.object({documentId:z.string(),page:z.number().int().positive(),quote:z.string(),verification:z.enum(["text_matched","staff_required"])})),
 suggestedCorrection: z.string().nullable()
});
export const ReviewOutput = z.object({findings:z.array(Finding)});
export type FindingType = z.infer<typeof Finding>;
export const StartReviewResponse = z.object({reviewId:z.uuid(),status:ReviewStatus});
export const ProjectInput = z.object({name:z.string().trim().min(1).max(120),reference:z.string().trim().min(1).max(60)});
