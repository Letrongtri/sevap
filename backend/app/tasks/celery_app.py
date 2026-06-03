from celery import Celery

celery_app = Celery(
    "worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/1",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Ho_Chi_Minh",
    enable_utc=True,

    task_track_started=True,

    task_acks_late=True,
    worker_prefetch_multiplier=1,

    broker_connection_retry_on_startup=True,

    task_time_limit=300,
    task_soft_time_limit=240,

    result_expires=3600,
)