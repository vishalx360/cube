package util

import (
	"errors"
	"fmt"
)

// Common error variables
var (
	ErrNotFound          = errors.New("resource not found")
	ErrInvalidRequest    = errors.New("invalid request")
	ErrInternalServer    = errors.New("internal server error")
	ErrResourceExists    = errors.New("resource already exists")
	ErrResourceBusy      = errors.New("resource is busy")
	ErrUnavailable       = errors.New("resource is unavailable")
	ErrOperationNotValid = errors.New("operation not valid")
)

// WrapError wraps an error with a prefix
func WrapError(err error, format string, args ...interface{}) error {
	if err == nil {
		return nil
	}
	prefix := fmt.Sprintf(format, args...)
	return fmt.Errorf("%s: %w", prefix, err)
}

// IsNotFoundError checks if the error is a not found error
func IsNotFoundError(err error) bool {
	return errors.Is(err, ErrNotFound)
}

// IsInvalidRequestError checks if the error is an invalid request error
func IsInvalidRequestError(err error) bool {
	return errors.Is(err, ErrInvalidRequest)
}

// IsInternalServerError checks if the error is an internal server error
func IsInternalServerError(err error) bool {
	return errors.Is(err, ErrInternalServer)
}
