from typing import Any, Iterable, Sequence

from langchain_core.messages import AIMessage, BaseMessage
from langchain_openai import ChatOpenAI

from backend.llm.base import BaseLLMProvider, ensure_messages


class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", timeout_seconds: int = 60) -> None:
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required for OpenAIProvider")
        self.client = ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=0.2,
            timeout=timeout_seconds,
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


__all__ = ["OpenAIProvider"]
