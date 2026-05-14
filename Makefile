PORT ?= 4173
PID_FILE := .vite.pid
STOP_TIMEOUT ?= 10

.PHONY: up kill build deploy test

up:
	npm install
	$(MAKE) kill
	@(nohup npm run dev -- --port $(PORT) > .vite.log 2>&1 < /dev/null & echo $$! > $(PID_FILE))
	@attempts=0; \
	until lsof -tiTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; do \
		attempts=$$((attempts + 1)); \
		if [ "$$attempts" -ge 20 ]; then \
			echo "Vite did not start on port $(PORT). See .vite.log for details."; \
			exit 1; \
		fi; \
		sleep 1; \
	done
	@lsof -tiTCP:$(PORT) -sTCP:LISTEN | head -n 1 > $(PID_FILE)
	@echo "Vite started at http://localhost:$(PORT)/"

kill:
	@pids=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null || true); \
	if [ -n "$$pids" ]; then \
		echo "Stopping processes on port $(PORT): $$pids"; \
		kill $$pids 2>/dev/null || true; \
		attempts=0; \
		while [ "$$attempts" -lt "$(STOP_TIMEOUT)" ] && lsof -tiTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; do \
			attempts=$$((attempts + 1)); \
			sleep 1; \
		done; \
		remaining=$$(lsof -tiTCP:$(PORT) -sTCP:LISTEN 2>/dev/null || true); \
		if [ -n "$$remaining" ]; then \
			echo "Force stopping processes on port $(PORT): $$remaining"; \
			kill -9 $$remaining 2>/dev/null || true; \
		fi; \
		attempts=0; \
		while [ "$$attempts" -lt 5 ] && lsof -tiTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; do \
			attempts=$$((attempts + 1)); \
			sleep 1; \
		done; \
		if lsof -tiTCP:$(PORT) -sTCP:LISTEN >/dev/null 2>&1; then \
			echo "Port $(PORT) is still in use."; \
			exit 1; \
		fi; \
	else \
		echo "No process listening on port $(PORT)"; \
	fi
	@rm -f $(PID_FILE)
	@echo "Vite stopped"

build:
	npm run build

deploy:
	npm run deploy

test:
	npm run test
