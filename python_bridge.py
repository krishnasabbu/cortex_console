import os
import json
import time
import uuid
from typing import Any, Dict, Generator, List, Optional, Union

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from openai import OpenAI

app = FastAPI()


# -----------------------------
# Provider config (Together behind OpenAI-compatible base_url)
# -----------------------------
TOGETHER_BASE_URL = os.getenv("PROVIDER_BASE_URL", "https://api.together.xyz/v1")
PROXY_DEFAULT_MODEL = os.getenv(
    "PROXY_DEFAULT_MODEL",
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
)


def _now_ts() -> int:
    return int(time.time())


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex}"


def _get_bearer_token(req: Request) -> str:
    """
    OpenAI format: Authorization: Bearer <key>
    We'll accept that and use it to call Together (or your upstream).
    """
    auth = req.headers.get("authorization") or req.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer <API_KEY>")
    return auth.split(" ", 1)[1].strip()


def _build_upstream_client(api_key: str) -> OpenAI:
    """
    Uses OpenAI SDK but points it to Together via base_url (OpenAI-compatible).
    """
    return OpenAI(
        api_key=api_key,
        base_url=TOGETHER_BASE_URL,
    )


# -----------------------------
# OpenAI-compatible endpoint
# POST /v1/chat/completions
# -----------------------------
@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body: Dict[str, Any] = await request.json()

    # OpenAI request fields (subset)
    model: str = body.get("model") or PROXY_DEFAULT_MODEL
    messages: List[Dict[str, str]] = body.get("messages") or []
    stream: bool = bool(body.get("stream", False))

    if not isinstance(messages, list) or len(messages) == 0:
        raise HTTPException(status_code=400, detail="`messages` must be a non-empty list")

    # Optional OpenAI params
    temperature = body.get("temperature", 0.7)
    top_p = body.get("top_p", 1)
    max_tokens = body.get("max_tokens", body.get("max_completion_tokens", 512))

    # Read caller key (OpenAI-style)
    api_key = _get_bearer_token(request)

    client = _build_upstream_client(api_key)

    # -----------------------------
    # STREAMING (SSE) - OpenAI format
    # -----------------------------
    if stream:
        request_id = _new_id("chatcmpl")
        created = _now_ts()

        def event_generator() -> Generator[str, None, None]:
            try:
                upstream_stream = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    temperature=temperature,
                    top_p=top_p,
                    max_tokens=max_tokens,
                )

                # We forward upstream chunks as OpenAI-style SSE JSON.
                # Most OpenAI-compatible providers already return the same chunk schema.
                for chunk in upstream_stream:
                    payload = chunk.model_dump() if hasattr(chunk, "model_dump") else chunk

                    # Ensure minimal OpenAI fields exist (safe patch)
                    payload.setdefault("id", request_id)
                    payload.setdefault("object", "chat.completion.chunk")
                    payload.setdefault("created", created)
                    payload.setdefault("model", model)

                    yield f"data: {json.dumps(payload)}\n\n"

                yield "data: [DONE]\n\n"

            except Exception as e:
                # OpenAI-like error envelope (simple)
                err_payload = {
                    "error": {
                        "message": str(e),
                        "type": "server_error",
                    }
                }
                yield f"data: {json.dumps(err_payload)}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # -----------------------------
    # NON-STREAM response - OpenAI format
    # -----------------------------
    try:
        upstream_resp = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )

        payload = upstream_resp.model_dump() if hasattr(upstream_resp, "model_dump") else upstream_resp

        # Ensure OpenAI required-ish fields exist
        payload.setdefault("object", "chat.completion")
        payload.setdefault("model", model)

        return JSONResponse(content=payload)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": {"message": str(e), "type": "server_error"}},
        )
