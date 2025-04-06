"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createSession, deleteAllSessions, fetchImages } from "@/lib/api"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Image } from "@/lib/types"

interface ContainerSessionsProps {
  onSessionsChange: () => void
}

export default function ContainerSessions({ onSessionsChange }: ContainerSessionsProps) {
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false)
  const [imageName, setImageName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [availableImages, setAvailableImages] = useState<Image[]>([])
  const [isLoadingImages, setIsLoadingImages] = useState(false)

  const fetchAvailableImages = async () => {
    try {
      setIsLoadingImages(true)
      const response = await fetchImages()
      setAvailableImages(response.images)
    } catch (error) {
      console.error("Error fetching images:", error)
    } finally {
      setIsLoadingImages(false)
    }
  }

  useEffect(() => {
    if (isNewSessionOpen) {
      fetchAvailableImages()
    }
  }, [isNewSessionOpen])

  const handleCreateSession = async () => {
    try {
      setIsCreating(true)
      await createSession({
        image_name: imageName,
        num_ports: 1, // Default to 1 port
        port_mappings: [],
      })
      setIsNewSessionOpen(false)
      onSessionsChange()
    } catch (error) {
      console.error("Error creating session:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAll = async () => {
    try {
      await deleteAllSessions()
      onSessionsChange()
    } catch (error) {
      console.error("Error deleting all sessions:", error)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold mb-2">Manage Container Sessions</h2>
          <p className="text-gray-400">Create and manage isolated containers with any Docker image.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsNewSessionOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            NEW SESSION
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                DELETE ALL
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all container sessions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAll}>Delete All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Container Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-name">Docker Image</Label>
              {isLoadingImages ? (
                <div className="h-10 flex items-center text-sm text-gray-400">Loading available images...</div>
              ) : (
                <Select onValueChange={setImageName} value={imageName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Docker image" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableImages.map((image) => (
                      <SelectItem key={image.id} value={`${image.name}:${image.tag}`}>
                        {image.name}:{image.tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreateSession} disabled={!imageName || isCreating}>
              {isCreating ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

