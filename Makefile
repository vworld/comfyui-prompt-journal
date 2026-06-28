.PHONY: migration migrate reset-db test

migration:
	alembic revision --autogenerate -m "$(m)"

migrate:
	alembic upgrade head

reset-db:
	rm -f journal.db
	alembic upgrade head

test:
	pytest