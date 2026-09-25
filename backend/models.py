from pydantic import BaseModel, Field
from typing import Optional


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    lang: str = "ur"


class VerifyRequest(BaseModel):
    surah: int = Field(..., ge=1, le=114)
    ayah: int = Field(..., ge=1, le=286)
    claim: str = Field(..., min_length=1, max_length=1000)
    lang: str = "ur"


class VerifyByTextRequest(BaseModel):
    """Verify a claim without knowing the exact surah/ayah — searches first."""
    claim: str = Field(..., min_length=1, max_length=1000)
    lang: str = "ur"
    reference: Optional[str] = None  # e.g. "2:255" if user provides it
