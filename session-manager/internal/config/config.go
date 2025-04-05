package config

// Config represents the application configuration
type Config struct {
	ServerPort int
	DockerHost string
	MinPort    int
	MaxPort    int
}

// DefaultConfig returns the default configuration
func DefaultConfig() *Config {
	return &Config{
		ServerPort: 8080,
		DockerHost: "",
		MinPort:    0,
		MaxPort:    0,
	}
}
