// import { profile } from 'console'
// import nodemailer from 'nodemailer'
// import { env } from 'process'
// import { unipileClient } from '../unipile'

// // Define the interface for the email parameters
// interface ReconnectionEmailParams {
//   userId: string
//   companyId: string
//   toEmail: string
//   userName?: string
// }

// /**
//  * Sends a reconnection email to the specified user.
//  * @param params - An object containing the recipient's email and other optional details.
//  */
// export async function sendReconnectionEmail({
//   toEmail,
//   userId,
//   companyId,
//   userName,
// }: ReconnectionEmailParams): Promise<void> {
//   // 1. Create a Nodemailer transporter using Gmail service
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_ADDRESS, // Ensure this env var is set
//       pass: process.env.EMAIL_PASSWORD, // Ensure this env var is set
//     },
//   })

//   // TODO: add check reconect or create
//   const nameJson = JSON.stringify({
//     user_id: userId,
//     company_id: profile.companyId,
//   })

//   const res = await unipileClient.account.createHostedAuthLink({
//     type: 'reconnect',
//     reconnect_account: string;
//     name?: string;
//     expiresOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
//     api_url: `https://${env.UNIPILE_DNS}`,
//     providers: ['LINKEDIN'],
//     success_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/dashboard?wait=true`,
//     failure_redirect_url: `${env.NEXT_PUBLIC_PRODUCTION_URL}/dashboard?wait=true`,
//     name: nameJson,
//     notify_url:
//       env.NEXT_PUBLIC_APP_ENV === 'production'
//         ? `${env.NEXT_PUBLIC_PRODUCTION_URL}/api/provider/auth/callback`
//         : `${process.env.NEXT_PUBLIC_NOTIFY_URL}/api/provider/auth/callback`,
//   })

//   res.url = res.url.replace('account.unipile.com', 'provider.spaceai.jp')

//   // 2. Define email content
//   const subject = 'We miss you! Reconnect with Us'
//   const textBody = `Hi ${userName || 'there'},\n\nIt's been a while since we last saw you. We'd love for you to come back and see what's new.\n\nBest regards,\nYour Team`
//   // You can also add an HTML body for richer content:
//   // const htmlBody = `<p>Hi ${userName || 'there'},</p><p>It's been a while... </p>`;

//   // 3. Define mail options
//   const mailOptions = {
//     from: process.env.EMAIL_ADDRESS,
//     to: toEmail,
//     subject: subject,
//     text: textBody,
//     // html: htmlBody, // Uncomment if you use HTML body
//   }

//   // 4. Send the email
//   try {
//     const info = await transporter.sendMail(mailOptions)
//     console.log('Reconnection Email sent: %s', info.messageId)
//     // Handle success (e.g., logging)
//   } catch (error) {
//     console.error('Error sending reconnection email:', error)
//     // Handle error (e.g., logging, throwing error)
//     // Depending on requirements, you might want to throw the error
//     // throw new Error('Failed to send reconnection email.');
//   }
// }

// // Example of how to potentially use this function (e.g., in an API route or server action)
// /*
// import { sendReconnectionEmail } from '@/lib/utils/mail';

// export async function someFunction() {
//   try {
//     await sendReconnectionEmail({ toEmail: 'user@example.com', userName: 'John Doe' });
//     // Handle success
//   } catch (error) {
//     // Handle error
//   }
// }
// */
