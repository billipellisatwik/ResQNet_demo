import os

class Settings:
    PROJECT_NAME: str = "ResQNet Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "demo_secret_key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DEMO_MODE: bool = True
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")

settings = Settings()
