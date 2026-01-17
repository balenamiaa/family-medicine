const RESEND_API_KEY = process.env.RESEND_API_KEY;
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM;

export async function sendLoginCodeEmail(email: string, code: string, ttlMinutes: number) {
  if (!RESEND_API_KEY || !AUTH_EMAIL_FROM) {
    throw new Error(
      "Email provider not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM."
    );
  }

  const subject = "Your MedCram sign-in code";
  const text = [
    `Hi ${email},`,
    "",
    `Your MedCram sign-in code is: ${code}`,
    "",
    `This code expires in ${ttlMinutes} minutes. If you didn’t request it, you can ignore this email.`,
    "",
    "— MedCram",
    AUTH_EMAIL_FROM,
  ].join("\n");

  const html = [
    "<!doctype html>",
    "<html>",
    "<body style=\"margin:0;background:#f7f6f3;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;\">",
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:24px;\">",
    "<tr><td align=\"center\">",
    "<table role=\"presentation\" width=\"520\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border:1px solid #e6e2db;border-radius:16px;padding:24px;\">",
    "<tr><td>",
    "<h1 style=\"margin:0 0 8px 0;font-size:20px;\">Your MedCram sign-in code</h1>",
    `<p style=\"margin:0 0 16px 0;font-size:14px;color:#4a4a4a;\">Hi ${email}, use the code below to finish signing in.</p>`,
    `<div style=\"background:#f2efe9;border:1px solid #e0d8cc;border-radius:12px;padding:16px;text-align:center;font-size:28px;font-weight:700;letter-spacing:4px;\">${code}</div>`,
    `<p style=\"margin:16px 0 0 0;font-size:12px;color:#6b6b6b;\">This code expires in ${ttlMinutes} minutes. If you didn’t request it, ignore this email.</p>`,
    `<p style=\"margin:16px 0 0 0;font-size:12px;color:#6b6b6b;\">— MedCram<br>${AUTH_EMAIL_FROM}</p>`,
    "</td></tr>",
    "</table>",
    "</td></tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: AUTH_EMAIL_FROM,
      to: email,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send login code email: ${errorBody}`);
  }
}
