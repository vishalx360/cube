package util

import (
	"log"
	"os"
)

// Logger levels
const (
	InfoLevel  = "INFO"
	WarnLevel  = "WARN"
	ErrorLevel = "ERROR"
	DebugLevel = "DEBUG"
)

// Logger is a simple logger for the application
type Logger struct {
	infoLogger  *log.Logger
	warnLogger  *log.Logger
	errorLogger *log.Logger
	debugLogger *log.Logger
}

// NewLogger creates a new logger
func NewLogger() *Logger {
	return &Logger{
		infoLogger:  log.New(os.Stdout, "[INFO] ", log.LstdFlags),
		warnLogger:  log.New(os.Stdout, "[WARN] ", log.LstdFlags),
		errorLogger: log.New(os.Stderr, "[ERROR] ", log.LstdFlags),
		debugLogger: log.New(os.Stdout, "[DEBUG] ", log.LstdFlags),
	}
}

// Info logs an info message
func (l *Logger) Info(message string, args ...interface{}) {
	l.infoLogger.Printf(message, args...)
}

// Warn logs a warning message
func (l *Logger) Warn(message string, args ...interface{}) {
	l.warnLogger.Printf(message, args...)
}

// Error logs an error message
func (l *Logger) Error(message string, args ...interface{}) {
	l.errorLogger.Printf(message, args...)
}

// Debug logs a debug message
func (l *Logger) Debug(message string, args ...interface{}) {
	l.debugLogger.Printf(message, args...)
}
