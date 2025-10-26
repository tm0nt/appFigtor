import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import { createUserSession } from "@/lib/session"
import { getDeviceInfo } from "@/lib/device-detector"
import { checkFraudRisk, recordDeviceFingerprint } from "@/lib/fraud-detection"
import { signIn } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password, fingerprint } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const deviceInfo = await getDeviceInfo()
    
    // Verificar fraude
    if (fingerprint) {
      const fraudCheck = await checkFraudRisk(
        email.toLowerCase().trim(),
        fingerprint,
        deviceInfo.ip,
        deviceInfo.userAgent
      )

      if (!fraudCheck.allowed) {
        return NextResponse.json(
          { error: fraudCheck.reason || "Acesso bloqueado" }, 
          { status: 403 }
        )
      }
    }

    // Buscar usuário
    const { rows } = await query<{
      id: string
      email: string
      name: string | null
      passwordHash: string | null
    }>(
      `SELECT "id","email","name","passwordHash"
       FROM public."User"
       WHERE "email" = $1
       LIMIT 1`,
      [email.toLowerCase().trim()]
    )

    const user = rows[0]
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    // Criar sessão própria
    const { sessionToken, expires } = await createUserSession(user.id, {
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
      fingerprint
    })

    // Registrar fingerprint se fornecido
    if (fingerprint) {
      await recordDeviceFingerprint(
        user.id,
        fingerprint,
        deviceInfo.ip,
        deviceInfo.userAgent,
        {
          platform: deviceInfo.osName
        }
      )
    }

    // Atualizar último login
    await query(
      `UPDATE public."User" SET "updatedAt" = NOW() WHERE "id" = $1`,
      [user.id]
    )

    // Criar response com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

    // Setar cookie de sessão própria
    response.cookies.set("app_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires
    })

    return response

  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}