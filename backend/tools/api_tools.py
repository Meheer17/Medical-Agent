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


def verify_identity(config: ToolingConfig, user_id: int | None = None):
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/auth/verify", headers=config._headers())
        resp.raise_for_status()
        data = resp.json()
        if user_id and data.get("id") != user_id:
            return {"verified": False, "reason": "User mismatch"}
        return {"verified": True, "user": data}


def get_patient_data(config: ToolingConfig, patient_id: int):
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/patients/{patient_id}", headers=config._headers())
        resp.raise_for_status()
        return resp.json()


def analyze_symptoms(config: ToolingConfig, symptoms: str):
    with httpx.Client(timeout=15) as client:
        resp = client.post(f"{config.base_url}/triage/analyze", headers=config._headers(), json={"symptoms": symptoms})
        resp.raise_for_status()
        return resp.json()


def get_doctor_availability(config: ToolingConfig, specialty: str | None = None):
    params = {"specialty": specialty} if specialty else None
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{config.base_url}/doctors/availability", headers=config._headers(), params=params)
        resp.raise_for_status()
        return resp.json()


def verify_insurance(config: ToolingConfig, patient_id: int, policy_number: str):
    with httpx.Client(timeout=15) as client:
        resp = client.post(
            f"{config.base_url}/insurance/verify",
            headers=config._headers(),
            json={"patient_id": patient_id, "policy_number": policy_number},
        )
        resp.raise_for_status()
        return resp.json()


def book_appointment(
    config: ToolingConfig,
    patient_id: int,
    doctor_id: int,
    scheduled_at: str,
    notes: str | None = None,
):
    payload = {"patient_id": patient_id, "doctor_id": doctor_id, "scheduled_at": scheduled_at, "notes": notes}
    with httpx.Client(timeout=15) as client:
        resp = client.post(f"{config.base_url}/appointments/book", headers=config._headers(), json=payload)
        resp.raise_for_status()
        return resp.json()


def make_verify_identity_tool(config: ToolingConfig):
    @tool("verify_identity")
    def verify_identity_tool(user_id: int | None = None):
        """Verify identity via /auth/verify."""
        return verify_identity(config, user_id)

    return verify_identity_tool


def make_get_patient_data_tool(config: ToolingConfig):
    @tool("get_patient_data")
    def get_patient_data_tool(patient_id: int):
        """Fetch patient data via /patients/{id}."""
        return get_patient_data(config, patient_id)

    return get_patient_data_tool


def make_analyze_symptoms_tool(config: ToolingConfig):
    @tool("analyze_symptoms")
    def analyze_symptoms_tool(symptoms: str):
        """Call /triage/analyze to classify urgency."""
        return analyze_symptoms(config, symptoms)

    return analyze_symptoms_tool


def make_get_doctor_availability_tool(config: ToolingConfig):
    @tool("get_doctor_availability")
    def get_doctor_availability_tool(specialty: str | None = None):
        """Call /doctors/availability to list slots."""
        return get_doctor_availability(config, specialty)

    return get_doctor_availability_tool


def make_verify_insurance_tool(config: ToolingConfig):
    @tool("verify_insurance")
    def verify_insurance_tool(patient_id: int, policy_number: str):
        """Call /insurance/verify."""
        return verify_insurance(config, patient_id, policy_number)

    return verify_insurance_tool


def make_book_appointment_tool(config: ToolingConfig):
    @tool("book_appointment")
    def book_appointment_tool(patient_id: int, doctor_id: int, scheduled_at: str, notes: str | None = None):
        """Book appointment via /appointments/book."""
        return book_appointment(config, patient_id, doctor_id, scheduled_at, notes)

    return book_appointment_tool


__all__ = [
    "ToolingConfig",
    "verify_identity",
    "get_patient_data",
    "analyze_symptoms",
    "get_doctor_availability",
    "verify_insurance",
    "book_appointment",
    "make_verify_identity_tool",
    "make_get_patient_data_tool",
    "make_analyze_symptoms_tool",
    "make_get_doctor_availability_tool",
    "make_verify_insurance_tool",
    "make_book_appointment_tool",
]
