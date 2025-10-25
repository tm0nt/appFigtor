// hooks/use-conversions.ts
import { useQuery } from "@tanstack/react-query"

export function useConversions(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["conversions", page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/conversions?page=${page}&limit=${limit}`)
      if (!res.ok) throw new Error("Falha ao carregar conversões")
      return res.json()
    },
  })
}
