// app/api/reset-password/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token e senha são obrigatórios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    // Buscar usuário pelo token válido
    const { rows } = await query(
      `SELECT id, email FROM public."User" 
       WHERE "resetToken" = $1 
       AND "resetTokenExpiry" > NOW()`,
      [token]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
    }

    const user = rows[0]

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Atualizar senha e remover token
    await query(
      `UPDATE public."User" 
       SET passwordHash = $1, 
           "resetToken" = NULL, 
           "resetTokenExpiry" = NULL,
           "updatedAt" = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    )

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao resetar senha:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
