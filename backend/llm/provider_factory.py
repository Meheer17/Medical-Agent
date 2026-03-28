from backend.core.config import Settings
from backend.core.logger import get_logger
from backend.llm.base import BaseLLMProvider
from backend.llm.gemini_provider import GeminiProvider
from backend.llm.ollama_provider import OllamaProvider
from backend.llm.openai_provider import OpenAIProvider

logger = get_logger(__name__)


def build_llm_provider(settings: Settings) -> BaseLLMProvider:
    provider_name = settings.llm_provider.strip().lower()
    google_api_key = (settings.google_api_key or "").strip() or None
    openai_api_key = (settings.openai_api_key or "").strip() or None

    if provider_name == "gemini":
        if not google_api_key:
            raise ValueError("LLM_PROVIDER=gemini but GOOGLE_API_KEY is missing")
        logger.info("Initializing Gemini provider")
        return GeminiProvider(
            api_key=google_api_key,
            model=settings.gemini_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )

    if provider_name == "openai":
        if not openai_api_key:
            raise ValueError("LLM_PROVIDER=openai but OPENAI_API_KEY is missing")
        logger.info("Initializing OpenAI provider")
        return OpenAIProvider(
            api_key=openai_api_key,
            model=settings.openai_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )

    if provider_name == "ollama":
        logger.info("Initializing Ollama provider", extra={"base_url": settings.ollama_base_url})
        return OllamaProvider(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )

    if provider_name not in {"", "auto"}:
        logger.warning("Unknown LLM_PROVIDER value; using auto selection", extra={"value": provider_name})

    if google_api_key:
        logger.info("Initializing Gemini provider")
        return GeminiProvider(
            api_key=google_api_key,
            model=settings.gemini_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )

    if openai_api_key:
        logger.info("Initializing OpenAI provider")
        return OpenAIProvider(
            api_key=openai_api_key,
            model=settings.openai_model,
            timeout_seconds=settings.llm_timeout_seconds,
        )

    logger.info("Initializing Ollama provider", extra={"base_url": settings.ollama_base_url})
    return OllamaProvider(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        timeout_seconds=settings.llm_timeout_seconds,
    )


__all__ = ["build_llm_provider"]
