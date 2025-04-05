package api

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/yourusername/session-manager/internal/model"
	"github.com/yourusername/session-manager/internal/service"
)

type Handler struct {
	sessionService *service.SessionService
}

func NewHandler(sessionService *service.SessionService) *Handler {
	return &Handler{
		sessionService: sessionService,
	}
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	session, err := h.sessionService.CreateSession()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := model.CreateSessionResponse{
		Session: *session,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	err := h.sessionService.DeleteSession(sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	response := model.DeleteSessionResponse{
		Message: "Session deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) DeleteAllSessions(w http.ResponseWriter, r *http.Request) {
	count, err := h.sessionService.DeleteAllSessions()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := model.DeleteAllSessionsResponse{
		Count:   count,
		Message: "All sessions deleted successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) ListSessions(w http.ResponseWriter, r *http.Request) {
	sessions := h.sessionService.ListSessions()

	// Convert []*model.Session to []model.Session
	sessionList := make([]model.Session, len(sessions))
	for i, session := range sessions {
		sessionList[i] = *session
	}

	response := model.ListSessionsResponse{
		Sessions: sessionList,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
