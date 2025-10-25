// app/(dashboard)/dashboard/page.tsx
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Download, ChevronDown, TrendingUp, Activity, AlertCircle } from "lucide-react"
import { useConvert } from "@/hooks/use-convert"
import { useStats } from "@/hooks/use-stats"
import { useSubscription } from "@/hooks/use-subscription"
import { extractFigmaData } from "@/lib/figma-utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [figmaUrl, setFigmaUrl] = useState("")
  const [progress, setProgress] = useState(0)
  const [isConverting, setIsConverting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [activePeriod, setActivePeriod] = useState("7D")

  const convertMutation = useConvert()
  const { data: stats = [] } = useStats(activePeriod)
  const { data: subscription } = useSubscription()

  // Simular progresso durante conversão
  useEffect(() => {
    if (isConverting && progress < 95) {
      const timer = setInterval(() => {
        setProgress((prev) => Math.min(prev + Math.random() * 15, 95))
      }, 500)
      return () => clearInterval(timer)
    }
  }, [isConverting, progress])

  const handleConvert = async () => {
    if (!figmaUrl.trim()) {
      toast.error("Por favor, insira a URL do Figma")
      return
    }

    const figmaData = extractFigmaData(figmaUrl)
    if (!figmaData) {
      toast.error("URL do Figma inválida. Use o formato: https://www.figma.com/design/...")
      return
    }

    // Verificar se tem assinatura
    if (!subscription) {
      toast.error("Você precisa de uma assinatura para converter")
      router.push("/payments")
      return
    }

    setIsConverting(true)
    setProgress(10)
    setDownloadUrl(null)

    const t = toast.loading("Convertendo design...")

    try {
      const result = await convertMutation.mutateAsync(figmaData)
      
      setProgress(100)
      setDownloadUrl(result.downloadUrl)
      toast.success("Conversão concluída!", { id: t })
    } catch (error: any) {
      setProgress(0)
      
      if (error.message.includes("Limite de conversões atingido")) {
        toast.error("Limite atingido! Faça upgrade do seu plano.", { id: t })
        setTimeout(() => router.push("/payments"), 2000)
      } else if (error.message.includes("assinatura ativa")) {
        toast.error("Você precisa de uma assinatura ativa", { id: t })
        setTimeout(() => router.push("/payments"), 2000)
      } else {
        toast.error(error.message || "Erro ao converter", { id: t })
      }
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
      toast.success("Download iniciado!")
    }
  }

  const getUsageInfo = () => {
    if (!subscription) return { used: 0, limit: 0, percentage: 0 }
    
    // Aqui você pode fazer uma query para pegar o uso real
    // Por enquanto vou simular
    const used = 5
    const limit = subscription.isUnlimited ? Infinity : subscription.pagesLimitPerMonth
    const percentage = subscription.isUnlimited ? 0 : (used / limit) * 100
    
    return { used, limit, percentage }
  }

  const usage = getUsageInfo()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Aviso de limite */}
        {subscription && !subscription.isUnlimited && usage.percentage > 80 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3 animate-slide-in-left">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-500 text-sm font-medium">
                Atenção! Você usou {usage.used} de {usage.limit} conversões este mês ({Math.round(usage.percentage)}%)
              </p>
            </div>
            <button
              onClick={() => router.push("/payments")}
              className="bg-yellow-500 text-[#000000] font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors text-sm"
            >
              Fazer Upgrade
            </button>
          </div>
        )}

        <div className="flex items-center gap-4 animate-slide-in-left">
          <div className="flex-1 relative group">
            <input
              type="text"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConvert()}
              placeholder="Coloque o link da página no figma aqui:"
              disabled={isConverting}
              className="w-full bg-[#0f0f0f] text-[#ffffff] placeholder:text-[#666666] rounded-xl border-2 border-[#1a1a1a] px-6 py-4 pr-12 outline-none transition-all duration-300 focus:border-[#90f209] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)] disabled:opacity-50"
            />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666] transition-transform duration-300 group-focus-within:text-[#90f209] group-focus-within:rotate-180" />
          </div>
          <button
            onClick={handleConvert}
            disabled={isConverting || !figmaUrl.trim()}
            className="bg-[#90f209] text-[#000000] font-bold px-8 py-4 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 whitespace-nowrap hover:shadow-[0_0_30px_rgba(144,242,9,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isConverting ? "Convertendo..." : "Implementar!"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 min-h-[500px] flex items-center justify-center animate-slide-in-left hover:border-[#262626] transition-all duration-300">
            {downloadUrl ? (
              <div className="text-center">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Download className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-[#ffffff] text-2xl font-semibold mb-4">Conversão Concluída!</h3>
                <p className="text-[#666666] mb-6">Seu arquivo JSON está pronto para download</p>
                <button
                  onClick={handleDownload}
                  className="bg-[#90f209] text-[#000000] font-bold px-8 py-4 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 flex items-center gap-3 mx-auto shadow-2xl hover:shadow-[0_0_40px_rgba(144,242,9,0.4)] hover:scale-105 active:scale-95"
                >
                  BAIXAR .JSON AGORA!
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <Download className="w-5 h-5 text-[#000000]" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 bg-[#1a1a1a] rounded-2xl text-sm font-medium mb-4 mx-auto flex items-center justify-center text-[#666666] border border-[#262626]">
                  Preview
                </div>
                <p className="text-[#666666] text-sm">
                  {isConverting ? "Convertendo..." : "Cole o link do Figma para converter"}
                </p>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="space-y-6 animate-slide-in-right">
            {isConverting && (
              <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#262626] transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#ffffff] font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#90f209]" />
                    Progresso da Conversão
                  </h3>
                  <div className="flex items-center gap-2 text-[#90f209]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="bg-[#1a1a1a] rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#90f209] to-[#a0ff20] h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(144,242,9,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[#666666] text-sm">Processando design...</span>
                    <span className="text-[#ffffff] text-2xl font-bold">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl p-6 hover:border-[#262626] transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#ffffff] text-xl font-semibold">Conversões</h2>
                <div className="flex gap-2">
                  {["1D", "7D", "30D"].map((period) => (
                    <button
                      key={period}
                      onClick={() => setActivePeriod(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        activePeriod === period
                          ? "bg-[#90f209] text-[#000000] shadow-lg"
                          : "bg-[#1a1a1a] text-[#666666] hover:bg-[#262626] hover:text-[#ffffff]"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 flex items-end justify-between gap-3">
                {stats.length > 0 ? (
                  stats.map((stat: any, i: number) => {
                    const maxCount = Math.max(...stats.map((s: any) => s.count))
                    const height = (stat.count / maxCount) * 100
                    const isHighDemand = stat.count > maxCount * 0.7

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80 relative cursor-pointer"
                          style={{
                            height: `${height}%`,
                            backgroundColor: isHighDemand ? "#90f209" : "#666666",
                          }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] px-2 py-1 rounded text-xs text-[#ffffff] opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {stat.count}
                          </div>
                        </div>
                        <span className="text-[#666666] text-xs font-medium">
                          {new Date(stat.date).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center w-full text-[#666666] text-sm">
                    Nenhuma conversão no período
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-[#1a1a1a]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#90f209] shadow-[0_0_8px_rgba(144,242,9,0.5)]" />
                  <span className="text-[#ffffff] text-sm font-medium">Alta demanda</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#666666]" />
                  <span className="text-[#ffffff] text-sm font-medium">Baixa demanda</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
