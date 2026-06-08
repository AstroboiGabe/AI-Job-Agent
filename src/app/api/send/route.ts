import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { toEmail, subject, body } = await request.json();
    
    if (!toEmail || !subject || !body) {
      return NextResponse.json({ error: "Missing toEmail, subject, or body" }, { status: 400 });
    }

    const isDryRun = process.env.DRY_RUN?.toLowerCase() === "true";
    
    if (isDryRun) {
      console.log(`[DRY RUN] Simulating email send to ${toEmail}`);
      console.log(`[DRY RUN] Subject: ${subject}`);
      return NextResponse.json({ success: true, status: "sent_dry_run" });
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      return NextResponse.json({ error: "GMAIL_USER or GMAIL_APP_PASSWORD is missing in Environment Variables" }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: user,
      to: toEmail,
      subject: subject,
      text: body
    });

    return NextResponse.json({ success: true, status: "sent" });
  } catch (error: any) {
    console.error("Send API Error:", error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
