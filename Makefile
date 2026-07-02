.PHONY: migration migrate reset-db test py-server-dev tauri-dev

migration:
	alembic revision --autogenerate -m "$(m)"

migrate:
	alembic upgrade head

reset-db:
	rm -f data/prompt_archive.db
	alembic upgrade head

test:
	pytest

py-server-dev:
	uvicorn app.api.app:app --reload

tauri-dev:
	cd ui && pnpm tauri dev