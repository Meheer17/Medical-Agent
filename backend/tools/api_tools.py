import httpx
from langchain_core.tools import tool


class ToolingConfig:
    def __init__(self, base_url: str, token: str | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self.token = token

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers


@tool("verify_identity")
def verify_identity_tool(config: ToolingConfig, user_id: int | None = None):
    """Verify identity via /auth/verify."""
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/auth/verify", headers=config._headers())
        resp.raise_for_status()
        data = resp.json()
        if user_id and data.get("id") != user_id:
            return {"verified": False, "reason": "User mismatch"}
        return {"verified": True, "user": data}


@tool("get_patient_data")
def get_patient_data_tool(config: ToolingConfig, patient_id: int):
    """Fetch patient data via /patients/{id}."""
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/patients/{patient_id}", headers=config._headers())
        resp.raise_for_status()
        return resp.json()


@tool("analyze_symptoms")
def analyze_symptoms_tool(config: ToolingConfig, symptoms: str):
    """Call /triage/analyze to classify urgency."""
    with httpx.Client(timeout=15) as client:
        resp = client.post(f"{config.base_url}/triage/analyze", headers=config._headers(), json={"symptoms": symptoms})
        resp.raise_for_status()
        return resp.json()


@tool("get_doctor_availability")
def get_doctor_availability_tool(config: ToolingConfig, specialty: str | None = None):
    """Call /doctors/availability to list slots."""
    params = {"specialty": specialty} if specialty else None
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/doctors/availability", headers=config._headers(), params=params)
        resp.raise_for_status()
        return resp.json()


@tool("verify_insurance")
def verify_insurance_tool(config: ToolingConfig, patient_id: int, policy_number: str):
    """Call /insurance/verify."""
    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{config.base_url}/insurance/verify",
            headers=config._headers(),
            json={"patient_id": patient_id, "policy_number": policy_number},
        )
        resp.raise_for_status()
        return resp.json()


@tool("book_appointment")
def book_appointment_tool(config: ToolingConfig, patient_id: int, doctor_id: int, scheduled_at: str, notes: str | None = None):
    """Book appointment via /appointments/book."""
    payload = {"patient_id": patient_id, "doctor_id": doctor_id, "scheduled_at": scheduled_at, "notes": notes}
    with httpx.Client(timeout=15) as client:
        resp = client.post(f"{config.base_url}/appointments/book", headers=config._headers(), json=payload)
        resp.raise_for_status()
        return resp.json()


__all__ = [
    "ToolingConfig",
    "verify_identity_tool",
    "get_patient_data_tool",
    "analyze_symptoms_tool",
    "get_doctor_availability_tool",
    "verify_insurance_tool",
    "book_appointment_tool",
]
