class InvalidCredentialsError(Exception):
    pass

class InvalidTokenError(Exception):
    pass

class NotFoundError(Exception):
    pass

class UserAlreadyExistsError(Exception):
    pass

class InvalidPasswordError(Exception):
    pass

class RoleAlreadyExistsError(Exception):
    pass

class DocumentAlreadyExistsError(Exception):
    pass

class MissingRequiredFieldsError(Exception):
    pass

class DepartmentAlreadyExistsError(Exception):
    pass

class JobTitleAlreadyExistsError(Exception):
    pass

class TenantAlreadyExistsError(Exception):
    pass

class InternalError(Exception):
    pass

class OnProcessingError(Exception):
    pass

class AccessDeniedError(Exception):
    pass