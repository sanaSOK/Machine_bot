export interface VerificationEmailParams {
  verificationLink: string;
  expiresInMinutes: number;
  appName?: string;
}

export function verificationEmailTemplate(params: VerificationEmailParams): string {
  const { verificationLink, expiresInMinutes, appName = 'eRoxii Attendance' } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e1e1e1;
          border-radius: 10px;
        }
        .header { text-align: center; padding-bottom: 20px; }
        .button-container { text-align: center; margin: 30px 0; }
        .button {
          background-color: #4F46E5;
          color: #ffffff !important;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          display: inline-block;
        }
        .footer { font-size: 12px; color: #888; text-align: center; margin-top: 30px; }
        .link-alt { word-break: break-all; font-size: 11px; color: #999; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to ${appName}!</h2>
        </div>
        <p>Hi there,</p>
        <p>An account was created for you. Please confirm your email address to activate it.</p>

        <div class="button-container">
          <a href="${verificationLink}" class="button">Verify Email Address</a>
        </div>

        <p>This link will <strong>expire in ${expiresInMinutes} minutes</strong>. If you were not expecting this, no further action is required.</p>

        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          <p class="link-alt">If the button doesn't work, copy and paste this link into your browser:<br>
          ${verificationLink}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
