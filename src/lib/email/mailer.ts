import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return _transporter;
}

export async function sendMail(options: {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  return getMailer().sendMail(options);
}
