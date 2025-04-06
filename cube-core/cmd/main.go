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
	"github.com/go-chi/cors"
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

	// Initialize metrics service
	logger.Info("Initializing metrics service")
	metricsService, err := service.NewMetricsService(dockerManager, sessionService)
	if err != nil {
		logger.Error("Failed to create metrics service: %v", err)
		log.Fatalf("Failed to create metrics service: %v", err)
	}

	// Initialize REST handlers
	logger.Info("Initializing REST handlers")
	restHandler := handler.NewRestHandler(sessionService)
	metricsHandler := handler.NewMetricsHandler(metricsService)

	// Create router using Chi
	logger.Info("Creating router")
	router := chi.NewRouter()

	// Add middlewares
	router.Use(middleware.RequestID)
	router.Use(middleware.RealIP)
	router.Use(middleware.Logger)
	router.Use(middleware.Recoverer)
	router.Use(middleware.Timeout(60 * 1000))

	// Add CORS middleware
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not caught by any browsers
	}))

	// Create an API v1 subrouter
	logger.Info("Registering routes")
	apiRouter := chi.NewRouter()
	router.Mount("/api/v1", apiRouter)

	// Register routes on the API v1 subrouter
	restHandler.RegisterRoutes(apiRouter)
	metricsHandler.RegisterRoutes(apiRouter)

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
