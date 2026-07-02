from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.file_service import FileService

router = APIRouter()


@router.websocket("/upload-native")
async def websocket_endpoint(
    websocket: WebSocket,
    db: Annotated[
        Session,
        Depends(get_db),
    ],
):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            for path in data["paths"]:
                try:
                    result = await run_in_threadpool(FileService.import_native, path)
                    await websocket.send_json(
                        {
                            "path": path,
                            "status": "done",
                            "result": {"id": result},
                        }
                    )
                except Exception as e:
                    await websocket.send_json(
                        {"path": path, "status": "error", "error": str(e)}
                    )
            await websocket.send_json({"type": "complete"})

    except WebSocketDisconnect:
        pass
