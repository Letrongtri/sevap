from enum import Enum

class AccessLevel(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    MANAGERIAL = "managerial"

class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"

class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"