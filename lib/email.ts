import { Resend } from "resend";

export const ADMIN_NOTIFICATION_EMAIL = "christian@nordicbikeshows.dk";

export async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      // jobs.copenhagenbikeshow.dk is the domain already verified in Resend
      // (shared with CBS Industry Hub). Switch to a dedicated subdomain
      // later if desired — that needs its own DNS verification first.
      from: "CBS-Afstemning <noreply@jobs.copenhagenbikeshow.dk>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}
