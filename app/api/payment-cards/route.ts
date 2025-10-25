// app/api/payment-cards/route.ts
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
      `SELECT * FROM public."PaymentCard" 
       WHERE "userId" = $1
       ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [session.user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar cartões:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
