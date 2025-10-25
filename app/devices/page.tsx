// app/(dashboard)/devices/page.tsx
"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Laptop, Smartphone, Monitor, Trash2, AlertCircle } from "lucide-react"
import { useDevices, useRemoveDevice, useRegisterCurrentDevice } from "@/hooks/use-devices"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UAParser } from "ua-parser-js"

export default function DevicesPage() {
  const { data: devices = [], isLoading } = useDevices()
  const removeDevice = useRemoveDevice()
  const registerDevice = useRegisterCurrentDevice()

  // Registrar dispositivo atual ao carregar a página
  useEffect(() => {
    registerDevice.mutate()
  }, [])

  const handleRemoveDevice = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Deseja realmente desconectar o dispositivo "${deviceName}"?`)) return

    const t = toast.loading("Removendo dispositivo...")
    try {
      await removeDevice.mutateAsync(deviceId)
      toast.success("Dispositivo desconectado com sucesso", { id: t })
    } catch (error) {
      toast.error("Erro ao remover dispositivo", { id: t })
    }
  }

  const getDeviceIcon = (platform: string) => {
    switch (platform) {
      case "MOBILE_IOS":
      case "MOBILE_ANDROID":
        return <Smartphone className="w-12 h-12" />
      case "DESKTOP_MAC":
      case "DESKTOP_WINDOWS":
      case "DESKTOP_LINUX":
        return <Laptop className="w-12 h-12" />
      default:
        return <Monitor className="w-12 h-12" />
    }
  }

  const getDeviceName = (device: any) => {
    if (!device.userAgent) return "Dispositivo desconhecido"

    const parser = new UAParser(device.userAgent)
    const result = parser.getResult()

    const browser = result.browser.name || "Navegador"
    const os = result.os.name || "Sistema"
    const deviceType = result.device.type || "desktop"

    if (deviceType === "mobile") {
      return `${result.device.vendor || "Celular"} ${result.device.model || ""} - ${os}`
    }

    return `${browser} em ${os}`
  }

  const getCurrentDeviceId = () => {
    if (typeof window === "undefined") return null
    const parser = new UAParser()
    const result = parser.getResult()
    
    // Criar hash simples baseado no user agent
    const userAgent = navigator.userAgent
    let hash = 0
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).substring(0, 32)
  }

  const currentDeviceId = getCurrentDeviceId()

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-[#666666]">Carregando dispositivos...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-[#ffffff] text-3xl font-semibold mb-4">Gerenciar acesso e aparelhos</h1>
        <p className="text-[#999999] mb-2">
          Estes aparelhos conectados estiveram ativos recentemente nesta conta.{" "}
          <span className="text-[#999999]">
            Para maior segurança, você pode encerrar a sessão em qualquer aparelho desconectado ou{" "}
          </span>
          <button className="text-[#90f209] hover:underline">alterar sua senha</button>.
        </p>

        {devices.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center mt-8">
            <Monitor className="w-16 h-16 text-[#333333] mx-auto mb-4" />
            <p className="text-[#666666]">Nenhum dispositivo conectado</p>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            {devices.map((device, index) => {
              const isCurrentDevice = index === 0 // Primeiro dispositivo é sempre o atual
              const deviceName = getDeviceName(device)

              return (
                <div
                  key={device.id}
                  className={`${
                    isCurrentDevice ? "bg-white border-2 border-[#90f209]" : "bg-[#1a1a1a]"
                  } rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-6">
                      <div className={`${isCurrentDevice ? "text-[#000000]" : "text-[#ffffff]"}`}>
                        {getDeviceIcon(device.platform)}
                      </div>
                      <div>
                        {isCurrentDevice && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="bg-[#90f209] text-[#000000] text-xs font-bold px-2 py-1 rounded">
                              DISPOSITIVO ATUAL
                            </div>
                          </div>
                        )}
                        <div
                          className={`${
                            isCurrentDevice ? "text-[#000000]" : "text-[#ffffff]"
                          } text-xl font-semibold mb-1`}
                        >
                          {deviceName}
                        </div>
                        <div className="text-[#666666] text-sm">
                          {device.ip && <span>IP: {device.ip}</span>}
                          {device.lastSeenAt && (
                            <>
                              {" • "}
                              Visto{" "}
                              {formatDistanceToNow(new Date(device.lastSeenAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-[#666666] text-xs uppercase mb-1">CONECTADO EM</div>
                        <div className={`${isCurrentDevice ? "text-[#000000]" : "text-[#ffffff]"} text-lg`}>
                          {new Date(device.createdAt).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      {!isCurrentDevice && (
                        <button
                          onClick={() => handleRemoveDevice(device.id, deviceName)}
                          disabled={removeDevice.isPending}
                          className="bg-[#8B0000] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#a00000] transition-all duration-300 flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                        >
                          <Trash2 className="w-4 h-4" />
                          Desconectar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-8 bg-[#1a1a1a] rounded-2xl p-6 border border-[#333333]">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-[#90f209] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-[#ffffff] font-semibold mb-2">Dicas de segurança</h3>
              <ul className="text-[#999999] text-sm space-y-2">
                <li>• Desconecte dispositivos que você não reconhece imediatamente</li>
                <li>• Altere sua senha regularmente para manter sua conta segura</li>
                <li>• Use autenticação de dois fatores quando disponível</li>
                <li>• Evite fazer login em computadores públicos ou compartilhados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
