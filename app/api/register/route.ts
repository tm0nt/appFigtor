// app/api/register/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body?.name ?? "").trim()
    const email = (body?.email ?? "").toLowerCase().trim()
    const password = body?.password ?? ""

    if (!email || !password) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    // Hash da senha
    const hash = await bcrypt.hash(password, 12)

    // Inserir usuário no banco
    const sql = `
      INSERT INTO public."User" ("email", "name", "passwordHash")
      VALUES ($1, $2, $3)
      ON CONFLICT ("email") DO NOTHING
      RETURNING "id", "email", "name"
    `
    const { rows } = await query(sql, [email, name || null, hash])

    if (!rows[0]) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 })
    }

    const user = rows[0]

    // Enviar email de boas-vindas em background (não bloqueia resposta)
    sendWelcomeEmail({
      to: user.email,
      userName: user.name || "Usuário",
    })
      .then(() => {
        console.log(`✅ Email de boas-vindas enviado para ${user.email}`)
      })
      .catch((error) => {
        console.error(`❌ Erro ao enviar email de boas-vindas para ${user.email}:`, error)
        // Não falha o registro se o email não for enviado
      })

    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error("Erro ao registrar usuário:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
