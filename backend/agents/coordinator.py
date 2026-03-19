from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough

from backend.agents.identity_agent import build_identity_agent
from backend.agents.scheduling_agent import build_scheduling_agent
from backend.agents.triage_agent import build_triage_agent


class Coordinator:
    def __init__(self, llm, base_url: str, token: str | None = None) -> None:
        self.identity = build_identity_agent(llm, base_url, token)
        self.triage = build_triage_agent(llm, base_url, token)
        self.scheduling = build_scheduling_agent(llm, base_url, token)
        self.memory = ConversationBufferMemory(return_messages=True, memory_key="chat_history")

    def route(self, intent: str) -> AgentExecutor:
        if "identity" in intent:
            return self.identity
        if "triage" in intent:
            return self.triage
        return self.scheduling

    def build(self) -> AgentExecutor:
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a coordinator. Decide which specialist agent to use: identity, triage, or scheduling."
                    " Keep the user updated succinctly.",
                ),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
            ]
        )
        router = RunnablePassthrough()

        def _run(input: dict):
            intent = "scheduling"
            text = input.get("input", "").lower()
            if any(word in text for word in ["login", "verify", "identity", "who am i"]):
                intent = "identity"
            elif any(word in text for word in ["symptom", "pain", "fever", "triage", "urgency"]):
                intent = "triage"
            agent = self.route(intent)
            return agent.invoke(input)

        coordinator = router.with_config({"run": _run})
        memory = self.memory
        return AgentExecutor(agent=coordinator, tools=[], memory=memory, prompt=prompt)
