from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


def register_exception_handlers(app: FastAPI):
    pass
    @app.exception_handler(ValueError)
    def value_error_handler(
        request: Request,
        exc: ValueError,
    ):
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc)},
        )

    @app.exception_handler(Exception)
    def generic_exception_handler(
        request: Request,
        exc: Exception,
    ):
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)},
        )
