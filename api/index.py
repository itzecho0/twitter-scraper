from __future__ import annotations

import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field

load_dotenv()

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
