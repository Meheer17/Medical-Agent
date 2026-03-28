from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.memory import ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from backend.tools.api_tools import (
    ToolingConfig,
    make_book_appointment_tool,
    make_get_doctor_availability_tool,
    make_verify_insurance_tool,
)


def build_scheduling_agent(llm, base_url: str, token: str | None = None) -> AgentExecutor:
    config = ToolingConfig(base_url, token)
    tools = [
        make_get_doctor_availability_tool(config),
        make_verify_insurance_tool(config),
        make_book_appointment_tool(config),
    ]
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You find doctors, verify insurance, and book appointments."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    memory = ConversationBufferMemory(return_messages=True, memory_key="chat_history")
    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, memory=memory)
