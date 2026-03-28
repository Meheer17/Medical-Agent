import json
import re

from backend.core.logger import get_logger
from backend.llm.base import BaseLLMProvider
from backend.models.triage_log import TriageLog, UrgencyLevel

logger = get_logger(__name__)


def _extract_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"])
            else:
                parts.append(str(item))
        return "\n".join(parts)
    return str(content)


def rule_based_triage(symptoms: str) -> tuple[UrgencyLevel, str]:
    text = symptoms.lower()
    if "chest pain" in text:
        return UrgencyLevel.URGENT, "Chest pain detected; route to urgent care."
    if "fever" in text and ("3 days" in text or "three days" in text):
        return UrgencyLevel.PRIORITY, "Prolonged fever over 3 days; prioritize."
    return UrgencyLevel.ROUTINE, "Symptoms appear mild; routine scheduling."


def llm_triage(provider: BaseLLMProvider, symptoms: str) -> tuple[UrgencyLevel, str]:
    prompt = (
        "You are a medical triage assistant. Classify the user's symptom text into one urgency level: "
        "urgent, priority, or routine. Return ONLY valid JSON with keys urgency and rationale. "
        "Keep rationale under 40 words.\n"
        f"Symptoms: {symptoms}"
    )

    try:
        response = provider.generate_response(prompt)
        raw_text = _extract_text(response.content)
        match = re.search(r"\{[\s\S]*\}", raw_text)
        if not match:
            raise ValueError("No JSON object found in model response")

        payload = json.loads(match.group(0))
        urgency_raw = str(payload.get("urgency", "")).strip().lower()
        rationale = str(payload.get("rationale", "")).strip()

        urgency_map = {
            "urgent": UrgencyLevel.URGENT,
            "priority": UrgencyLevel.PRIORITY,
            "routine": UrgencyLevel.ROUTINE,
        }
        urgency = urgency_map.get(urgency_raw)
        if not urgency:
            raise ValueError(f"Invalid urgency from model: {urgency_raw}")
        if not rationale:
            rationale = "AI triage completed with limited explanation."
        return urgency, rationale
    except Exception as exc:
        logger.warning("LLM triage failed; falling back to rules", extra={"error": str(exc)})
        return rule_based_triage(symptoms)


def log_triage(db, patient_id: int, symptoms: str, urgency: UrgencyLevel) -> TriageLog:
    entry = TriageLog(patient_id=patient_id, symptoms=symptoms, urgency_level=urgency)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
