from app.config.config import CONFIG

DATABASE_PATH = CONFIG['database_path']

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
