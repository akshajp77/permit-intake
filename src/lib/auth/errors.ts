type AuthFailure = { code?: string; status?: number; message?: string };
export function explainSendFailure(error: AuthFailure) {
  const code = error.code;
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error.status === 429)
    return "Too many sign-in requests. Wait before requesting another code.";
  if (code === "email_address_not_authorized")
    return "Email delivery is restricted to project team members. Configure custom SMTP to invite other users.";
  if (code === "email_address_invalid") return "Enter a valid email address.";
  if (code === "signup_disabled") return "New account registration is currently disabled.";
  if (code === "email_provider_disabled" || code === "otp_disabled") return "Email sign-in is currently disabled.";
  if (/database error saving new user/i.test(error.message ?? ""))
    return "Your workspace could not be created. Ask the administrator to check account setup.";
  if (/sending (confirmation|magic link|recovery) (email|mail)|smtp/i.test(error.message ?? ""))
    return "The email service could not deliver your code. Ask the administrator to check email delivery.";
  return "Sign-in is temporarily unavailable. Please try again later.";
}
// Never log the raw error: provider messages can contain email addresses or credentials.
export function authFailureDetails(error: AuthFailure) {
  const code = /^[a-z_]{1,80}$/.test(error.code ?? "") ? error.code! : "unknown";
  return { code, status: Number.isInteger(error.status) ? error.status : undefined };
}
