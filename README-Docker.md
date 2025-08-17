# Chat Application - Docker Setup

This document explains how to run the chat application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (usually included with Docker Desktop)

## Quick Start

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd chat-app
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

## Services

### Database (PostgreSQL)
- **Port:** 5432
- **Database:** chatapp
- **Username:** postgres
- **Password:** postgres
- **Container:** chat-database

### Backend (Spring Boot)
- **Port:** 8080
- **Java Version:** 24
- **Framework:** Spring Boot 3.5.4
- **Container:** chat-backend

### Frontend (React + Vite)
- **Port:** 3000
- **Framework:** React 19
- **Build Tool:** Vite
- **Container:** chat-frontend

## Docker Commands

### Start all services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### Stop and remove volumes
```bash
docker-compose down -v
```

### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

### Rebuild specific service
```bash
docker-compose build backend
docker-compose build frontend
```

## Development

### Running individual services

#### Backend only
```bash
cd backend/chat
docker build -t chat-backend .
docker run -p 8080:8080 --env-file .env chat-backend
```

#### Frontend only
```bash
cd frontend
docker build -t chat-frontend .
docker run -p 3000:3000 chat-frontend
```

#### Database only
```bash
cd database
docker build -t chat-database .
docker run -p 5432:5432 -e POSTGRES_DB=chatapp -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres chat-database
```

## Environment Variables

The application uses the following environment variables:

### Database
- `POSTGRES_DB`: Database name (default: chatapp)
- `POSTGRES_USER`: Database user (default: postgres)
- `POSTGRES_PASSWORD`: Database password (default: postgres)

### Backend
- `SPRING_DATASOURCE_URL`: Database connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password

### Frontend
- `VITE_API_URL`: Backend API URL

## Troubleshooting

### Port conflicts
If you get port conflicts, you can modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change 8080 to 8081
```

### Database connection issues
1. Ensure the database container is running: `docker-compose ps`
2. Check database logs: `docker-compose logs database`
3. Wait for the database to be ready before starting the backend

### Build issues
1. Clean Docker cache: `docker system prune -a`
2. Rebuild without cache: `docker-compose build --no-cache`

### Memory issues
If you encounter memory issues during builds, increase Docker Desktop memory allocation in Docker Desktop settings.

### WebSocket connection issues
1. **Connection goes to disconnected**: This is usually due to incorrect API URLs in Docker environment
   - Ensure `VITE_API_URL` is set to `http://backend:8080` in docker-compose.yml
   - Check that nginx is properly proxying WebSocket connections
   - Verify CORS configuration in backend

2. **Messages don't load in real-time**: 
   - Check WebSocket connection logs: `docker-compose logs backend`
   - Verify frontend is connecting to correct backend URL
   - Ensure nginx WebSocket proxy configuration is correct

### Timezone issues
- Backend container is configured with UTC timezone
- If you need a different timezone, modify the Dockerfile to use your local timezone

