"""
Pydantic Schemas for Request & Response Serialization in NeuroAdapt Platform.
Supports Child, Clinician, multi-pathway assignments, and progress telemetry.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str
    age: Optional[int] = 8
    condition: Optional[str] = "Developmental Cognitive Support"
    pathways: Optional[List[str]] = ["adhd"]

class UserResponse(UserBase):
    id: int
    created_at: datetime
    age: Optional[int] = None
    assigned_pathways: Optional[List[str]] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "child"

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str
    age: Optional[int] = 8
    condition: Optional[str] = "Developmental Cognitive Support"
    pathways: Optional[List[str]] = ["adhd"]

class ChildPathwaysUpdateRequest(BaseModel):
    assigned_pathways: List[str]

class SessionCompleteRequest(BaseModel):
    child_id: int
    exercise_id: int
    domain: str
    pathway: Optional[str] = "adhd"
    difficulty: int
    score: int
    accuracy: float
    response_time_ms: float
    errors: int

class PersonalizationPredictRequest(BaseModel):
    domain_idx: int
    prev_difficulty: int
    accuracy: float
    mean_response_time_ms: float
    error_count: int
    rolling_accuracy_5: float
    rolling_rt_ms_5: float
    fatigue_score: Optional[float] = 0.2
    min_bound: Optional[int] = 1
    max_bound: Optional[int] = 10

class ClinicianAISummaryRequest(BaseModel):
    child_id: int
    child_name: str
    age: int
    sessions_completed: int
    recent_accuracy_avg: float
    recent_reaction_time_ms: float
    domain_breakdown: Dict[str, float]
    struggling_domains: List[str]

class ChildCreateRequest(BaseModel):
    name: str
    age: int = 8
    clinician_id: Optional[int] = None
    caregiver_id: Optional[int] = None
    condition: Optional[str] = "Developmental Cognitive Support"
    baseline_score: Optional[int] = 70
    assigned_pathways: Optional[List[str]] = ["adhd"]

class TherapyPlanCreateRequest(BaseModel):
    child_id: int
    clinician_id: Optional[int] = None
    target_pathways: Optional[List[str]] = ["adhd"]
    target_domains: List[str] = ["attention", "working_memory"]
    min_difficulty: int = 1
    max_difficulty: int = 10
    schedule_notes: Optional[str] = "3 sessions per week, 15 minutes each"

class AssignmentCreateRequest(BaseModel):
    child_id: int
    clinician_id: Optional[int] = None
    exercise_id: int
    difficulty: int = 1
    notes: Optional[str] = None

class SessionCompletionPayload(BaseModel):
    child_id: int
    exercise_id: int
    difficulty: int = 1
    score: int = 0
    accuracy: float = 0.0
    response_time_ms: float = 0.0
    errors: int = 0
    assignment_id: Optional[int] = None
    pathway: Optional[str] = None

class VoiceInterviewSubmitPayload(BaseModel):
    child_id: int
    duration_seconds: int = 75
    challenges_completed: int = 3
    overall_accuracy: float = 0.0
    memory_accuracy: float = 0.0
    attention_accuracy: float = 0.0
    reasoning_accuracy: float = 0.0
    response_latency_ms: float = 1400.0
    latency_delta_percent: Optional[float] = 0.0
    adaptive_changes: Optional[Dict[str, Any]] = None
    transcript: Optional[List[Dict[str, Any]]] = None

class TelegramDispatchPayload(BaseModel):
    child_id: int
    message: str
    chat_id: Optional[str] = None
