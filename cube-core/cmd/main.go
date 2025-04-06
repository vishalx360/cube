package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/yourusername/session-manager/internal/config"
	"github.com/yourusername/session-manager/internal/handler"
	"github.com/yourusername/session-manager/internal/service"
	"github.com/yourusername/session-manager/pkg/docker"
	"github.com/yourusername/session-manager/pkg/port"
	"github.com/yourusername/session-manager/pkg/util"
)

func main() {
	logger := util.NewLogger()
	logger.Info("Starting session manager")

	// Load configuration
	cfg := config.DefaultConfig()
	logger.Info("Using configuration: ServerPort=%d", cfg.ServerPort)

	// Initialize Docker manager
	logger.Info("Initializing Docker manager")
	dockerManager, err := docker.NewDockerManager()
	if err != nil {
		logger.Error("Failed to create Docker manager: %v", err)
		log.Fatalf("Failed to create Docker manager: %v", err)
	}

	// Initialize port manager
	logger.Info("Initializing port manager")
	portManager := port.NewPortManager()

	// Initialize session service
	logger.Info("Initializing session service")
	sessionService := service.NewSessionService(dockerManager, portManager)

	// Initialize REST handler
	logger.Info("Initializing REST handler")
	restHandler := handler.NewRestHandler(sessionService)

	// Create router using Chi
	logger.Info("Creating router")
	router := chi.NewRouter()

	// Add middlewares
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(60 * 1000))

	// Register routes
	restHandler.RegisterRoutes(router)

	// Add health check route
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Set up graceful shutdown
	serverAddr := fmt.Sprintf(":%d", cfg.ServerPort)
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: router,
	}

	// Create channel to listen for signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		logger.Info("Starting server on %s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Failed to start server: %v", err)
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for signal
	<-stop
	logger.Info("Shutting down server...")

	// Clean up sessions
	count, err := sessionService.DeleteAllSessions()
	if err != nil {
		logger.Error("Failed to delete all sessions: %v", err)
	} else {
		logger.Info("Deleted %d sessions", count)
	}

	logger.Info("Server shutdown complete")
}
