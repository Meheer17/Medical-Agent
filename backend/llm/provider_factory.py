from backend.core.config import Settings
from backend.core.logger import get_logger
from backend.llm.base import BaseLLMProvider
from backend.llm.gemini_provider import GeminiProvider
from backend.llm.ollama_provider import OllamaProvider
from backend.llm.openai_provider import OpenAIProvider

logger = get_logger(__name__)


def build_llm_provider(settings: Settings) -> BaseLLMProvider:
    if settings.gemini_api_key:
        logger.info("Initializing Gemini provider")
        return GeminiProvider(
            api_key=settings.gemini_api_key,
            model="gemini-pro",
            timeout_seconds=settings.llm_timeout_seconds,
        )

    if settings.openai_api_key:
        logger.info("Initializing OpenAI provider")
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            model="gpt-4o-mini",
            timeout_seconds=settings.llm_timeout_seconds,
        )

    logger.info("Initializing Ollama provider", extra={"base_url": settings.ollama_base_url})
    return OllamaProvider(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        timeout_seconds=settings.llm_timeout_seconds,
    )


__all__ = ["build_llm_provider"]
