"use client"

import { RefreshCw, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  onRefresh: () => void
}

export default function Header({ onRefresh }: HeaderProps) {
  return (
    <header className="bg-black p-4 border-b border-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">CUBE</h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 border border-green-500/30 rounded-full px-3 py-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Server Online</span>
          </div>

          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            REFRESH
          </Button>
        </div>
      </div>
    </header>
  )
}

