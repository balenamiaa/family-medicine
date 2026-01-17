const RESEND_API_KEY = process.env.RESEND_API_KEY;
const AUTH_EMAIL_FROM = process.env.AUTH_EMAIL_FROM;

export async function sendLoginCodeEmail(email: string, code: string, ttlMinutes: number) {
  if (!RESEND_API_KEY || !AUTH_EMAIL_FROM) {
    throw new Error(
      "Email provider not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM."
    );
  }

  const subject = "Your MedCram login code";
  const text = [
    "Your MedCram login code is:",
    code,
    "",
    `This code expires in ${ttlMinutes} minutes.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = [
    "<div style=\"font-family:Arial,Helvetica,sans-serif;line-height:1.5;\">",
    "<h2 style=\"margin:0 0 12px 0;\">Your MedCram login code</h2>",
    "<p style=\"margin:0 0 12px 0;\">Use this code to finish signing in:</p>",
    `<div style=\"font-size:24px;font-weight:700;letter-spacing:4px;\">${code}</div>`,
    `<p style=\"margin:12px 0 0 0;\">This code expires in ${ttlMinutes} minutes.</p>`,
    "<p style=\"margin:12px 0 0 0;\">If you did not request this, you can ignore this email.</p>",
    "</div>",
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
