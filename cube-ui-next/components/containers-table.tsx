"use client"

import { useState } from "react"
import { RefreshCw, Info, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Container } from "@/lib/types"
import { deleteContainer } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ContainersTableProps {
  containers: Container[]
  onContainerAction: () => void
}

export default function ContainersTable({ containers, onContainerAction }: ContainersTableProps) {
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null)
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const handleDeleteContainer = async (id: string) => {
    try {
      await deleteContainer(id)
      onContainerAction()
    } catch (error) {
      console.error("Error deleting container:", error)
    }
  }

  const getStatusClass = (status: string) => {
    if (status.includes("Up")) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (status.includes("Exited")) return "bg-red-500/20 text-red-400 border-red-500/30"
    return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
  }

  const formatStatus = (status: string) => {
    if (status.includes("Up")) {
      const match = status.match(/Up (\d+) (\w+)/)
      if (match) {
        return `Up ${match[1]} ${match[2]}`
      }
    }
    if (status.includes("Exited")) {
      const match = status.match(/Exited $$(\d+)$$/)
      if (match) {
        return `Exited (${match[1]})`
      }
    }
    return status
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">All Containers</h2>

        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={onContainerAction}>
          <RefreshCw className="h-4 w-4" />
          REFRESH
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-800">
              <th className="pb-2 font-medium">Session ID</th>
              <th className="pb-2 font-medium">Container ID</th>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Image</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Managed</th>
              <th className="pb-2 font-medium">Created</th>
              <th className="pb-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {containers?.map((container) => (
              <tr key={container.id} className="border-b border-gray-800">
                <td className="py-4">{container.session_id || "-"}</td>
                <td className="py-4">{container.id.substring(0, 12)}</td>
                <td className="py-4">{container.name}</td>
                <td className="py-4">{container.image}</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusClass(container.status)}`}>
                    {formatStatus(container.status)}
                  </span>
                </td>
                <td className="py-4">{container.is_managed ? "Yes" : "No"}</td>
                <td className="py-4">{new Date(container.created_at).toLocaleString()}</td>
                <td className="py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedContainer(container)
                        setIsInfoOpen(true)
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete container?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the container
                            {container.name && ` "${container.name}"`}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteContainer(container.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}

            {containers?.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  No containers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedContainer && (
        <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Container Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Container ID</h3>
                <p>{selectedContainer.id}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Name</h3>
                <p>{selectedContainer.name}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Image</h3>
                <p>{selectedContainer.image}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Command</h3>
                <p>{selectedContainer.command || "N/A"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Status</h3>
                <p>{selectedContainer.status}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Created</h3>
                <p>{new Date(selectedContainer.created_at).toLocaleString()}</p>
              </div>

              {selectedContainer.ports && selectedContainer.ports.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Ports</h3>
                  <ul className="space-y-2 mt-2">
                    {selectedContainer.ports.map((port, index) => (
                      <li key={index} className="text-sm">
                        {port.host_port}:{port.container_port}/{port.protocol}
                        {port.description && ` (${port.description})`}
                        {port.url && (
                          <a
                            href={port.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-400 hover:underline"
                          >
                            Open
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

