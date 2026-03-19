from typing import Any, Iterable, Sequence

from langchain_ollama import ChatOllama
from langchain_core.messages import AIMessage, BaseMessage

from backend.llm.base import BaseLLMProvider, ensure_messages


class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str, model: str, timeout_seconds: int = 60) -> None:
        self.client = ChatOllama(
            model=model,
            base_url=base_url,
            temperature=0.2,
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


__all__ = ["OllamaProvider"]
