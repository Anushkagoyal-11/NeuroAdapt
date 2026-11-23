"""
Database Seeding and Schema Migration for NeuroAdapt.
Populates standard development & demonstration users, children, pathways,
and interactive exercises for ADHD, Dyslexia, and Speech pathways.
Safe to run repeatedly (idempotent).
"""

import os
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import (
    User,
    Child,
    Exercise,
    TherapyPlan,
    SessionRecord,
    Performance,
    Recommendation,
    Assignment,
    Notification,
)

def create_hash(password: str) -> str:
    """Generate PBKDF2-SHA256 password hash compatible with verify_password."""
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
    return f"pbkdf2_sha256${salt}${dk}"

EXERCISES_DATA = [
    # ── ADHD PATHWAY ──
    {
        "id": 1,
        "name": "Focus Matrix",
        "pathway": "adhd",
        "domain": "attention",
        "difficulty": 1,
        "description": "Visual search and sustained target tracking challenge",
        "instructions": "Locate and tap all target symbols on the grid as quickly and accurately as possible.",
        "configuration": {"grid_size": 3, "time_limit_sec": 30, "target_count": 2},
    },
    {
        "id": 2,
        "name": "Focus Matrix II",
        "pathway": "adhd",
        "domain": "attention",
        "difficulty": 3,
        "description": "Multi-target vigilance with shifting visual distractors",
        "instructions": "Find both target shapes while ignoring distracting color variations on a 4x4 grid.",
        "configuration": {"grid_size": 4, "time_limit_sec": 25, "target_count": 3},
    },
    {
        "id": 3,
        "name": "Memory Flip",
        "pathway": "adhd",
        "domain": "working_memory",
        "difficulty": 1,
        "description": "Visual-spatial card memory match and recall",
        "instructions": "Flip cards to find pairs and remember their locations to clear the board.",
        "configuration": {"cards": 8, "match_type": "shapes"},
    },
    {
        "id": 4,
        "name": "Memory Flip II",
        "pathway": "adhd",
        "domain": "working_memory",
        "difficulty": 4,
        "description": "Delayed multi-symbol recall matrix",
        "instructions": "Remember 8 card pairs with complex symbol pairs under progressive recall delays.",
        "configuration": {"cards": 16, "match_type": "symbols"},
    },
    {
        "id": 5,
        "name": "Step Sequencer",
        "pathway": "adhd",
        "domain": "sequencing",
        "difficulty": 2,
        "description": "Chronological and logical step ordering challenge",
        "instructions": "Order numbered steps and sequential tasks in their proper logical progression.",
        "configuration": {"sequence_length": 4, "type": "numbers_and_steps"},
    },
    {
        "id": 6,
        "name": "Cognitive Switcher",
        "pathway": "adhd",
        "domain": "cognitive_flexibility",
        "difficulty": 2,
        "description": "Rule-switching between shape and color attributes",
        "instructions": "Match cards according to the active rule (Color or Shape). Adapt quickly when the rule switches!",
        "configuration": {"switch_frequency": 3, "rules": ["color", "shape"]},
    },

    # ── DYSLEXIA PATHWAY ──
    {
        "id": 7,
        "name": "Letter Detective",
        "pathway": "dyslexia",
        "domain": "letter_recognition",
        "difficulty": 1,
        "description": "Orientation discrimination for letters b, d, p, and q",
        "instructions": "Find and tap the target letter facing the right way while ignoring mirrored reversals.",
        "configuration": {"target_letters": ["b", "d", "p", "q"], "distractors": True},
    },
    {
        "id": 8,
        "name": "Phonics Sound Blend",
        "pathway": "dyslexia",
        "domain": "phonological",
        "difficulty": 2,
        "description": "Sound-letter association and rhyming awareness",
        "instructions": "Listen to or read the sound prompt and match words that share the same rhyming sound.",
        "configuration": {"sound_type": "rhyme_and_blend", "word_pool_size": 12},
    },
    {
        "id": 9,
        "name": "Sight Word Sprint",
        "pathway": "dyslexia",
        "domain": "word_recognition",
        "difficulty": 1,
        "description": "High-frequency word recognition and reading speed",
        "instructions": "Rapidly recognize and select the target sight word among visually similar options.",
        "configuration": {"grade_level": "elementary", "time_per_word_sec": 8},
    },
    {
        "id": 10,
        "name": "Word Builder Scramble",
        "pathway": "dyslexia",
        "domain": "spelling",
        "difficulty": 2,
        "description": "Phoneme sequencing and spelling puzzle",
        "instructions": "Unscramble the letters in the correct order to spell the word shown in the clue.",
        "configuration": {"word_lengths": [3, 4, 5]},
    },
    {
        "id": 11,
        "name": "Story Quest Comprehension",
        "pathway": "dyslexia",
        "domain": "reading_comprehension",
        "difficulty": 2,
        "description": "Short passage reading and comprehension challenge",
        "instructions": "Read the short illustrated passage and answer the comprehension questions correctly.",
        "configuration": {"passage_length_words": 50, "questions_count": 2},
    },

    # ── SPEECH & LANGUAGE PATHWAY ──
    {
        "id": 12,
        "name": "Picture Word Explorer",
        "pathway": "speech",
        "domain": "vocabulary",
        "difficulty": 1,
        "description": "Expressive vocabulary, object naming, and category classification",
        "instructions": "Look at the picture clue and choose the correct word and category.",
        "configuration": {"categories": ["animals", "foods", "vehicles", "everyday_objects"]},
    },
    {
        "id": 13,
        "name": "Sentence Builder",
        "pathway": "speech",
        "domain": "sentence_construction",
        "difficulty": 2,
        "description": "Construct grammatically complete sentences from word tiles",
        "instructions": "Drag and tap word tiles in the proper order to form a clear, correct sentence.",
        "configuration": {"min_words": 3, "max_words": 6},
    },
    {
        "id": 14,
        "name": "Auditory Listening Quest",
        "pathway": "speech",
        "domain": "listening_comprehension",
        "difficulty": 1,
        "description": "Auditory instruction processing and comprehension",
        "instructions": "Listen to the spoken audio cue and tap the matching item or action.",
        "configuration": {"audio_prompts": True, "pacing": "patient"},
    },
    {
        "id": 15,
        "name": "Speech Sound Articulator",
        "pathway": "speech",
        "domain": "speech_sound",
        "difficulty": 2,
        "description": "Phoneme articulation, sound repetition, and pronunciation",
        "instructions": "Listen to the speech sound model, practice saying the syllables, and test with your voice.",
        "configuration": {"target_phonemes": ["s", "r", "l", "th", "ch"]},
    },
    {
        "id": 16,
        "name": "Conversation Partner",
        "pathway": "speech",
        "domain": "communication",
        "difficulty": 2,
        "description": "Social communication and conversational response choice",
        "instructions": "Read or listen to the conversation scenario and choose the most friendly, helpful response.",
        "configuration": {"scenarios": ["greeting", "asking_help", "sharing", "turn_taking"]},
    },
]

def seed_database(db: Session = None):
    """Seed or update database with necessary initial entities."""
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        # Create tables
        Base.metadata.create_all(bind=engine)

        default_password = "password123"
        hashed = create_hash(default_password)

        # 1. Seed or update Users
        seed_users = [
            {
                "id": 1,
                "name": "Aarav Sharma",
                "email": "aarav.child@neuroadapt.org",
                "role": "child",
                "age": 9,
                "pathways": ["adhd", "dyslexia"],
                "condition": "ADHD & Dyslexia Support",
            },
            {
                "id": 2,
                "name": "Dr. Rajesh Mehta",
                "email": "dr.mehta@neuroadapt.org",
                "role": "clinician",
            },
            {
                "id": 3,
                "name": "Rehab Center Admin",
                "email": "admin@neuroadapt.org",
                "role": "admin",
            },
            {
                "id": 4,
                "name": "Leo Miller",
                "email": "leo.adhd@neuroadapt.org",
                "role": "child",
                "age": 8,
                "pathways": ["adhd"],
                "condition": "ADHD Focus & Attention Training",
            },
            {
                "id": 5,
                "name": "Maya Patel",
                "email": "maya.dyslexia@neuroadapt.org",
                "role": "child",
                "age": 10,
                "pathways": ["dyslexia"],
                "condition": "Dyslexia Reading Support",
            },
            {
                "id": 6,
                "name": "Samira Khan",
                "email": "sam.speech@neuroadapt.org",
                "role": "child",
                "age": 7,
                "pathways": ["speech"],
                "condition": "Speech & Articulation Development",
            },
            {
                "id": 7,
                "name": "Demo Child",
                "email": "child@neuroadapt.org",
                "role": "child",
                "age": 8,
                "pathways": ["adhd", "dyslexia", "speech"],
                "condition": "Multi-Pathway Comprehensive Support",
            },
            {
                "id": 8,
                "name": "Dr. Sarah Jenkins",
                "email": "clinician@neuroadapt.org",
                "role": "clinician",
            },
        ]

        user_id_map = {}
        for u in seed_users:
            existing = db.query(User).filter(User.email == u["email"].lower()).first()
            if not existing:
                new_u = User(
                    name=u["name"],
                    email=u["email"].lower(),
                    hashed_password=hashed,
                    role=u["role"],
                    created_at=datetime.utcnow() - timedelta(days=30),
                )
                db.add(new_u)
                db.flush()
                user_id_map[u["email"]] = new_u.id
            else:
                user_id_map[u["email"]] = existing.id

        clinician_id = user_id_map.get("dr.mehta@neuroadapt.org", 2)

        # 2. Seed or update Children profiles
        child_seed_records = [
            u for u in seed_users if u["role"] == "child"
        ]

        child_id_map = {}
        for c_info in child_seed_records:
            u_id = user_id_map.get(c_info["email"])
            existing_child = db.query(Child).filter(
                (Child.user_id == u_id) | (Child.name == c_info["name"])
            ).first()

            pathways = c_info.get("pathways", ["adhd"])
            if not existing_child:
                new_c = Child(
                    user_id=u_id,
                    caregiver_id=None,
                    clinician_id=clinician_id,
                    name=c_info["name"],
                    age=c_info["age"],
                    assigned_pathways=pathways,
                    profile_data={
                        "condition": c_info["condition"],
                        "baseline_score": 72,
                        "pathways": pathways,
                    },
                    created_at=datetime.utcnow() - timedelta(days=25),
                )
                db.add(new_c)
                db.flush()
                child_id_map[c_info["name"]] = new_c.id
            else:
                # Ensure pathways and user_id are up-to-date
                existing_child.user_id = u_id
                existing_child.assigned_pathways = pathways
                if not existing_child.profile_data:
                    existing_child.profile_data = {}
                existing_child.profile_data["pathways"] = pathways
                existing_child.profile_data["condition"] = c_info["condition"]
                child_id_map[c_info["name"]] = existing_child.id

        db.commit()

        # 3. Seed Exercises
        for ex_info in EXERCISES_DATA:
            existing_ex = db.query(Exercise).filter(Exercise.name == ex_info["name"]).first()
            if not existing_ex:
                new_ex = Exercise(
                    id=ex_info["id"],
                    name=ex_info["name"],
                    pathway=ex_info["pathway"],
                    domain=ex_info["domain"],
                    difficulty=ex_info["difficulty"],
                    description=ex_info["description"],
                    instructions=ex_info["instructions"],
                    configuration=ex_info["configuration"],
                )
                db.add(new_ex)
            else:
                existing_ex.pathway = ex_info["pathway"]
                existing_ex.domain = ex_info["domain"]
                existing_ex.description = ex_info["description"]
                existing_ex.instructions = ex_info["instructions"]

        db.commit()

        # 4. Seed Therapy Plans
        for c_name, c_id in child_id_map.items():
            child_obj = db.query(Child).filter(Child.id == c_id).first()
            if not child_obj:
                continue
            plan = db.query(TherapyPlan).filter(TherapyPlan.child_id == c_id).first()
            pathways = child_obj.assigned_pathways or ["adhd"]
            domains = []
            if "adhd" in pathways:
                domains.extend(["attention", "working_memory", "sequencing"])
            if "dyslexia" in pathways:
                domains.extend(["letter_recognition", "phonological", "reading_comprehension"])
            if "speech" in pathways:
                domains.extend(["vocabulary", "sentence_construction", "speech_sound"])

            if not plan:
                new_plan = TherapyPlan(
                    child_id=c_id,
                    clinician_id=clinician_id,
                    target_pathways=pathways,
                    target_domains=domains or ["attention", "working_memory"],
                    min_difficulty=1,
                    max_difficulty=6,
                    schedule_notes=f"Personalized schedule for {', '.join(pathways).upper()}: 3 sessions/week",
                    created_at=datetime.utcnow() - timedelta(days=20),
                )
                db.add(new_plan)
            else:
                plan.target_pathways = pathways
                plan.target_domains = domains or plan.target_domains

        db.commit()

        # 5. Seed historical sessions for Aarav Sharma (ADHD + Dyslexia) if none exist
        aarav_id = child_id_map.get("Aarav Sharma")
        if aarav_id:
            existing_sessions = db.query(SessionRecord).filter(SessionRecord.child_id == aarav_id).count()
            if existing_sessions == 0:
                sample_exercises = [
                    (1, "adhd", 85, 120, 1800, 1, 3), # Focus Matrix
                    (7, "dyslexia", 90, 150, 1600, 1, 2), # Letter Detective
                    (3, "adhd", 78, 110, 2100, 2, 2), # Memory Flip
                    (8, "dyslexia", 82, 130, 1900, 2, 1), # Phonics Sound Blend
                    (5, "adhd", 88, 140, 1750, 2, 0), # Step Sequencer
                    (10, "dyslexia", 92, 160, 1500, 2, 0), # Word Builder
                ]
                now = datetime.utcnow()
                for i, (ex_id, p_way, acc, sc, rt, diff, days_ago) in enumerate(sample_exercises):
                    sess_time = now - timedelta(days=days_ago, hours=2 * i)
                    s = SessionRecord(
                        child_id=aarav_id,
                        exercise_id=ex_id,
                        started_at=sess_time,
                        completed_at=sess_time + timedelta(minutes=4),
                    )
                    db.add(s)
                    db.flush()

                    p = Performance(
                        session_id=s.id,
                        score=sc,
                        accuracy=float(acc),
                        response_time=float(rt),
                        errors=max(0, int((100 - acc) / 10)),
                        difficulty=diff,
                    )
                    db.add(p)

                # Add an active assignment for Aarav
                assign = Assignment(
                    child_id=aarav_id,
                    clinician_id=clinician_id,
                    exercise_id=7, # Letter Detective
                    difficulty=2,
                    status="pending",
                    notes="Practice letter orientation discrimination for b and d.",
                    assigned_date=now - timedelta(hours=6),
                )
                db.add(assign)

                # Add a notification
                notif = Notification(
                    user_id=user_id_map.get("aarav.child@neuroadapt.org", 1),
                    title="New Assignment from Dr. Rajesh Mehta",
                    message="Dr. Rajesh Mehta assigned Letter Detective (Dyslexia Pathway • Level 2).",
                    type="assignment",
                    link="/child",
                    is_read=False,
                    created_at=now - timedelta(hours=6),
                )
                db.add(notif)
                db.commit()

        print("[NeuroAdapt Seed] Database successfully initialized with multi-pathway catalog and demo accounts.")
    except Exception as e:
        db.rollback()
        print(f"[NeuroAdapt Seed] Notice: Seeding handled exception: {e}")
    finally:
        if should_close:
            db.close()

if __name__ == "__main__":
    seed_database()
