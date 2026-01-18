import { NextRequest, NextResponse } from "next/server";
import { db, users } from "@/db";
import { inArray } from "drizzle-orm";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const MAX_RECIPIENTS = 50;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return email.includes("@");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailContent(message: string, senderLabel: string) {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const html = [
    "<!doctype html>",
    "<html>",
    "<body style=\"margin:0;background:#f4f2ee;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;\">",
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding:24px;\">",
    "<tr><td align=\"center\">",
    "<table role=\"presentation\" width=\"560\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#ffffff;border:1px solid #e8e2d8;border-radius:18px;padding:28px;\">",
    "<tr><td>",
    "<div style=\"font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8a7f6d;font-weight:600;\">MedCram Admin</div>",
    "<h1 style=\"margin:12px 0 12px 0;font-size:20px;color:#2a2520;\">Message from your MedCram team</h1>",
    `<div style=\"font-size:14px;line-height:1.7;color:#3b342d;\">${safeMessage}</div>`,
    `<div style=\"margin-top:20px;font-size:12px;color:#8a7f6d;\">Sent by ${escapeHtml(senderLabel)}</div>`,
    "</td></tr>",
    "</table>",
    "</td></tr>",
    "</table>",
    "</body>",
    "</html>",
  ].join("");

  const text = [
    "MedCram Admin",
    "",
    message,
    "",
    `Sent by ${senderLabel}`,
  ].join("\n");

  return { html, text };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();
    const rawUserIds = Array.isArray(body.userIds) ? body.userIds : [];
    const userIds: string[] = rawUserIds.filter(
      (id: unknown): id is string => typeof id === "string" && id.trim().length > 0
    );
    const rawEmails = Array.isArray(body.emails) ? body.emails : [];
    const emails: string[] = rawEmails.filter(
      (email: unknown): email is string => typeof email === "string"
    );

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const recipients = new Set<string>();

    if (userIds.length > 0) {
      const uniqueIds = Array.from(new Set(userIds));
      const results = await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.id, uniqueIds));
      results
        .map((row) => row.email)
        .filter((email): email is string => typeof email === "string")
        .forEach((email: string) => recipients.add(normalizeEmail(email)));
    }

    emails
      .map(normalizeEmail)
      .filter(isValidEmail)
      .forEach((email) => recipients.add(email));

    const recipientList = Array.from(recipients);

    if (recipientList.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    if (recipientList.length > MAX_RECIPIENTS) {
      return NextResponse.json(
        { error: `Too many recipients. Max ${MAX_RECIPIENTS}.` },
        { status: 400 }
      );
    }

    const senderLabel = user?.name || user?.email || "MedCram Admin";
    const { html, text } = buildEmailContent(message, senderLabel);

    for (const to of recipientList) {
      await sendEmail({
        to,
        subject,
        html,
        text,
        replyTo: user?.email ?? undefined,
      });
    }

    return NextResponse.json({ sent: recipientList.length });
  } catch (error) {
    console.error("Failed to send admin email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
