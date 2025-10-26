import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { validateSession, revokeSession } from "@/lib/session"
import { signOut } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("app_session")?.value

    // Revogar sessão no banco se existir
    if (sessionToken) {
      const session = await validateSession(sessionToken)
      if (session) {
        await revokeSession(session.id, session.userId, "Manual logout")
      }
    }

    // Criar response
    const response = NextResponse.json({ success: true })
    
    // Remover cookie
    response.cookies.delete("app_session")

    return response

  } catch (error) {
    console.error("Erro no logout:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Método GET para logout via link/redirect
export async function GET() {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("app_session")?.value

    // Revogar sessão no banco se existir
    if (sessionToken) {
      const session = await validateSession(sessionToken)
      if (session) {
        await revokeSession(session.id, session.userId, "Manual logout")
      }
    }

    // Redirecionar para página de login
    const response = NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"))
    
    // Remover cookie
    response.cookies.delete("app_session")

    return response

  } catch (error) {
    console.error("Erro no logout:", error)
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"))
  }
}