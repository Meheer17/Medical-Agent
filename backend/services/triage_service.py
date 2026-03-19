from backend.models.triage_log import TriageLog, UrgencyLevel


def rule_based_triage(symptoms: str) -> tuple[UrgencyLevel, str]:
    text = symptoms.lower()
    if "chest pain" in text:
        return UrgencyLevel.URGENT, "Chest pain detected; route to urgent care."
    if "fever" in text and ("3 days" in text or "three days" in text):
        return UrgencyLevel.PRIORITY, "Prolonged fever over 3 days; prioritize."
    return UrgencyLevel.ROUTINE, "Symptoms appear mild; routine scheduling."


def log_triage(db, patient_id: int, symptoms: str, urgency: UrgencyLevel) -> TriageLog:
    entry = TriageLog(patient_id=patient_id, symptoms=symptoms, urgency_level=urgency)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
