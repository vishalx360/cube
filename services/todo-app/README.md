# Todo App with React Frontend and Express Backend

This container runs a full-stack Todo application with a React frontend and Express backend with PostgreSQL.

## Project Structure

```
.
├── backend/           # Backend server code
│   ├── app.js        # Express server and API endpoints
│   ├── init-db.sh    # Database initialization script
│   └── package.json  # Node.js dependencies
├── frontend/         # React frontend code
│   ├── public/       # Static files
│   ├── src/          # React components
│   └── package.json  # React dependencies
├── Dockerfile        # Docker configuration
└── README.md         # Project documentation
```

## Services

- PostgreSQL: Running on port 5432
- Express API: Running on port 3000
- React Frontend: Running on port 80

## Building the Container

```bash
docker build -t todo-app .
```

## Running the Container

```bash
docker run -p 80:80 -p 3000:3000 -p 5432:5432 todo-app
```

## Accessing the Application

- Frontend: http://localhost
- API Documentation: http://localhost:3000/api

## API Endpoints

### Get all todos

```
GET http://localhost:3000/api/todos
```

### Get a single todo

```
GET http://localhost:3000/api/todos/:id
```

### Create a new todo

```
POST http://localhost:3000/api/todos
Content-Type: application/json

{
    "title": "New Todo",
    "description": "Description of the todo"
}
```

### Update a todo

```
PUT http://localhost:3000/api/todos/:id
Content-Type: application/json

{
    "title": "Updated Todo",
    "description": "Updated description",
    "completed": true
}
```

### Delete a todo

```
DELETE http://localhost:3000/api/todos/:id
```

## Database Information

- Host: localhost
- Port: 5432
- Database: todos
- Username: todo_user
- Password: todo_password

## Features

- Modern React frontend with Material-UI
- Full CRUD operations for todos
- Real-time updates
- Responsive design
- Mark todos as complete/incomplete
- Edit and delete todos
- Form validation
- Error handling

## Notes

- The container automatically initializes the database with sample todos
- The API includes full CRUD operations for todos
- CORS is enabled for all origins
- The frontend is built for production and served using a static file server
