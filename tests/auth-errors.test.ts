import {describe,it,expect} from "vitest";
import {explainSendFailure,authFailureDetails} from "../src/lib/auth/errors";
describe("sign-in failure diagnosis",()=>{
 it("distinguishes throttling from delivery failure",()=>{
 expect(explainSendFailure({code:"over_email_send_rate_limit",status:429})).toContain("Wait");
 expect(explainSendFailure({code:"email_address_not_authorized"})).toContain("custom SMTP");
 });
 it("distinguishes workspace trigger errors from SMTP errors",()=>{
 expect(explainSendFailure({message:"Database error saving new user",status:500})).toContain("workspace");
 expect(explainSendFailure({message:"Error sending confirmation mail",status:500})).toContain("email service");
 });
 it("never exposes provider secrets or emails in diagnostics",()=>{
 const error={message:"SMTP password re_secret user@example.com",code:"user@example.com",status:500};
 expect(authFailureDetails(error)).toEqual({code:"unknown",status:500});
 expect(explainSendFailure(error)).not.toContain("re_secret");
 expect(JSON.stringify(authFailureDetails(error))).not.toContain("user@example.com");
 });
});
