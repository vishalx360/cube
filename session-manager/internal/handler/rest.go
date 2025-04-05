package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/internal/service"
	"github.com/yourusername/session-manager/pkg/util"
)

// RestHandler handles HTTP requests for the session manager
type RestHandler struct {
	sessionService *service.SessionService
	logger         *util.Logger
}

// NewRestHandler creates a new REST handler
func NewRestHandler(sessionService *service.SessionService) *RestHandler {
	return &RestHandler{
		sessionService: sessionService,
		logger:         util.NewLogger(),
	}
}

// RegisterRoutes registers the HTTP routes for the handler
func (h *RestHandler) RegisterRoutes(r chi.Router) {
	h.logger.Info("Registering routes")

	r.Route("/api/v1", func(r chi.Router) {
		// Sessions
		r.Get("/sessions", h.ListSessions)
		r.Post("/sessions", h.CreateSession)
		r.Delete("/sessions/{id}", h.DeleteSession)
		r.Delete("/sessions", h.DeleteAllSessions)

		// Images
		r.Get("/images", h.ListImages)
	})
}

// ListSessions handles GET /api/v1/sessions
func (h *RestHandler) ListSessions(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling ListSessions request")
	sessions := h.sessionService.ListSessions()

	// Convert []*model.Session to []model.Session
	sessionList := make([]model.Session, len(sessions))
	for i, session := range sessions {
		sessionList[i] = *session
	}

	response := model.ListSessionsResponse{
		Sessions: sessionList,
	}

	writeJSON(w, http.StatusOK, response)
}

// CreateSession handles POST /api/v1/sessions
func (h *RestHandler) CreateSession(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling CreateSession request")
	var req model.CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.logger.Error("Invalid request body: %v", err)
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	h.logger.Info("Creating session for image: %s", req.ImageName)
	session, err := h.sessionService.CreateSession(&req)
	if err != nil {
		h.logger.Error("Failed to create session: %v", err)

		if util.IsInvalidRequestError(err) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}

		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.CreateSessionResponse{
		Session: *session,
	}

	writeJSON(w, http.StatusCreated, response)
}

// DeleteSession handles DELETE /api/v1/sessions/{id}
func (h *RestHandler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling DeleteSession request")
	id := chi.URLParam(r, "id")
	if id == "" {
		h.logger.Error("Session ID is required")
		writeError(w, http.StatusBadRequest, "session ID is required")
		return
	}

	h.logger.Info("Deleting session: %s", id)
	if err := h.sessionService.DeleteSession(id); err != nil {
		h.logger.Error("Failed to delete session: %v", err)

		if util.IsNotFoundError(err) {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}

		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.DeleteSessionResponse{
		Message: "session deleted successfully",
	}

	writeJSON(w, http.StatusOK, response)
}

// DeleteAllSessions handles DELETE /api/v1/sessions
func (h *RestHandler) DeleteAllSessions(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling DeleteAllSessions request")

	h.logger.Info("Deleting all sessions")
	count, err := h.sessionService.DeleteAllSessions()
	if err != nil {
		h.logger.Error("Failed to delete all sessions: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.DeleteAllSessionsResponse{
		Count:   count,
		Message: "sessions deleted successfully",
	}

	writeJSON(w, http.StatusOK, response)
}

// ListImages handles GET /api/v1/images
func (h *RestHandler) ListImages(w http.ResponseWriter, r *http.Request) {
	h.logger.Debug("Handling ListImages request")

	images, err := h.sessionService.ListImages()
	if err != nil {
		h.logger.Error("Failed to list images: %v", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	response := model.ListImagesResponse{
		Images: images,
	}

	writeJSON(w, http.StatusOK, response)
}

// writeJSON writes a JSON response
func writeJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// writeError writes an error response
func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
