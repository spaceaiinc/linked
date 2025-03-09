import { env } from '@/lib/env'
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
export async function POST(req: NextRequest) {
  const { company, email, phone, message } = await req.json()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_ADDRESS,
      pass: env.EMAIL_PASSWORD,
    },
  })

  const content = `お世話になっております。\n運営事務局でございます。\n\n先ほどはお問い合わせありがとうございました。\n3営業日以内に「${env.EMAIL_ADDRESS}」からご返信いたします。\n\n引き続きよろしくお願いいたします。`

  const mailOptions = {
    from: env.EMAIL_ADDRESS,
    to: 'hidenariyuda@gmail.com',
    subject: 'Inquiry from Linked',
    text: `COMPANY:${company}\n\nEMAIL:${email}\n\nPHONE:${phone}\n\nMESSAGE:${message}`,
  }

  const mailOptionsToUser = {
    from: env.EMAIL_ADDRESS,
    to: email,
    subject: 'お問い合わせありがとうございます　| Linked運営事務局',
    text: content,
  }

  try {
    await transporter.sendMail(mailOptions)
    await transporter.sendMail(mailOptionsToUser)
    return NextResponse.json({ message: 'success' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: 'error' })
  }
}
