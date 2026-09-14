COMPOSE_DEV = docker compose -f docker-compose.dev.yml

.PHONY: help up up-d build down down-v restart restart-backend logs logs-backend logs-db sh db-cli

help: 
	@echo "Available Makefile commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

up: 
	$(COMPOSE_DEV) up

up-d: 
	$(COMPOSE_DEV) up -d

build: 
	$(COMPOSE_DEV) up -d --build

down: 
	$(COMPOSE_DEV) down

down-v: # clear db if not needs don't use it
	$(COMPOSE_DEV) down -v

restart: 
	$(COMPOSE_DEV) restart

restart-backend: 
	$(COMPOSE_DEV) restart backend

logs: 
	$(COMPOSE_DEV) logs -f

logs-backend: # logs
	$(COMPOSE_DEV) logs -f backend

logs-db: 
	$(COMPOSE_DEV) logs -f mysql

sh: 
	docker exec -it telegram_backend_dev sh

db-cli: 
	docker exec -it telegram_mysql mysql -u root -p1234 telegram_attendance_db
