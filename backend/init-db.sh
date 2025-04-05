#!/bin/bash

# Start PostgreSQL service
service postgresql start

# Create database and user
su - postgres -c "psql -c \"CREATE DATABASE todos;\""
su - postgres -c "psql -c \"CREATE USER todo_user WITH PASSWORD 'todo_password';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE todos TO todo_user;\""

# Create table and insert sample data
su - postgres -c "psql todos -c \"
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todos (title, description, completed) VALUES
    ('Learn Docker', 'Learn how to containerize applications', false),
    ('Build API', 'Create a RESTful API with Express', false),
    ('Setup PostgreSQL', 'Configure PostgreSQL database', true);
\""

# Grant permissions to the user
su - postgres -c "psql todos -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO todo_user;\""
su - postgres -c "psql todos -c \"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO todo_user;\"" 