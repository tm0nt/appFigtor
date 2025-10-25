// app/api/stats/route.ts
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
    const period = searchParams.get("period") || "7D"

    let dateFilter = "NOW() - INTERVAL '7 days'"
    if (period === "1D") dateFilter = "NOW() - INTERVAL '1 day'"
    if (period === "30D") dateFilter = "NOW() - INTERVAL '30 days'"

    // Buscar conversões por dia
    const { rows } = await query(
      `SELECT 
         DATE("createdAt") as date,
         COUNT(*) as count
       FROM public."Conversion"
       WHERE "userId" = $1 
       AND "createdAt" >= ${dateFilter}
       GROUP BY DATE("createdAt")
       ORDER BY date ASC`,
      [session.user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
