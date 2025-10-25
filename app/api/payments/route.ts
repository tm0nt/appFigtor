// app/api/payments/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

// GET - Histórico de pagamentos
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { rows } = await query(
      `SELECT * FROM public."Payment" 
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [session.user.id]
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// POST - Criar novo pagamento
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { planId, method } = await req.json()

    if (!planId || !method) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    // Buscar plano
    const { rows: planRows } = await query(
      `SELECT * FROM public."Plan" WHERE id = $1`,
      [planId]
    )

    if (planRows.length === 0) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    const plan = planRows[0]

    // Criar pagamento
    const { rows } = await query(
      `INSERT INTO public."Payment" 
       ("userId", provider, method, status, amount, currency, description)
       VALUES ($1, 'manual', $2::text::"PaymentMethod", 'PENDING', $3, $4, $5)
       RETURNING *`,
      [
        session.user.id,
        method,
        plan.priceAmount,
        plan.currency,
        `Pagamento ${plan.displayName}`
      ]
    )

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Erro ao criar pagamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
