// app/api/conversions/route.ts
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Buscar conversões
    const { rows } = await query(
      `SELECT * FROM public."Conversion" 
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2 OFFSET $3`,
      [session.user.id, limit, offset]
    )

    // Contar total
    const { rows: countRows } = await query(
      `SELECT COUNT(*) as total FROM public."Conversion" WHERE "userId" = $1`,
      [session.user.id]
    )

    return NextResponse.json({
      conversions: rows,
      total: parseInt(countRows[0].total),
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit),
    })
  } catch (error) {
    console.error("Erro ao buscar conversões:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
