PORT ?= 5173
PID_FILE := .vite.pid

.PHONY: up kill build deploy test

up:
	npm install
	@if lsof -ti tcp:$(PORT) >/dev/null 2>&1; then \
		lsof -ti tcp:$(PORT) | head -n 1 > $(PID_FILE); \
		echo "Vite is already running at http://localhost:$(PORT)/simple_city_builder/"; \
	else \
		(nohup npm run dev -- --port $(PORT) > .vite.log 2>&1 < /dev/null & echo $$! > $(PID_FILE)); \
		sleep 1; \
		lsof -ti tcp:$(PORT) | head -n 1 > $(PID_FILE); \
		echo "Vite started at http://localhost:$(PORT)/simple_city_builder/"; \
	fi

kill:
	@pids=$$(lsof -ti tcp:$(PORT) 2>/dev/null || true); \
	if [ -n "$$pids" ]; then kill $$pids 2>/dev/null || true; fi
	@rm -f $(PID_FILE)
	@echo "Vite stopped"

build:
	npm run build

deploy:
	npm run deploy

test:
	npm run test
