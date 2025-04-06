package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/internal/service"
	"github.com/yourusername/session-manager/pkg/util"
)

// MetricsHandler handles metrics-related HTTP requests
type MetricsHandler struct {
	metricsService *service.MetricsService
	logger         *util.Logger
}

// NewMetricsHandler creates a new metrics handler
func NewMetricsHandler(metricsService *service.MetricsService) *MetricsHandler {
	return &MetricsHandler{
		metricsService: metricsService,
		logger:         util.NewLogger(),
	}
}

// RegisterRoutes registers the metrics routes
func (h *MetricsHandler) RegisterRoutes(r chi.Router) {
	h.logger.Info("Registering metrics routes")

	// System metrics
	r.Get("/metrics/system", h.GetSystemMetrics)

	// Container metrics
	r.Get("/metrics/containers", h.GetContainerMetrics)
	r.Get("/metrics/containers/{sessionId}", h.GetContainerMetricsForSession)
}

// GetSystemMetrics returns the current system metrics
func (h *MetricsHandler) GetSystemMetrics(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling GetSystemMetrics request")

	metrics, err := h.metricsService.GetSystemMetrics(r.Context())
	if err != nil {
		h.logger.Error("Failed to get system metrics: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.SystemMetricsResponse{
		Metrics: *metrics,
	}

	writeJSON(w, http.StatusOK, response)
}

// GetContainerMetrics returns metrics for all containers
func (h *MetricsHandler) GetContainerMetrics(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling GetContainerMetrics request")

	metrics, err := h.metricsService.GetContainerMetrics(r.Context())
	if err != nil {
		h.logger.Error("Failed to get container metrics: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.ContainerMetricsResponse{
		Metrics: metrics,
	}

	writeJSON(w, http.StatusOK, response)
}

// GetContainerMetricsForSession returns metrics for a specific session
func (h *MetricsHandler) GetContainerMetricsForSession(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling GetContainerMetricsForSession request")

	sessionID := chi.URLParam(r, "sessionId")
	if sessionID == "" {
		h.logger.Error("Session ID is required")
		writeError(w, http.StatusBadRequest, "session ID is required")
		return
	}

	metrics, err := h.metricsService.GetContainerMetricsForSession(r.Context(), sessionID)
	if err != nil {
		h.logger.Error("Failed to get container metrics for session: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, metrics)
}
