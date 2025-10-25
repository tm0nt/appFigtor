// app/api/plans/route.ts
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const { rows } = await query(
      `SELECT * FROM public."Plan" 
       WHERE "isActive" = true
       ORDER BY "priceAmount" ASC`
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar planos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
