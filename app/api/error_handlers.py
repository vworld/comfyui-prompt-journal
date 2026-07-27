from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError


def register_exception_handlers(app: FastAPI):

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

    @app.exception_handler(IntegrityError)
    def integrity_error_handler(
        request: Request,
        exc: IntegrityError,
    ):
        return JSONResponse(
            status_code=406,
            content={"detail": str(exc.orig)},
        )
