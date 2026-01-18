type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.AUTH_EMAIL_FROM;

function getEmailConfig() {
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    throw new Error(
      "Email provider not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM."
    );
  }

  return {
    apiKey: RESEND_API_KEY,
    from: EMAIL_FROM,
  };
}

export async function sendEmail(payload: EmailPayload) {
  const { apiKey, from } = getEmailConfig();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send email: ${errorBody}`);
  }
}
