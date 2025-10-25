// components/dashboard-layout.tsx
"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Search,
  CreditCard,
  LinkIcon,
  LogOut,
  User,
  MessageSquare,
  Bell,
  Menu,
  X,
  Trash2,
  CheckCheck,
} from "lucide-react"
import Image from "next/image"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { useUserProfile } from "@/hooks/use-user-profile"
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "@/hooks/use-notifications"
import { useCreateFeedback } from "@/hooks/use-feedbacks"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: userData } = useUserProfile()
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const deleteNotification = useDeleteNotification()
  const createFeedback = useCreateFeedback()

  const [showFeedback, setShowFeedback] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [feedbackType, setFeedbackType] = useState<"BUG" | "FEATURE" | "RATING" | "OTHER">("OTHER")

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const handleLogout = async () => {
    const t = toast.loading("Saindo...")
    try {
      await signOut({ redirect: true, callbackUrl: "/" })
      toast.success("Sessão encerrada", { id: t })
    } catch {
      toast.error("Não foi possível encerrar a sessão", { id: t })
    }
  }

  const getDisplayName = () => {
    if (!userData?.user?.name) return "Usuário"
    const nameParts = userData.user.name.trim().split(" ").filter(Boolean)
    if (nameParts.length === 0) return "Usuário"
    if (nameParts.length === 1) return nameParts[0]
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
  }

  const handleMarkAsRead = async (id: string, currentlyRead: boolean) => {
    try {
      await markRead.mutateAsync({ id, read: !currentlyRead })
    } catch (error) {
      toast.error("Erro ao atualizar notificação")
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead.mutateAsync()
      toast.success("Todas as notificações foram marcadas como lidas")
    } catch (error) {
      toast.error("Erro ao marcar todas como lidas")
    }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id)
      toast.success("Notificação removida")
    } catch (error) {
      toast.error("Erro ao remover notificação")
    }
  }

  const handleSubmitFeedback = async () => {
    if (!rating) {
      toast.error("Por favor, selecione uma avaliação")
      return
    }

    const t = toast.loading("Enviando feedback...")

    try {
      await createFeedback.mutateAsync({
        rating,
        message: feedbackMessage,
        type: feedbackType,
      })
      toast.success("Feedback enviado com sucesso! Obrigado!", { id: t })
      setShowFeedback(false)
      setRating(0)
      setFeedbackMessage("")
      setFeedbackType("OTHER")
    } catch (error) {
      toast.error("Erro ao enviar feedback", { id: t })
    }
  }

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/history", icon: Search, label: "Histórico" },
    { href: "/payments", icon: CreditCard, label: "Pagamentos" },
    { href: "/devices", icon: LinkIcon, label: "Aparelhos Conectados" },
  ]

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "BILLING":
        return "bg-green-500"
      case "ALERT":
        return "bg-red-500"
      case "USAGE":
        return "bg-yellow-500"
      case "MARKETING":
        return "bg-blue-500"
      case "SYSTEM":
      default:
        return "bg-[#90f209]"
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] flex">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#90f209] rounded-xl flex items-center justify-center shadow-lg hover:bg-[#a0ff20] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {mobileMenuOpen ? <X className="w-6 h-6 text-[#000000]" /> : <Menu className="w-6 h-6 text-[#000000]" />}
      </button>

      <aside
        className={`${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-[#1a1a1a] transition-all duration-300 flex flex-col shadow-2xl`}
      >
        <div className="p-6 border-b border-[#1a1a1a]">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="Figtor" width={160} height={40} priority className="h-10 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group animate-slide-in-left ${
                  isActive
                    ? "bg-[#90f209] text-[#000000] shadow-lg shadow-[#90f209]/20"
                    : "text-[#999999] hover:bg-[#1a1a1a] hover:text-[#ffffff] hover:translate-x-1"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "" : "group-hover:scale-110"}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#1a1a1a]">
          <button
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl text-[#999999] hover:bg-[#1a1a1a] hover:text-[#ff4444] transition-all duration-300 group hover:translate-x-1"
          >
            <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-6 lg:px-12 py-5 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            {/* Escondido em mobile, visível em desktop */}
            <h2 className="text-[#ffffff] text-xl lg:text-2xl font-light hidden lg:block">
              Olá, <span className="font-semibold text-[#90f209]">{getDisplayName()}</span>
            </h2>

            {/* Em mobile, mantém espaço vazio ou logo pequena */}
            <div className="lg:hidden w-8"></div>

            <div className="flex items-center gap-3">
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-[#ffffff] hover:bg-[#262626] transition-all duration-300 border border-[#262626] hover:border-[#333333] hover:scale-105 active:scale-95"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Minha Conta</span>
              </Link>

              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-[#ffffff] hover:bg-[#262626] transition-all duration-300 border border-[#262626] hover:border-[#333333] hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Feedback</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-11 h-11 rounded-full bg-[#90f209] flex items-center justify-center hover:bg-[#a0ff20] transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-[0_0_20px_rgba(144,242,9,0.4)]"
                >
                  <Bell className="w-5 h-5 text-[#000000]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4444] rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <div className="absolute right-0 top-14 w-96 max-w-[calc(100vw-2rem)] bg-[#0f0f0f] backdrop-blur-xl rounded-2xl shadow-2xl border border-[#1a1a1a] z-50 animate-scale-in max-h-[600px] flex flex-col">
                      <div className="p-5 border-b border-[#1a1a1a] flex items-center justify-between">
                        <h3 className="text-[#ffffff] font-semibold">Notificações</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[#90f209] text-xs hover:text-[#a0ff20] flex items-center gap-1 transition-colors"
                          >
                            <CheckCheck className="w-3 h-3" />
                            Marcar todas como lidas
                          </button>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-12">
                            <Bell className="w-12 h-12 text-[#333333] mx-auto mb-3" />
                            <p className="text-[#666666] text-sm">Nenhuma notificação</p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 p-3 rounded-xl transition-colors duration-200 cursor-pointer group ${
                                notif.readAt ? "hover:bg-[#1a1a1a]" : "bg-[#1a1a1a] hover:bg-[#262626]"
                              }`}
                              onClick={() => handleMarkAsRead(notif.id, !!notif.readAt)}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  notif.readAt
                                    ? "border border-[#666666]"
                                    : `${getNotificationTypeColor(notif.type)} animate-pulse`
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${notif.readAt ? "text-[#999999]" : "text-[#ffffff]"}`}>
                                  {notif.title}
                                </p>
                                <p className={`text-xs mt-0.5 ${notif.readAt ? "text-[#666666]" : "text-[#999999]"}`}>
                                  {notif.body}
                                </p>
                                <p className="text-[#666666] text-xs mt-1">
                                  {formatDistanceToNow(new Date(notif.createdAt), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteNotification(notif.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#262626] rounded"
                              >
                                <Trash2 className="w-3 h-3 text-[#ff4444]" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 animate-fade-in-up">{children}</main>
      </div>

      {showFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-[#0f0f0f] rounded-3xl p-8 max-w-lg w-full border border-[#1a1a1a] shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-[#90f209] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#90f209]/30">
                <MessageSquare className="w-8 h-8 text-[#000000]" />
              </div>
              <h2 className="text-[#ffffff] text-3xl font-semibold mb-2">Faça sua avaliação</h2>
              <p className="text-[#666666] text-sm text-center">Sua opinião é muito importante para nós</p>

              <div className="flex gap-2 mt-6 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl transition-all duration-200 hover:scale-125 active:scale-95"
                  >
                    <span
                      className={`${
                        star <= (hoverRating || rating) ? "text-[#90f209] drop-shadow-[0_0_8px_rgba(144,242,9,0.5)]" : "text-[#333333]"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>

              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as any)}
                className="w-full bg-[#0a0a0a] text-[#ffffff] rounded-xl border-2 border-[#1a1a1a] p-3 outline-none mb-4 focus:border-[#90f209] transition-colors"
              >
                <option value="OTHER">Geral</option>
                <option value="BUG">Reportar Bug</option>
                <option value="FEATURE">Sugerir Funcionalidade</option>
                <option value="RATING">Avaliação</option>
              </select>
            </div>

            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              placeholder="Escreva um elogio, sugestão ou melhoria aqui..."
              className="w-full bg-[#0a0a0a] text-[#ffffff] placeholder:text-[#666666] rounded-2xl border-2 border-[#1a1a1a] p-4 h-32 outline-none transition-all duration-300 focus:border-[#90f209] focus:shadow-[0_0_20px_rgba(144,242,9,0.1)] mb-6 resize-none"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedback(false)
                  setRating(0)
                  setFeedbackMessage("")
                  setFeedbackType("OTHER")
                }}
                className="flex-1 bg-[#1a1a1a] text-[#ffffff] font-semibold py-3.5 rounded-xl hover:bg-[#262626] transition-all duration-300 border border-[#262626] hover:border-[#333333] hover:scale-105 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitFeedback}
                disabled={createFeedback.isPending || !rating}
                className="flex-1 bg-[#90f209] text-[#000000] font-bold py-3.5 rounded-xl hover:bg-[#a0ff20] transition-all duration-300 hover:shadow-[0_0_30px_rgba(144,242,9,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createFeedback.isPending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
