import { auth } from "@/auth"
import { query } from "@/lib/db"
import { revokeSession, revokeAllUserSessions, validateSession } from "@/lib/session"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { rows } = await query(
      `SELECT 
         s."id", 
         s."deviceId", 
         s."expires", 
         s."lastActivity", 
         s."ipAddress",
         s."createdAt",
         s."sessionToken",
         d."platform",
         d."userAgent"
       FROM public."UserSession" s
       JOIN public."Device" d ON s."deviceId" = d."id"
       WHERE s."userId" = $1 AND s."isActive" = true
       ORDER BY s."lastActivity" DESC`,
      [session.user.id]
    )

    // Marcar sessão atual
    const cookieStore = cookies()
    const currentToken = cookieStore.get("app_session")?.value
    
    const sessionsWithCurrent = rows.map(s => ({
      ...s,
      isCurrent: s.sessionToken === currentToken,
      sessionToken: undefined // Não retornar o token por segurança
    }))

    return NextResponse.json({ 
      sessions: sessionsWithCurrent,
      total: sessionsWithCurrent.length,
      currentSessionId: sessionsWithCurrent.find(s => s.isCurrent)?.id
    })

  } catch (error) {
    console.error("Erro buscando sessões:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action')

    if (action === 'all') {
      // Manter apenas a sessão atual
      const cookieStore = cookies()
      const currentToken = cookieStore.get("app_session")?.value
      let currentSessionId = null
      
      if (currentToken) {
        const current = await validateSession(currentToken)
        currentSessionId = current?.id
      }

      await revokeAllUserSessions(session.user.id, currentSessionId)
      return NextResponse.json({ 
        message: "All other sessions revoked",
        revokedCount: "multiple"
      })
    }

    if (sessionId) {
      // Verificar se não é a sessão atual
      const cookieStore = cookies()
      const currentToken = cookieStore.get("app_session")?.value
      
      if (currentToken) {
        const current = await validateSession(currentToken)
        if (current?.id === sessionId) {
          return NextResponse.json({ 
            error: "Cannot revoke current session. Use logout instead." 
          }, { status: 400 })
        }
      }

      await revokeSession(sessionId, session.user.id, 'Manual revocation')
      return NextResponse.json({ 
        message: "Session revoked",
        sessionId
      })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  } catch (error) {
    console.error("Erro revogando sessão:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// Endpoint para verificar status da sessão atual
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("app_session")?.value

    if (!sessionToken) {
      return NextResponse.json({ valid: false, reason: "No session token" })
    }

    const session = await validateSession(sessionToken)
    
    if (!session) {
      return NextResponse.json({ valid: false, reason: "Invalid or expired session" })
    }

    return NextResponse.json({ 
      valid: true, 
      session: {
        id: session.id,
        userId: session.userId,
        deviceId: session.deviceId,
        expires: session.expires,
        lastActivity: session.lastActivity
      }
    })

  } catch (error) {
    console.error("Erro verificando sessão:", error)
    return NextResponse.json({ valid: false, reason: "Internal error" }, { status: 500 })
  }
}