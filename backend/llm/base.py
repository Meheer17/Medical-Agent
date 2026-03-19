from abc import ABC, abstractmethod
from typing import Any, Iterable, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage


def ensure_messages(prompt: str | Sequence[BaseMessage]) -> list[BaseMessage]:
    """Normalize either raw text or messages into a message list."""
    if isinstance(prompt, str):
        return [HumanMessage(content=prompt)]
    return list(prompt)


class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_response(
        self,
        prompt: str | Sequence[BaseMessage],
        *,
        tools: Iterable[Any] | None = None,
    ) -> AIMessage:
        """Generate a response for a prompt or message history."""

    @abstractmethod
    def call_with_tools(
        self,
        messages: Sequence[BaseMessage],
        tools: Iterable[Any],
    ) -> AIMessage:
        """Invoke the model with structured tool definitions."""
