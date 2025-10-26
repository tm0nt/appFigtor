// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

interface SendResetPasswordEmailParams {
  to: string
  token: string
  userName?: string
}

export async function sendResetPasswordEmail({
  to,
  token,
  userName
}: SendResetPasswordEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  const mailOptions = {
    from: `"Figtor" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Redefinir sua senha - Figtor',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir Senha - Figtor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background: #0f0f0f; border-radius: 16px; border: 1px solid #1a1a1a; overflow: hidden; max-width: 600px;">
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 50px 40px 30px 40px; background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%);">
              <img src="https://app.figtor.com.br/logo.png" alt="Figtor" style="height: 40px; width: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          <!-- Content Section -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #ffffff; font-size: 32px; font-weight: 600; margin: 0 0 20px 0; text-align: center; letter-spacing: -0.5px;">
                Redefinir sua senha
              </h1>
              ${userName ? `
              <p style="color: #90f209; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
                Olá, ${userName}! 👋
              </p>
              ` : ''}
              <p style="color: #999999; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0; text-align: center;">
                Recebemos uma solicitação para redefinir a senha da sua conta Figtor.
              </p>
              <p style="color: #999999; font-size: 16px; line-height: 1.6; margin: 0 0 35px 0; text-align: center;">
                Clique no botão abaixo para criar uma nova senha:
              </p>
              <div style="text-align: center; padding: 0 0 35px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #90f209 0%, #a0ff20 100%); color: #000000; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px;">
                  REDEFINIR SENHA
                </a>
              </div>
              <div style="border-top: 1px solid #1a1a1a; margin: 35px 0;"></div>
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0 0 10px 0; text-align: center;">
                Ou copie e cole este link no seu navegador:
              </p>
              <div style="background: #1a1a1a; border: 1px solid #262626; border-radius: 8px; padding: 16px; margin: 0 0 30px 0;">
                <p style="color: #90f209; font-size: 12px; line-height: 1.6; margin: 0; word-break: break-all; text-align: center; font-family: 'Courier New', monospace;">
                  ${resetUrl}
                </p>
              </div>
              <div style="background: #1a1a1a; border: 1px solid rgba(255, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin: 0 0 25px 0;">
                <div style="display: table; width: 100%;">
                  <div style="display: table-cell; width: 40px; vertical-align: top;">
                    <span style="font-size: 24px;">⚠️</span>
                  </div>
                  <div style="display: table-cell; vertical-align: top;">
                    <p style="color: #ff4444; font-size: 14px; line-height: 1.5; margin: 0; font-weight: 600;">
                      Importante:
                    </p>
                    <p style="color: #ff8888; font-size: 13px; line-height: 1.5; margin: 5px 0 0 0;">
                      Este link expira em 1 hora e só pode ser usado uma vez.
                    </p>
                  </div>
                </div>
              </div>
              <div style="background: #1a1a1a; border: 1px solid #262626; border-radius: 12px; padding: 20px;">
                <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                  🔒 Se você não solicitou a redefinição de senha, ignore este email. Sua senha permanecerá a mesma e sua conta está segura.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background: #0a0a0a; border-top: 1px solid #1a1a1a;">
              <p style="color: #666666; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                © ${new Date().getFullYear()} <span style="color: #90f209; font-weight: 600;">Figtor</span>. Todos os direitos reservados.
              </p>
              <p style="color: #444444; font-size: 11px; line-height: 1.5; margin: 15px 0 0 0; text-align: center;">
                Este é um email automático, por favor não responda.<br>
                Convertendo designs em realidade ✨
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    throw new Error('Falha ao enviar email')
  }
}

export async function sendWelcomeEmail({ to, userName }: { to: string; userName: string }) {
  const mailOptions = {
    from: `"Figtor" <${process.env.EMAIL_FROM}>`,
    to,
    subject: 'Bem-vindo ao Figtor! 🎉',
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Figtor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="background: #0f0f0f; border-radius: 16px; border: 1px solid #1a1a1a; overflow: hidden; max-width: 600px;">
          <!-- Logo Header com glow simulado -->
          <tr>
            <td align="center" style="padding: 50px 40px 30px 40px; background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%);">
              <img src="https://app.figtor.com.br/logo.png" alt="Figtor" style="height: 45px; width: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="color: #ffffff; font-size: 36px; font-weight: 700; margin: 0 0 15px 0; text-align: center; letter-spacing: -1px;">
                Bem-vindo ao Figtor!
              </h1>
              <p style="color: #90f209; font-size: 20px; font-weight: 600; margin: 0 0 30px 0; text-align: center;">
                Olá, ${userName}! 👋
              </p>
              <p style="color: #999999; font-size: 16px; line-height: 1.7; margin: 0 0 15px 0; text-align: center;">
                Estamos <span style="color: #ffffff; font-weight: 600;">muito felizes</span> em ter você conosco!
              </p>
              <p style="color: #999999; font-size: 16px; line-height: 1.7; margin: 0 0 40px 0; text-align: center;">
                Agora você pode converter seus designs do Figma em código de forma rápida, fácil e profissional.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 40px;">
                <tr>
                  <td style="padding: 15px; background: #1a1a1a; border-radius: 12px; border: 1px solid #262626; text-align: center; width: 33.33%;">
                    <div style="font-size: 32px; margin-bottom: 10px; line-height: 1;">⚡</div>
                    <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">Conversão Rápida</p>
                    <p style="color: #666666; font-size: 12px; margin: 0;">Em poucos segundos</p>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background: #1a1a1a; border-radius: 12px; border: 1px solid #262626; text-align: center; width: 33.33%;">
                    <div style="font-size: 32px; margin-bottom: 10px; line-height: 1;">🎨</div>
                    <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">Design Perfeito</p>
                    <p style="color: #666666; font-size: 12px; margin: 0;">Fiel ao original</p>
                  </td>
                  <td style="width: 10px;"></td>
                  <td style="padding: 15px; background: #1a1a1a; border-radius: 12px; border: 1px solid #262626; text-align: center; width: 33.33%;">
                    <div style="font-size: 32px; margin-bottom: 10px; line-height: 1;">💻</div>
                    <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">Código Limpo</p>
                    <p style="color: #666666; font-size: 12px; margin: 0;">Pronto para usar</p>
                  </td>
                </tr>
              </table>
              <div style="text-align: center; padding: 0 0 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #90f209 0%, #a0ff20 100%); color: #000000; text-decoration: none; padding: 20px 60px; border-radius: 12px; font-weight: 700; font-size: 18px; letter-spacing: 0.5px;">
                  COMEÇAR AGORA →
                </a>
              </div>
              <div style="background: #1a1a1a; border: 1px solid rgba(144, 242, 9, 0.2); border-radius: 12px; padding: 25px; margin-top: 30px;">
                <p style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 10px 0; text-align: center;">
                  💡 Precisa de ajuda?
                </p>
                <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                  Nossa equipe está pronta para ajudar! Entre em contato através do suporte ou visite nossa <a href="#" style="color: #90f209; text-decoration: underline;">documentação</a>.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; background: #0a0a0a; border-top: 1px solid #1a1a1a; text-align: center;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} <span style="color: #90f209; font-weight: 600;">Figtor</span>. Todos os direitos reservados.
              </p>
              <p style="color: #444444; font-size: 11px; margin: 0;">
                Convertendo designs em realidade ✨
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Email de boas-vindas enviado')
  } catch (error) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error)
  }
}
