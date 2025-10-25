// app/api/subscription/activate-free/route.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { query } from "@/lib/db"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verificar se já usou o plano FREE
    const { rows: userRows } = await query(
      `SELECT "hasUsedFreePlan" FROM public."User" WHERE id = $1`,
      [session.user.id]
    )

    if (userRows[0]?.hasUsedFreePlan) {
      return NextResponse.json(
        { error: "Você já utilizou o plano gratuito anteriormente" },
        { status: 400 }
      )
    }

    // Buscar plano FREE
    const { rows: planRows } = await query(
      `SELECT * FROM public."Plan" WHERE name = 'FREE' AND "isActive" = true LIMIT 1`
    )

    if (planRows.length === 0) {
      return NextResponse.json({ error: "Plano FREE não disponível" }, { status: 404 })
    }

    const freePlan = planRows[0]

    // Desativar assinatura atual se existir
    await query(
      `UPDATE public."Subscription" 
       SET "isCurrent" = false, "updatedAt" = NOW()
       WHERE "userId" = $1 AND "isCurrent" = true`,
      [session.user.id]
    )

    // Criar nova assinatura FREE (30 dias)
    const { rows: subscriptionRows } = await query(
      `INSERT INTO public."Subscription" 
       ("userId", "planId", status, "isCurrent", "startedAt", "currentPeriodStart", "currentPeriodEnd", "cancelAtPeriodEnd")
       VALUES ($1, $2, 'ACTIVE', true, NOW(), NOW(), NOW() + INTERVAL '30 days', false)
       RETURNING *`,
      [session.user.id, freePlan.id]
    )

    // Marcar que usuário já usou o plano FREE
    await query(
      `UPDATE public."User" 
       SET "hasUsedFreePlan" = true, "currentSubscriptionId" = $2, "updatedAt" = NOW()
       WHERE id = $1`,
      [session.user.id, subscriptionRows[0].id]
    )

    return NextResponse.json({ 
      success: true, 
      subscription: subscriptionRows[0],
      message: "Plano FREE ativado com sucesso! Válido por 30 dias."
    })
  } catch (error) {
    console.error("Erro ao ativar plano FREE:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
