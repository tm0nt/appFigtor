// app/(dashboard)/history/page.tsx
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
} from "lucide-react"
import { useConversions } from "@/hooks/use-conversions"
import { toast } from "sonner"

export default function HistoryPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const itemsPerPage = 10

  const { data, isLoading } = useConversions(currentPage, itemsPerPage)
  const conversions = data?.conversions || []
  const totalPages = data?.totalPages || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "PROCESSING":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-[#666666]" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      COMPLETED: "Concluído",
      FAILED: "Falhou",
      PROCESSING: "Processando",
      PENDING: "Pendente",
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-500"
      case "FAILED":
        return "text-red-500"
      case "PROCESSING":
        return "text-blue-500"
      case "PENDING":
        return "text-yellow-500"
      default:
        return "text-[#666666]"
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const handleDownloadCSV = () => {
    const csv = [
      ["ID", "URL Figma", "Formato", "Status", "Páginas", "Tamanho", "Data"],
      ...conversions.map((c: any) => [
        c.id,
        c.figmaUrl,
        c.outputFormat,
        getStatusLabel(c.status),
        c.pagesConverted,
        formatFileSize(c.fileSize),
        new Date(c.createdAt).toLocaleString("pt-BR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversoes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast.success("CSV baixado com sucesso!")
  }

  const handleDownloadJSON = () => {
    const json = JSON.stringify(conversions, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `conversoes-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    toast.success("JSON baixado com sucesso!")
  }

  const handleDownloadFile = (downloadUrl: string, fileName: string) => {
    const a = document.createElement("a")
    a.href = downloadUrl
    a.download = fileName
    a.click()
    toast.success("Download iniciado!")
  }

  const filteredConversions = conversions.filter((c: any) =>
    c.figmaUrl.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[#ffffff] text-3xl font-semibold">Histórico de Conversões</h1>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadCSV}
              disabled={conversions.length === 0}
              className="bg-[#1a1a1a] text-[#ffffff] font-semibold px-6 py-3 rounded-lg hover:bg-[#262626] transition-colors flex items-center gap-2 border border-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              disabled={conversions.length === 0}
              className="bg-[#1a1a1a] text-[#ffffff] font-semibold px-6 py-3 rounded-lg hover:bg-[#262626] transition-colors flex items-center gap-2 border border-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
            <input
              type="text"
              placeholder="Buscar por URL do Figma..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] text-[#ffffff] pl-12 pr-4 py-3 rounded-lg border border-[#262626] focus:border-[#90f209] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#90f209] animate-spin" />
          </div>
        ) : conversions.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-2xl p-12 text-center border border-[#262626]">
            <Calendar className="w-16 h-16 text-[#333333] mx-auto mb-4" />
            <p className="text-[#666666] text-lg">Nenhuma conversão realizada ainda.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#262626] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-[#262626]">
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        URL Figma
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Formato
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Páginas
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Tamanho
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Data
                      </th>
                      <th className="text-left px-6 py-4 text-[#666666] text-sm font-semibold uppercase">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConversions.map((conversion: any, index: number) => (
                      <tr
                        key={conversion.id}
                        className={`border-b border-[#262626] hover:bg-[#262626] transition-colors ${
                          index % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#0f0f0f]"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(conversion.status)}
                            <span className={`text-sm font-medium ${getStatusColor(conversion.status)}`}>
                              {getStatusLabel(conversion.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={conversion.figmaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#90f209] hover:underline text-sm truncate block max-w-xs"
                          >
                            {conversion.figmaUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#ffffff] text-sm">{conversion.outputFormat}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#ffffff] text-sm">{conversion.pagesConverted}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#666666] text-sm">
                            {formatFileSize(conversion.fileSize)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[#ffffff] text-sm">
                            {new Date(conversion.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                          <div className="text-[#666666] text-xs">
                            {new Date(conversion.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {conversion.status === "COMPLETED" && conversion.downloadUrl ? (
                            <button
                              onClick={() =>
                                handleDownloadFile(
                                  conversion.downloadUrl,
                                  `conversion-${conversion.id}.${conversion.outputFormat}`
                                )
                              }
                              className="bg-[#90f209] text-[#000000] font-semibold px-4 py-2 rounded-lg hover:bg-[#a0ff20] transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
                            >
                              <Download className="w-4 h-4" />
                              Baixar
                            </button>
                          ) : (
                            <span className="text-[#666666] text-sm">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-[#666666] text-sm">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(currentPage * itemsPerPage, data?.total || 0)} de {data?.total || 0} conversões
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-[#1a1a1a] text-[#ffffff] p-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                            currentPage === pageNum
                              ? "bg-[#90f209] text-[#000000]"
                              : "bg-[#1a1a1a] text-[#ffffff] hover:bg-[#262626]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-[#1a1a1a] text-[#ffffff] p-2 rounded-lg hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
