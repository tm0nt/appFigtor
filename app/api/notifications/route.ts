// app/api/notifications/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const whereClause = unreadOnly ? `AND "readAt" IS NULL` : ""

    const { rows } = await query(
      `SELECT * FROM public."Notification" 
       WHERE "userId" = $1 ${whereClause}
       ORDER BY "createdAt" DESC 
       LIMIT 50`,
      [session.user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar notificações:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { title, body, type = "SYSTEM", channel = "IN_APP", data = null } = await req.json()

    if (!title || !body) {
      return NextResponse.json({ error: "Título e corpo obrigatórios" }, { status: 400 })
    }

    // Validar tipo
    const validTypes = ["SYSTEM", "BILLING", "USAGE", "ALERT", "MARKETING"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    // Validar canal
    const validChannels = ["IN_APP", "EMAIL", "PUSH", "SMS"]
    if (!validChannels.includes(channel)) {
      return NextResponse.json({ error: "Canal inválido" }, { status: 400 })
    }

    const { rows } = await query(
      `INSERT INTO public."Notification" ("userId", title, body, type, channel, data)
       VALUES ($1, $2, $3, $4::text::"NotificationType", $5::text::"NotificationChannel", $6)
       RETURNING *`,
      [session.user.id, title, body, type, channel, data]
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao criar notificação:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
