from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "AFAMAR"
    app_version: str = "1.0.0"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./afamar.db"

    # CORS
    cors_origins: str = "http://localhost:5173"

    # PDF
    pdf_output_dir: str = "./pdfs"

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
