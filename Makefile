# Resume Screener Makefile

.PHONY: help build up down logs clean test lint format install-dev

# Default target
help:
	@echo "Available commands:"
	@echo "  build          - Build all Docker images"
	@echo "  up             - Start all services in development mode"
	@echo "  down           - Stop all services"
	@echo "  logs           - Show logs from all services"
	@echo "  clean          - Clean up Docker resources"
	@echo "  test           - Run all tests"
	@echo "  lint           - Run linting for all services"
	@echo "  format         - Format code for all services"
	@echo "  install-dev    - Install development dependencies"
	@echo "  prod-up        - Start services in production mode"
	@echo "  prod-down      - Stop production services"

# Development commands
build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

restart:
	docker-compose restart

# Production commands
prod-build:
	docker-compose -f docker-compose.prod.yml build

prod-up:
	docker-compose -f docker-compose.prod.yml up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Testing commands
test:
	docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

test-backend:
	cd backend && source venv/bin/activate && python -m pytest tests/ -v

test-frontend:
	cd frontend && npm run test:ci

# Linting and formatting
lint:
	cd backend && source venv/bin/activate && flake8 app
	cd frontend && npm run lint

format:
	cd backend && source venv/bin/activate && black app && isort app
	cd frontend && npm run format

# Development setup
install-dev:
	cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

# Database commands
db-migrate:
	docker-compose exec backend python -m alembic upgrade head

db-seed:
	docker-compose exec backend python scripts/seed_data.py

# Cleanup commands
clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all:
	docker-compose down -v --rmi all
	docker system prune -af
	docker volume prune -f

# Health checks
health:
	@echo "Checking service health..."
	@curl -f http://localhost:8000/api/v1/health/ || echo "Backend unhealthy"
	@curl -f http://localhost:3000/api/health || echo "Frontend unhealthy"

# Backup and restore
backup:
	docker-compose exec mongodb mongodump --out /data/backup

restore:
	docker-compose exec mongodb mongorestore /data/backup

# SSL setup (for production)
ssl-setup:
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/nginx.key \
		-out nginx/ssl/nginx.crt

# Monitoring
stats:
	docker stats

# Update dependencies
update-deps:
	cd backend && source venv/bin/activate && pip-compile --upgrade requirements.in
	cd frontend && npx npm-check-updates -u && npm install
