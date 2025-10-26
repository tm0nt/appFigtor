"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Smartphone, Monitor, Tablet, LogOut, Shield, Clock, MapPin } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Session {
  id: string
  deviceId: string
  platform: string
  userAgent: string
  ipAddress: string
  lastActivity: string
  createdAt: string
  expires: string
  isCurrent: boolean
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revoking, setRevoking] = useState<string | null>(null)

  const loadSessions = async () => {
    try {
      const response = await fetch("/api/auth/sessions")
      const data = await response.json()
      
      if (response.ok) {
        setSessions(data.sessions || [])
      } else {
        toast.error(data.error || "Erro ao carregar sessões")
      }
    } catch (error) {
      toast.error("Erro ao carregar sessões")
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId)
    try {
      const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Sessão encerrada com sucesso")
        loadSessions() // Recarregar lista
      } else {
        toast.error(data.error || "Erro ao encerrar sessão")
      }
    } catch (error) {
      toast.error("Erro ao encerrar sessão")
    } finally {
      setRevoking(null)
    }
  }

  const revokeAllOtherSessions = async () => {
    setRevoking("all")
    try {
      const response = await fetch("/api/auth/sessions?action=all", {
        method: "DELETE"
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success("Todas as outras sessões foram encerradas")
        loadSessions() // Recarregar lista
      } else {
        toast.error(data.error || "Erro ao encerrar sessões")
      }
    } catch (error) {
      toast.error("Erro ao encerrar sessões")
    } finally {
      setRevoking(null)
    }
  }

  const getDeviceIcon = (platform: string, userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone className="h-5 w-5" />
    }
    if (ua.includes("tablet") || ua.includes("ipad")) {
      return <Tablet className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  const getDeviceName = (platform: string, userAgent: string) => {
    const ua = userAgent.toLowerCase()
    if (ua.includes("chrome")) return "Chrome"
    if (ua.includes("firefox")) return "Firefox"
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari"
    if (ua.includes("edge")) return "Edge"
    return platform || "Desconhecido"
  }

  const getPlatformName = (platform: string) => {
    if (platform?.includes("Windows")) return "Windows"
    if (platform?.includes("Mac")) return "macOS"
    if (platform?.includes("Linux")) return "Linux"
    if (platform?.includes("Android")) return "Android"
    if (platform?.includes("iOS")) return "iOS"
    return platform || "Desconhecido"
  }

  useEffect(() => {
    loadSessions()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando sessões...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Sessões Ativas</h1>
        <p className="text-muted-foreground">
          Gerencie as sessões ativas da sua conta em diferentes dispositivos.
        </p>
      </div>

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança da Conta
            </CardTitle>
            <CardDescription>
              Você tem {sessions.length} sessão(s) ativa(s). Encerre sessões que não reconheça.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  disabled={sessions.length <= 1 || revoking === "all"}
                >
                  {revoking === "all" ? "Encerrando..." : "Encerrar Todas as Outras Sessões"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Encerrar todas as outras sessões?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá desconectar todos os outros dispositivos. Você precisará fazer login novamente nesses dispositivos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={revokeAllOtherSessions}>
                    Encerrar Sessões
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className={session.isCurrent ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.platform, session.userAgent)}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getDeviceName(session.platform, session.userAgent)}
                      {session.isCurrent && (
                        <Badge variant="secondary">Sessão Atual</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {getPlatformName(session.platform)}
                    </CardDescription>
                  </div>
                </div>
                
                {!session.isCurrent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={revoking === session.id}
                      >
                        {revoking === session.id ? (
                          "Encerrando..."
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Encerrar
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Encerrar esta sessão?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O dispositivo será desconectado imediatamente e precisará fazer login novamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revokeSession(session.id)}>
                          Encerrar Sessão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>IP: {session.ipAddress}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Última atividade: {" "}
                    {formatDistanceToNow(new Date(session.lastActivity), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Criada: {" "}
                    {formatDistanceToNow(new Date(session.createdAt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma sessão ativa encontrada.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}