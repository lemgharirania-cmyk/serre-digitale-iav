# routers/tts_router.py — Gemini TTS Proxy
import os
import struct
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/tts", tags=["TTS"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent"

# Voice map per language — best voices for each
VOICE_MAP = {
    "fr": "Aoede",      # warm, natural French
    "en": "Charon",     # clear British English
    "ar": "Aoede",      # multilingual fallback
}

# Style prompts per language
STYLE_MAP = {
    "fr": "Parlez de manière claire, chaleureuse et professionnelle. Ton calme et rassurant.",
    "en": "Speak clearly, warmly and professionally. Calm and reassuring tone.",
    "ar": "تحدث بوضوح ودفء واحترافية. نبرة هادئة ومطمئنة.",
}

class TTSRequest(BaseModel):
    text: str
    lang: str = "fr"
    voice: str | None = None

def convert_to_wav(audio_data: bytes, sample_rate: int = 24000, bits: int = 16) -> bytes:
    """Wrap raw PCM in a WAV header."""
    num_channels = 1
    data_size = len(audio_data)
    block_align = num_channels * (bits // 8)
    byte_rate = sample_rate * block_align
    chunk_size = 36 + data_size
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", chunk_size, b"WAVE",
        b"fmt ", 16, 1, num_channels,
        sample_rate, byte_rate, block_align, bits,
        b"data", data_size
    )
    return header + audio_data

@router.post("")
async def synthesize(req: TTSRequest):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

    lang = req.lang if req.lang in VOICE_MAP else "fr"
    voice = req.voice or VOICE_MAP[lang]
    style = STYLE_MAP.get(lang, STYLE_MAP["fr"])

    # Build the full prompt with style direction
    full_text = f"{style}\n\n{req.text}"

    payload = {
        "contents": [{"role": "user", "parts": [{"text": full_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {"voiceName": voice}
                }
            }
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Gemini API error: {e.response.status_code}")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Gemini API timeout")

    data = resp.json()

    # Extract audio from response
    try:
        parts = data["candidates"][0]["content"]["parts"]
        audio_part = next(p for p in parts if "inlineData" in p)
        import base64
        raw_audio = base64.b64decode(audio_part["inlineData"]["data"])
        mime_type  = audio_part["inlineData"].get("mimeType", "audio/L16;rate=24000")
    except (KeyError, StopIteration):
        raise HTTPException(status_code=502, detail="No audio in Gemini response")

    # Parse sample rate from mime type
    sample_rate = 24000
    for part in mime_type.split(";"):
        part = part.strip()
        if part.lower().startswith("rate="):
            try:
                sample_rate = int(part.split("=")[1])
            except ValueError:
                pass

    wav_audio = convert_to_wav(raw_audio, sample_rate)

    return StreamingResponse(
        iter([wav_audio]),
        media_type="audio/wav",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        }
    )

@router.options("")
async def tts_options():
    """Handle CORS preflight."""
    from fastapi.responses import Response
    return Response(headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    })
