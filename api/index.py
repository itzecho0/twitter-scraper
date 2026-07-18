from __future__ import annotations

import logging
import os
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

try:
    from apify_client import ApifyClient
except Exception:  # pragma: no cover - dependency/configuration guard for local installs
    ApifyClient = None  # type: ignore[assignment]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=ENV_PATH)

print(f"[startup] project .env loaded: {ENV_PATH.exists()}")
print(f"[startup] OPENAI_API_KEY loaded: {bool(os.getenv('OPENAI_API_KEY'))}")
print(f"[startup] APIFY_API_TOKEN loaded: {bool(os.getenv('APIFY_API_TOKEN'))}")

app = FastAPI(title="Ronak AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

DEFAULT_APIFY_ACTOR_ID = "scraping_solutions/twitter-x-scraper-post-timeline-search-replies"
APIFY_ACTOR_WAIT_SECONDS = 180
logger = logging.getLogger("uvicorn.error")


class SourcePost(BaseModel):
    id: str
    author: str
    username: str
    preview: str
    content: str


class GenerateRequest(BaseModel):
    source_post: SourcePost = Field(alias="sourcePost")
    brand_system_prompt: str = Field(alias="brandSystemPrompt", min_length=1)


class RefineRequest(GenerateRequest):
    current_draft: str = Field(alias="currentDraft", min_length=1)
    user_instruction: str = Field(alias="userInstruction", min_length=1)


class RegenerateRequest(GenerateRequest):
    current_draft: str | None = Field(default=None, alias="currentDraft")


class DraftResponse(BaseModel):
    draft: str
    model: str
    mode: Literal["generate", "refine", "regenerate"]


class PostResponse(BaseModel):
    id: str
    heading: str
    body: str
    authorName: str
    username: str
    profileImage: str | None = None
    postedAt: str
    relativeTime: str
    postImage: str | None = None
    sourceUrl: str


def get_client() -> OpenAI:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured on the backend.",
        )
    return OpenAI()


def model_name() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-5.6-luna")


def source_summary(source_post: SourcePost) -> str:
    return (
        f"Author: {source_post.author} ({source_post.username})\n"
        f"Post preview: {source_post.preview}\n"
        f"Full source post:\n{source_post.content}"
    )


def call_openai(instructions: str, prompt: str) -> str:
    try:
        response = get_client().responses.create(
            model=model_name(),
            instructions=instructions,
            input=prompt,
            max_output_tokens=700,
        )
    except HTTPException:
        raise
    except OpenAIError as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unexpected AI generation error.") from exc

    draft = (response.output_text or "").strip()
    if not draft:
        raise HTTPException(status_code=502, detail="OpenAI returned an empty draft.")
    return draft


def apify_token() -> str:
    token = os.getenv("APIFY_API_TOKEN", "").strip()
    if not token:
        raise HTTPException(status_code=503, detail="APIFY_API_TOKEN is not configured on the backend.")
    return token


def apify_actor_id() -> str:
    return os.getenv("APIFY_ACTOR_ID", DEFAULT_APIFY_ACTOR_ID).strip() or DEFAULT_APIFY_ACTOR_ID


def actor_input(search: str, filter_value: str, limit: int) -> dict[str, Any]:
    return {
        "TypeScraper": "timeline_users",
        "Input_Search": [search],
        "filter": filter_value,
        "resultsLimit": limit,
    }


def safe_apify_message(value: object) -> str:
    message = str(value or "").strip()
    token = os.getenv("APIFY_API_TOKEN", "").strip()
    if token:
        message = message.replace(token, "[REDACTED]")
    message = re.sub(r"apify_api_[A-Za-z0-9_-]+", "[REDACTED]", message, flags=re.IGNORECASE)
    message = re.sub(
        r"(?i)(token(?:=|:|\s+))[^\s&]+",
        r"\1[REDACTED]",
        message,
    )
    return message[:500] or "No error message provided."


def log_apify_run(run: dict[str, Any]) -> tuple[str, str]:
    run_id = str(run.get("id") or "unknown")
    status = str(run.get("status") or "UNKNOWN").upper()
    logger.info("Apify Actor run %s status=%s", run_id, status)
    return run_id, status


def actor_start_error(exc: Exception) -> HTTPException:
    message = safe_apify_message(exc)
    lowered = message.lower()
    status_code = getattr(exc, "status_code", None)
    if status_code in {401, 403} or any(
        marker in lowered for marker in ("unauthorized", "401", "403", "invalid token")
    ):
        return HTTPException(status_code=401, detail="Apify authentication failed.")
    if status_code == 400 or (
        "input" in lowered and any(marker in lowered for marker in ("invalid", "rejected", "schema", "400"))
    ):
        return HTTPException(status_code=422, detail="Actor input rejected.")
    if "actor was not found" in lowered or "actor not found" in lowered:
        return HTTPException(status_code=502, detail="Configured Apify Actor was not found.")
    return HTTPException(status_code=502, detail="Apify Actor request failed. Check the backend logs.")


def relative_time(value: datetime | None) -> str:
    if value is None:
        return "Recent"

    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    diff = datetime.now(UTC) - value.astimezone(UTC)
    minutes = max(0, round(diff.total_seconds() / 60))
    if minutes < 1:
        return "Just now"
    if minutes < 60:
        return f"{minutes}m ago"
    hours = round(minutes / 60)
    if hours < 24:
        return f"{hours}h ago"
    return f"{round(hours / 24)}d ago"


def readable_date(value: datetime) -> str:
    if os.name == "nt":
        return value.strftime("%B %#d, %Y at %#I:%M %p")
    return value.strftime("%B %-d, %Y at %-I:%M %p")


def parse_datetime(value: object) -> tuple[datetime | None, str]:
    if isinstance(value, datetime):
        parsed = value if value.tzinfo else value.replace(tzinfo=UTC)
        return parsed, readable_date(parsed)

    raw_text = str(value or "").strip()
    if not raw_text:
        return None, "Recent"

    for parser in (
        lambda: datetime.fromisoformat(raw_text.replace("Z", "+00:00")),
        lambda: datetime.strptime(raw_text, "%a %b %d %H:%M:%S %z %Y"),
    ):
        try:
            parsed = parser()
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=UTC)
            return parsed, readable_date(parsed)
        except ValueError:
            continue

    try:
        parsed = datetime.fromtimestamp(float(raw_text), tz=UTC)
        return parsed, readable_date(parsed)
    except (ValueError, OverflowError):
        return None, raw_text


def heading_from_body(body: str) -> str:
    meaningful_lines = [line.strip() for line in body.splitlines() if line.strip() and not line.startswith("http")]
    source = meaningful_lines[0] if meaningful_lines else body.strip()
    sentence = re.split(r"(?<=[.!?])\s+", source, maxsplit=1)[0].strip()
    words = sentence.split()
    if len(words) < 8:
        words = body.split()
    selected = words[:14]
    heading = " ".join(selected).strip()
    if len(words) > 14:
        heading = f"{heading.rstrip('.,;:!?')}..."
    return heading or "Recent post from X"


def username_from_link(link_user: str) -> str:
    handle = link_user.rstrip("/").split("/")[-1].strip()
    return f"@{handle}" if handle else "@unknown"


def normalize_apify_record(record: dict[str, Any]) -> PostResponse | None:
    body = str(record.get("text") or "").strip()
    if not body:
        return None

    source_url = str(record.get("link_post") or "").strip()
    post_id = source_url.rstrip("/").split("/")[-1] if source_url else f"apify-{abs(hash(body))}"
    link_user = str(record.get("link_user") or "").strip()
    username = username_from_link(link_user)
    author_name = str(record.get("user.full_name") or username.lstrip("@")).strip()
    profile_image = str(record.get("user.profile_pic_url") or "").strip() or None

    repost = re.match(r"^RT @([A-Za-z0-9_]{1,15}):\s*(.+)$", body, flags=re.DOTALL)
    if repost:
        original_handle, original_body = repost.groups()
        username = f"@{original_handle}"
        author_name = original_handle
        profile_image = None
        body = original_body.strip()

    posted_at, _ = parse_datetime(record.get("creation_date") or record.get("timestamp"))
    posted_at_value = posted_at.isoformat() if posted_at else str(record.get("creation_date") or "")

    return PostResponse(
        id=post_id,
        heading=heading_from_body(body),
        body=body,
        authorName=author_name,
        username=username,
        profileImage=profile_image,
        postedAt=posted_at_value,
        relativeTime=relative_time(posted_at),
        postImage=None,
        sourceUrl=source_url or "https://x.com/",
    )


def fetch_apify_posts(search: str, filter_value: str, limit: int) -> list[PostResponse]:
    if ApifyClient is None:
        raise HTTPException(status_code=503, detail="apify-client is not installed on the backend.")

    client = ApifyClient(apify_token())

    try:
        run = client.actor(apify_actor_id()).call(
            run_input=actor_input(search, filter_value, limit),
            timeout_secs=APIFY_ACTOR_WAIT_SECONDS,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Apify Actor request failed")
        raise actor_start_error(exc) from exc

    if not run:
        raise HTTPException(status_code=502, detail="Apify Actor did not return a run object.")

    run_id, status = log_apify_run(run)

    if status in {"READY", "RUNNING", "TIMED-OUT", "TIMED_OUT"}:
        raise HTTPException(
            status_code=504,
            detail=f"Apify Actor did not complete within {APIFY_ACTOR_WAIT_SECONDS} seconds.",
        )
    if status == "FAILED":
        raise HTTPException(status_code=502, detail="Actor run failed.")
    if status == "ABORTED":
        raise HTTPException(status_code=502, detail="Actor was aborted.")
    if status != "SUCCEEDED":
        raise HTTPException(status_code=502, detail=f"Actor run ended with status {status}.")

    dataset_id = run.get("defaultDatasetId") or run.get("default_dataset_id")
    if not dataset_id:
        raise HTTPException(status_code=502, detail="Apify Actor did not return a default dataset.")

    try:
        items = list(client.dataset(dataset_id).list_items(limit=limit, clean=True).items)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not fetch Apify dataset results.") from exc

    normalized: list[PostResponse] = []
    seen: set[str] = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        try:
            post = normalize_apify_record(item)
        except Exception:
            continue
        if not post or post.id in seen:
            continue
        seen.add(post.id)
        normalized.append(post)

    return normalized


BASE_INSTRUCTIONS = """
You are an expert social content strategist writing Meta Threads posts.
Never mention that you are an AI.
Never invent facts beyond the supplied source post.
Do not include hashtags unless the brand prompt explicitly asks for them.
Write in a polished, natural, human voice suitable for a technology operator audience.
Return only the draft text.
""".strip()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/posts", response_model=list[PostResponse])
async def get_posts(
    search: str = Query(default="OpenAI", min_length=1, max_length=300),
    filter: str = Query(default="latest", min_length=1, max_length=50),
    limit: int = Query(default=20, ge=1, le=50),
) -> list[PostResponse]:
    posts = await run_in_threadpool(fetch_apify_posts, search.strip(), filter.strip(), limit)
    return posts


@app.post("/api/generate", response_model=DraftResponse)
def generate(request: GenerateRequest) -> DraftResponse:
    instructions = f"{BASE_INSTRUCTIONS}\n\nBrand system prompt:\n{request.brand_system_prompt}"
    prompt = (
        "Create the first Meta Threads draft from this source post.\n"
        "Keep it concise, useful, and ready to edit.\n\n"
        f"{source_summary(request.source_post)}"
    )
    return DraftResponse(draft=call_openai(instructions, prompt), model=model_name(), mode="generate")


@app.post("/api/refine", response_model=DraftResponse)
def refine(request: RefineRequest) -> DraftResponse:
    instructions = f"{BASE_INSTRUCTIONS}\n\nBrand system prompt:\n{request.brand_system_prompt}"
    prompt = (
        "Refine the current Threads draft using the user instruction.\n"
        "Preserve the best ideas from the source post and return only the revised draft.\n\n"
        f"{source_summary(request.source_post)}\n\n"
        f"Current draft:\n{request.current_draft}\n\n"
        f"User instruction:\n{request.user_instruction}"
    )
    return DraftResponse(draft=call_openai(instructions, prompt), model=model_name(), mode="refine")


@app.post("/api/regenerate", response_model=DraftResponse)
def regenerate(request: RegenerateRequest) -> DraftResponse:
    instructions = f"{BASE_INSTRUCTIONS}\n\nBrand system prompt:\n{request.brand_system_prompt}"
    prompt = (
        "Create a new alternative Meta Threads draft from the original source post.\n"
        "Use a noticeably different angle, structure, or hook from the current draft if one is supplied.\n\n"
        f"{source_summary(request.source_post)}"
    )
    if request.current_draft:
        prompt += f"\n\nCurrent draft to avoid repeating too closely:\n{request.current_draft}"
    return DraftResponse(draft=call_openai(instructions, prompt), model=model_name(), mode="regenerate")
