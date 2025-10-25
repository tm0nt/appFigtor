// app/(dashboard)/payments/page.tsx
"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  AlertCircle,
  Zap,
} from "lucide-react"
import {
  useSubscription,
  useCancelSubscription,
  useReactivateSubscription,
  useActivateFreePlan,
  useCheckFreePlanEligibility,
} from "@/hooks/use-subscription"
import { usePayments, usePaymentCards, usePlans } from "@/hooks/use-payments"
import { toast } from "sonner"

type PaymentStep = "plan" | "method" | "card" | "pix" | "processing" | "success"

export default function PaymentsPage() {
  const [mounted, setMounted] = useState(false)
  const { data: subscription } = useSubscription()
  const { data: payments = [], isLoading: paymentsLoading } = usePayments()
  const { data: cards = [] } = usePaymentCards()
  const { data: plans = [] } = usePlans()
  const { data: freeEligibility } = useCheckFreePlanEligibility()
  const cancelSubscription = useCancelSubscription()
  const reactivateSubscription = useReactivateSubscription()
  const activateFreePlan = useActivateFreePlan()

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [currentStep, setCurrentStep] = useState<PaymentStep>("plan")
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [selectedMethod, setSelectedMethod] = useState<"card" | "pix" | null>(null)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [pixCode, setPixCode] = useState("")
  const [pixQrCode, setPixQrCode] = useState("")

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(payments.length / itemsPerPage)
  const paginatedPayments = payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (showPaymentDialog || showCancelModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [showPaymentDialog, showCancelModal])

  const handleCancelSubscription = async () => {
    const t = toast.loading("Cancelando assinatura...")
    try {
      await cancelSubscription.mutateAsync()
      toast.success("Assinatura cancelada. Permanecerá ativa até o fim do período.", { id: t })
      setShowCancelModal(false)
    } catch (error) {
      toast.error("Erro ao cancelar assinatura", { id: t })
    }
  }

  const handleReactivateSubscription = async () => {
    const t = toast.loading("Reativando assinatura...")
    try {
      await reactivateSubscription.mutateAsync()
      toast.success("Assinatura reativada com sucesso!", { id: t })
    } catch (error) {
      toast.error("Erro ao reativar assinatura", { id: t })
    }
  }

  const openPaymentDialog = () => {
    setShowPaymentDialog(true)
    setCurrentStep("plan")
    setSelectedPlan(null)
    setSelectedMethod(null)
    setSelectedCard(null)
  }

  const closePaymentDialog = () => {
    setShowPaymentDialog(false)
    setCurrentStep("plan")
    setSelectedPlan(null)
    setSelectedMethod(null)
    setSelectedCard(null)
    setPixCode("")
    setPixQrCode("")
  }

  const handleSelectPlan = async (plan: any) => {
    if (subscription?.planId === plan.id) {
      toast.error("Este já é seu plano atual")
      return
    }

    // Se for plano FREE
    if (plan.name === "FREE") {
      if (freeEligibility?.hasUsedFreePlan) {
        toast.error("Você já utilizou o plano gratuito anteriormente")
        return
      }

      if (!confirm("Deseja ativar o plano FREE por 30 dias? Esta oferta só pode ser usada uma vez.")) {
        return
      }

      const t = toast.loading("Ativando plano FREE...")
      try {
        const result = await activateFreePlan.mutateAsync()
        toast.success(result.message || "Plano FREE ativado com sucesso!", { id: t })
        closePaymentDialog()
      } catch (error: any) {
        toast.error(error.message || "Erro ao ativar plano FREE", { id: t })
      }
      return
    }

    setSelectedPlan(plan)
    setCurrentStep("method")
  }

  const handleSelectMethod = (method: "card" | "pix") => {
    setSelectedMethod(method)
    if (method === "pix") {
      generatePixPayment()
    } else if (method === "card") {
      if (cards.length > 0) {
        setSelectedCard(cards.find((c: any) => c.isDefault) || cards[0])
        setCurrentStep("card")
      } else {
        toast.error("Adicione um cartão primeiro")
        setCurrentStep("method")
      }
    }
  }

  const generatePixPayment = () => {
    const randomPix = `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2, 15)}52040000530398654${selectedPlan.priceAmount}5802BR5925FIGTOR SISTEMAS6009SAO PAULO`
    setPixCode(randomPix)
    setPixQrCode(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(randomPix)}`
    )
    setCurrentStep("pix")
  }

  const handleConfirmCardPayment = () => {
    setCurrentStep("processing")
    setTimeout(() => {
      setCurrentStep("success")
      setTimeout(() => {
        closePaymentDialog()
        toast.success("Pagamento processado com sucesso!")
      }, 2000)
    }, 2000)
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    toast.success("Código PIX copiado!")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "text-[#90f209]"
      case "CANCELED":
      case "EXPIRED":
        return "text-[#ff4444]"
      case "PAST_DUE":
      case "PAUSED":
        return "text-yellow-500"
      default:
        return "text-[#666666]"
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: "Ativo",
      CANCELED: "Cancelado",
      EXPIRED: "Expirado",
      PAST_DUE: "Vencido",
      PAUSED: "Pausado",
    }
    return labels[status] || status
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "FAILED":
      case "CANCELED":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-[#666666]" />
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAID: "Pago",
      PENDING: "Pendente",
      FAILED: "Falhou",
      CANCELED: "Cancelado",
      REFUNDED: "Reembolsado",
    }
    return labels[status] || status
  }

  return (
    <>
      <DashboardLayout>
        <div className="max-w-6xl space-y-12">
          {/* Subscription Section */}
          <div>
            <h1 className="text-[#ffffff] text-3xl font-semibold mb-8">Sua assinatura</h1>

            {subscription ? (
              <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#262626]">
                <div className="flex items-center justify-between flex-wrap gap-6">
                  <div className="flex items-center gap-12 flex-wrap">
                    <div>
                      <div className="text-[#666666] text-xs uppercase mb-2">Plano</div>
                      <div className="text-[#ffffff] text-2xl font-semibold">
                        {subscription.displayName || "Elite"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666666] text-xs uppercase mb-2">Limite</div>
                      <div className="text-[#ffffff] text-lg">
                        {subscription.isUnlimited
                          ? "Ilimitado"
                          : `${subscription.pagesLimitPerMonth} páginas/mês`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666666] text-xs uppercase mb-2">Preço</div>
                      <div className="text-[#ffffff] text-lg">
                        R$ {Number(subscription.priceAmount).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#666666] text-xs uppercase mb-2">Status</div>
                      <div className={`text-lg font-semibold ${getStatusColor(subscription.status)}`}>
                        {getStatusLabel(subscription.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={openPaymentDialog}
                      className="bg-[#90f209] text-[#000000] font-semibold px-6 py-3 rounded-lg hover:bg-[#a0ff20] transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      Mudar Plano
                    </button>

                    {subscription.cancelAtPeriodEnd ? (
                      <button
                        onClick={handleReactivateSubscription}
                        className="bg-[#90f209] text-[#000000] font-semibold px-6 py-3 rounded-lg hover:bg-[#a0ff20] transition-all duration-300"
                      >
                        Reativar
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="bg-[#8B0000] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#a00000] transition-all duration-300"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <p className="text-yellow-500 text-sm">
                      Sua assinatura será cancelada em{" "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}. Você ainda
                      pode usar o serviço até lá.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center border border-[#262626]">
                <p className="text-[#666666] mb-6">Você não possui uma assinatura ativa</p>
                <button
                  onClick={openPaymentDialog}
                  className="bg-[#90f209] text-[#000000] font-semibold px-8 py-3 rounded-lg hover:bg-[#a0ff20] transition-colors"
                >
                  Escolher Plano
                </button>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-[#ffffff] text-3xl font-semibold">Métodos de pagamento</h1>
              <button className="bg-[#1a1a1a] text-[#ffffff] font-semibold px-6 py-3 rounded-lg hover:bg-[#262626] transition-colors flex items-center gap-2 border border-[#262626]">
                <Plus className="w-4 h-4" />
                Adicionar Cartão
              </button>
            </div>

            {cards.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {cards.map((card: any) => (
                  <div
                    key={card.id}
                    className="bg-gradient-to-br from-[#90f209] to-[#7acc00] rounded-2xl p-8 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-12">
                        <span className="text-[#000000] text-xl font-semibold">Figtor</span>
                        {card.isDefault && (
                          <span className="bg-[#000000] text-[#90f209] text-xs font-bold px-2 py-1 rounded">
                            PADRÃO
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mb-12">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-1">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="w-2 h-2 bg-[#000000] rounded-full" />
                            ))}
                          </div>
                        ))}
                        <span className="text-[#000000] text-xl font-bold ml-2">{card.last4}</span>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="text-[#000000] text-xs uppercase mb-1">TITULAR</div>
                          <div className="text-[#000000] text-lg font-semibold">
                            {card.holderName || "TITULAR"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#000000] text-xs uppercase mb-1">VALIDADE</div>
                          <div className="text-[#000000] text-lg font-semibold">
                            {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center border border-[#262626]">
                <CreditCard className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <p className="text-[#666666]">Nenhum cartão cadastrado</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div>
            <h1 className="text-[#ffffff] text-3xl font-semibold mb-8">Histórico de pagamentos</h1>

            {paymentsLoading ? (
              <div className="text-center py-12">
                <div className="text-[#666666]">Carregando histórico...</div>
              </div>
            ) : payments.length > 0 ? (
              <>
                <div className="space-y-3">
                  {paginatedPayments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="bg-[#1a1a1a] rounded-xl p-6 flex items-center justify-between hover:bg-[#262626] transition-colors border border-[#262626]"
                    >
                      <div className="flex items-center gap-6">
                        {getPaymentStatusIcon(payment.status)}
                        <div>
                          <div className="text-[#ffffff] font-semibold">
                            {payment.description || "Pagamento"}
                          </div>
                          <div className="text-[#666666] text-sm">
                            {new Date(payment.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                            {" • "}
                            {payment.method === "PIX" ? "PIX" : "Cartão de crédito"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#ffffff] text-xl font-semibold">
                          R$ {Number(payment.amount).toFixed(2)}
                        </div>
                        <div className="text-[#666666] text-sm">{getPaymentStatusLabel(payment.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="bg-[#1a1a1a] text-[#ffffff] p-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                            currentPage === page
                              ? "bg-[#90f209] text-[#000000]"
                              : "bg-[#1a1a1a] text-[#ffffff] hover:bg-[#262626]"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="bg-[#1a1a1a] text-[#ffffff] p-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center border border-[#262626]">
                <Calendar className="w-16 h-16 text-[#333333] mx-auto mb-4" />
                <p className="text-[#666666]">Nenhum pagamento realizado ainda</p>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Cancel Modal */}
      {mounted &&
        showCancelModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in">
            <div className="absolute inset-0" onClick={() => setShowCancelModal(false)} />
            <div className="relative bg-[#0f0f0f] rounded-3xl p-8 max-w-md w-full border border-[#1a1a1a] animate-scale-in">
              <h2 className="text-[#ffffff] text-2xl font-semibold mb-4 text-center">
                Cancelar assinatura?
              </h2>
              <p className="text-[#666666] text-center mb-6">
                Você perderá acesso aos recursos premium ao fim do período atual
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-[#1a1a1a] text-[#ffffff] font-semibold py-3 rounded-xl hover:bg-[#262626] transition-colors"
                >
                  Manter
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscription.isPending}
                  className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {cancelSubscription.isPending ? "Cancelando..." : "Cancelar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Payment Dialog */}
      {mounted &&
        showPaymentDialog &&
        createPortal(
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in">
            <div
              className="absolute inset-0"
              onClick={(e) => {
                if (currentStep === "processing") return
                closePaymentDialog()
              }}
            />
            <div className="relative bg-[#0f0f0f] rounded-3xl p-8 max-w-6xl w-full border border-[#1a1a1a] my-8 animate-scale-in">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[#ffffff] text-3xl font-semibold">
                  {currentStep === "plan" && "Escolha seu plano"}
                  {currentStep === "method" && "Método de pagamento"}
                  {currentStep === "card" && "Confirmar pagamento"}
                  {currentStep === "pix" && "Pagamento via PIX"}
                  {currentStep === "processing" && "Processando..."}
                  {currentStep === "success" && "Pagamento realizado!"}
                </h2>
                {currentStep !== "processing" && (
                  <button
                    onClick={closePaymentDialog}
                    className="text-[#666666] hover:text-[#ffffff] transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Step: Select Plan */}
              {currentStep === "plan" && (
                <div className="grid grid-cols-12 gap-6">
                  {plans.map((plan: any) => {
                    const isCurrent = subscription?.planId === plan.id
                    const isFree = plan.name === "FREE"
                    const canUseFree = !freeEligibility?.hasUsedFreePlan
                    const isDisabled = isCurrent || (isFree && !canUseFree)

                    return (
                      <div
                        key={plan.id}
                        onClick={() => !isDisabled && handleSelectPlan(plan)}
                        className={`col-span-12 md:col-span-6 bg-[#1a1a1a] rounded-2xl p-6 border-2 transition-all relative ${
                          isDisabled
                            ? "border-[#262626] opacity-50 cursor-not-allowed"
                            : "border-[#262626] hover:border-[#90f209] hover:scale-105 cursor-pointer"
                        }`}
                      >
                        {isFree && (
                          <div className="absolute -top-3 -right-3">
                            <span className="bg-[#90f209] text-[#000000] text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              GRÁTIS
                            </span>
                          </div>
                        )}

                        <h3 className="text-[#ffffff] text-2xl font-semibold mb-2 text-center">
                          {plan.displayName}
                        </h3>

                        <div className="text-[#90f209] text-4xl font-bold mb-4 text-center">
                          {isFree ? (
                            <>
                              <span className="text-2xl">R$</span> 0,00
                            </>
                          ) : (
                            <>
                              R$ {Number(plan.priceAmount).toFixed(2)}
                              <span className="text-[#666666] text-lg">/mês</span>
                            </>
                          )}
                        </div>

                        <p className="text-[#666666] text-center mb-4">
                          {plan.isUnlimited
                            ? "Páginas ilimitadas"
                            : `${plan.pagesLimitPerMonth} páginas/mês`}
                        </p>

                        {isFree && (
                          <p className="text-[#666666] text-center text-xs mb-4">Válido por 30 dias</p>
                        )}

                        {isCurrent && (
                          <div className="text-center">
                            <span className="bg-[#90f209] text-[#000000] text-xs font-bold px-3 py-1 rounded">
                              PLANO ATUAL
                            </span>
                          </div>
                        )}

                        {isFree && !canUseFree && !isCurrent && (
                          <div className="text-center">
                            <span className="bg-red-500/20 text-red-500 text-xs font-bold px-3 py-1 rounded">
                              JÁ UTILIZADO
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Step: Select Method */}
              {currentStep === "method" && selectedPlan && (
                <div className="space-y-6">
                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#262626]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[#666666] text-sm mb-1">Plano selecionado</div>
                        <div className="text-[#ffffff] text-2xl font-semibold">
                          {selectedPlan.displayName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#666666] text-sm mb-1">Valor</div>
                        <div className="text-[#90f209] text-2xl font-bold">
                          R$ {Number(selectedPlan.priceAmount).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => handleSelectMethod("card")}
                      disabled={cards.length === 0}
                      className="bg-[#1a1a1a] rounded-2xl p-8 border-2 border-[#262626] hover:border-[#90f209] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <CreditCard className="w-12 h-12 text-[#90f209] mx-auto mb-4" />
                      <h3 className="text-[#ffffff] text-xl font-semibold mb-2 text-center">
                        Cartão de Crédito
                      </h3>
                      <p className="text-[#666666] text-center">
                        {cards.length > 0
                          ? `${cards.length} cartão${cards.length > 1 ? "ões" : ""} cadastrado${cards.length > 1 ? "s" : ""}`
                          : "Nenhum cartão cadastrado"}
                      </p>
                    </button>

                    <button
                      onClick={() => handleSelectMethod("pix")}
                      className="bg-[#1a1a1a] rounded-2xl p-8 border-2 border-[#262626] hover:border-[#90f209] transition-all hover:scale-105"
                    >
                      <QrCode className="w-12 h-12 text-[#90f209] mx-auto mb-4" />
                      <h3 className="text-[#ffffff] text-xl font-semibold mb-2 text-center">PIX</h3>
                      <p className="text-[#666666] text-center">Pagamento instantâneo</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Confirm Card Payment */}
              {currentStep === "card" && selectedCard && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#90f209] to-[#7acc00] rounded-2xl p-8 relative overflow-hidden max-w-md mx-auto">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                      <div className="text-[#000000] text-xl font-semibold mb-12">Figtor</div>
                      <div className="flex gap-4 mb-12">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-1">
                            {[1, 2, 3, 4].map((j) => (
                              <div key={j} className="w-2 h-2 bg-[#000000] rounded-full" />
                            ))}
                          </div>
                        ))}
                        <span className="text-[#000000] text-xl font-bold ml-2">{selectedCard.last4}</span>
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="text-[#000000] text-xs uppercase mb-1">TITULAR</div>
                          <div className="text-[#000000] text-lg font-semibold">
                            {selectedCard.holderName}
                          </div>
                        </div>
                        <div>
                          <div className="text-[#000000] text-xs uppercase mb-1">VALOR</div>
                          <div className="text-[#000000] text-lg font-semibold">
                            R$ {Number(selectedPlan.priceAmount).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmCardPayment}
                    className="w-full bg-[#90f209] text-[#000000] font-bold py-4 rounded-xl hover:bg-[#a0ff20] transition-colors text-lg"
                  >
                    Confirmar Pagamento
                  </button>
                </div>
              )}

              {/* Step: PIX Payment */}
              {currentStep === "pix" && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#262626] text-center">
                    <img src={pixQrCode} alt="QR Code PIX" className="w-64 h-64 mx-auto mb-4 rounded-xl" />
                    <p className="text-[#666666] text-sm mb-4">
                      Escaneie o QR Code ou copie o código abaixo
                    </p>
                    <div className="bg-[#0a0a0a] rounded-lg p-4 mb-4">
                      <p className="text-[#ffffff] text-xs font-mono break-all">{pixCode}</p>
                    </div>
                    <button
                      onClick={copyPixCode}
                      className="w-full bg-[#90f209] text-[#000000] font-semibold py-3 rounded-lg hover:bg-[#a0ff20] transition-colors flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar Código PIX
                    </button>
                  </div>

                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#262626]">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[#666666] text-sm mb-1">Valor</div>
                        <div className="text-[#ffffff] text-2xl font-semibold">
                          R$ {Number(selectedPlan.priceAmount).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#666666] text-sm mb-1">Expira em</div>
                        <div className="text-[#ffffff] text-lg">30 minutos</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Processing */}
              {currentStep === "processing" && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-[#90f209] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#ffffff] text-xl">Processando pagamento...</p>
                </div>
              )}

              {/* Step: Success */}
              {currentStep === "success" && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-[#ffffff] text-2xl font-semibold mb-2">Pagamento aprovado!</h3>
                  <p className="text-[#666666]">Seu plano foi ativado com sucesso</p>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
