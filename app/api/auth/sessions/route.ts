import { auth } from "@/auth"
import { query } from "@/lib/db"
import { revokeSession, revokeAllUserSessions } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { rows } = await query(
    `SELECT 
       s."id", 
       s."deviceId", 
       s."expires", 
       s."lastActivity", 
       s."ipAddress",
       s."createdAt",
       d."platform",
       d."userAgent"
     FROM public."UserSession" s
     JOIN public."Device" d ON s."deviceId" = d."id"
     WHERE s."userId" = $1 AND s."isActive" = true
     ORDER BY s."lastActivity" DESC`,
    [session.user.id]
  )

  return NextResponse.json({ sessions: rows })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  const action = searchParams.get('action')

  if (action === 'all') {
    await revokeAllUserSessions(session.user.id)
    return NextResponse.json({ message: "All sessions revoked" })
  }

  if (sessionId) {
    await revokeSession(sessionId, session.user.id, 'Manual revocation')
    return NextResponse.json({ message: "Session revoked" })
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}
