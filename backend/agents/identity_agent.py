from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from backend.tools.api_tools import ToolingConfig, get_patient_data_tool, verify_identity_tool


def build_identity_agent(llm, base_url: str, token: str | None = None) -> AgentExecutor:
    tools = [
        verify_identity_tool.bind(ToolingConfig(base_url, token)),
        get_patient_data_tool.bind(ToolingConfig(base_url, token)),
    ]
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You verify identity and retrieve patient profiles."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    memory = ConversationBufferMemory(return_messages=True, memory_key="chat_history")
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, memory=memory)
