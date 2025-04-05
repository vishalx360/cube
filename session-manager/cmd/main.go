package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/yourusername/session-manager/internal/api"
	"github.com/yourusername/session-manager/internal/service"
	"github.com/yourusername/session-manager/pkg/docker"
	"github.com/yourusername/session-manager/pkg/port"
)

func main() {
	// Initialize Docker manager
	dockerManager, err := docker.NewDockerManager()
	if err != nil {
		log.Fatalf("Failed to create Docker manager: %v", err)
	}

	// Initialize port manager (now using dynamic port allocation)
	portManager := port.NewPortManager()

	// Initialize session service
	sessionService := service.NewSessionService(dockerManager, portManager)

	// Initialize API handler
	handler := api.NewHandler(sessionService)

	// Create router
	router := mux.NewRouter()

	// Register routes - order matters! Specific routes before parameterized routes
	router.HandleFunc("/sessions", handler.CreateSession).Methods("POST")
	router.HandleFunc("/sessions", handler.ListSessions).Methods("GET")
	router.HandleFunc("/sessions/all", handler.DeleteAllSessions).Methods("DELETE")
	router.HandleFunc("/sessions/{id}", handler.DeleteSession).Methods("DELETE")

	// Start server
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
