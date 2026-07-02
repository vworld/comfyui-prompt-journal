.PHONY: migration migrate reset-db test

migration:
	alembic revision --autogenerate -m "$(m)"

migrate:
	alembic upgrade head

reset-db:
	rm -f data/prompt_archive.db
	alembic upgrade head

test:
	pytest