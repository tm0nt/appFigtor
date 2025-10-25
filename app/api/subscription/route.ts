// app/api/subscription/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

// GET - Buscar assinatura atual
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT s.*, p.* 
       FROM public."Subscription" s
       JOIN public."Plan" p ON s."planId" = p.id
       WHERE s."userId" = $1 AND s."isCurrent" = true
       LIMIT 1`,
      [session.user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription: rows[0] })
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
