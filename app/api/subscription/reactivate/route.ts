// app/api/subscription/reactivate/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `UPDATE public."Subscription" 
       SET "cancelAtPeriodEnd" = false, "updatedAt" = NOW()
       WHERE "userId" = $1 AND "isCurrent" = true
       RETURNING *`,
      [session.user.id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ subscription: rows[0] })
  } catch (error) {
    console.error("Erro ao reativar assinatura:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
