// app/api/forgot-password/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendResetPasswordEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }

    // Verificar se usuário existe
    const { rows } = await query(
      `SELECT id, email, name FROM public."User" WHERE email = $1`,
      [email]
    )

    if (rows.length === 0) {
      // Por segurança, não informar que o email não existe
      return NextResponse.json({ 
        success: true,
        message: "Se o email existir, você receberá instruções de recuperação"
      })
    }

    const user = rows[0]

    // Gerar token de reset (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hora

    // Salvar token no banco
    await query(
      `UPDATE public."User" 
       SET "resetToken" = $1, "resetTokenExpiry" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, user.id]
    )

    // Enviar email
    try {
      await sendResetPasswordEmail({
        to: user.email,
        token: resetToken,
        userName: user.name,
      })
      
      console.log(`✅ Email de reset enviado para ${user.email}`)
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError)
      // Continua mesmo se o email falhar (mas loga o erro)
    }

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções de recuperação",
    })
  } catch (error: any) {
    console.error("Erro ao solicitar reset de senha:", error)
    return NextResponse.json({ 
      error: "Erro interno ao processar solicitação" 
    }, { 
      status: 500 
    })
  }
}
