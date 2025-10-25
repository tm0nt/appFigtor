// app/api/feedbacks/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT * FROM public."Feedback" 
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC 
       LIMIT 20`,
      [session.user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rating, message, type = "OTHER", url = null, metadata = null } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 })
    }

    // Validar tipo - UPPERCASE conforme ENUMs do banco
    const validTypes = ["BUG", "FEATURE", "RATING", "OTHER"]
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Tipo de feedback inválido" }, { status: 400 })
    }

    const { rows } = await query(
      `INSERT INTO public."Feedback" ("userId", rating, message, type, url, status, metadata)
       VALUES ($1, $2, $3, $4::text::"FeedbackType", $5, 'pending', $6)
       RETURNING *`,
      [session.user.id, rating, message, type, url, metadata]
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao criar feedback:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
