from typing import Any, Iterable, Sequence

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import AIMessage, BaseMessage

from backend.llm.base import BaseLLMProvider, ensure_messages


class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-pro", timeout_seconds: int = 60) -> None:
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is required for GeminiProvider")
        self.client = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.2,
            max_output_tokens=1024,
            convert_system_message_to_human=True,
            request_timeout=timeout_seconds,
        )

    def generate_response(
        self,
        prompt: str | Sequence[BaseMessage],
        *,
        tools: Iterable[Any] | None = None,
    ) -> AIMessage:
        messages = ensure_messages(prompt)
        if tools:
            tool_ready = self.client.bind_tools(list(tools))
            return tool_ready.invoke(messages)
        return self.client.invoke(messages)

    def call_with_tools(
        self,
        messages: Sequence[BaseMessage],
        tools: Iterable[Any],
    ) -> AIMessage:
        tool_ready = self.client.bind_tools(list(tools))
        return tool_ready.invoke(list(messages))


__all__ = ["GeminiProvider"]
