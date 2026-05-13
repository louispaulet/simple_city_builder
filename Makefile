PORT ?= 5173
PID_FILE := .vite.pid

.PHONY: up kill build deploy test

up:
	npm install
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "Vite is already running on pid $$(cat $(PID_FILE))"; \
	else \
		(nohup npm run dev -- --port $(PORT) > .vite.log 2>&1 & echo $$! > $(PID_FILE)); \
		echo "Vite started at http://localhost:$(PORT)/simple_city_builder/"; \
	fi

kill:
	@if [ -f $(PID_FILE) ]; then \
		kill $$(cat $(PID_FILE)) 2>/dev/null || true; \
		rm -f $(PID_FILE); \
		echo "Vite stopped"; \
	else \
		pkill -f "vite.*$(PORT)" 2>/dev/null || true; \
		echo "No pid file found; checked for Vite on port $(PORT)"; \
	fi

build:
	npm run build

deploy:
	npm run deploy

test:
	npm run test
