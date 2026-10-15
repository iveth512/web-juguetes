from decouple import config

ENVIRONMENT = config("DJANGO_SETTINGS_MODULE", default="config.settings.development")
