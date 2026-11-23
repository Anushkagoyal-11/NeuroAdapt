"""
Comprehensive Direct End-to-End Test Suite for NeuroAdapt
Tests all authentication, pathways, dashboards, therapy plans, sessions, and database models.
"""

import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from app.database import SessionLocal
from app.models import User, Child, Exercise, SessionRecord, Performance, TherapyPlan
from app.schemas import (
    LoginRequest,
    ChildPathwaysUpdateRequest,
    SessionCompletionPayload,
    TherapyPlanCreateRequest,
)
from app.main import (
    login,
    get_child_dashboard,
    get_clinician_dashboard,
    get_clinician_children,
    get_child_detail,
    update_child_pathways,
    complete_exercise_session,
    save_therapy_plan,
    get_exercises,
    verify_password,
    create_access_token,
    get_current_user_from_token,
    JWT_SECRET,
    JWT_ALGORITHM,
)
from jose import jwt
from fastapi import HTTPException

def run_tests():
    print("=" * 70)
    print("NEUROADAPT END-TO-END INTEGRATION TEST SUITE")
    print("=" * 70)

    db = SessionLocal()

    # 1. Database seed check
    print("\n[TEST 1] Verifying Database Records & Multi-Pathway Catalog...")
    users = db.query(User).all()
    children = db.query(Child).all()
    exercises = db.query(Exercise).all()
    print(f"  ✓ Users count: {len(users)}")
    print(f"  ✓ Children count: {len(children)}")
    print(f"  ✓ Exercises count: {len(exercises)}")
    assert len(users) >= 7, f"Expected >= 7 users, got {len(users)}"
    assert len(children) >= 5, f"Expected >= 5 children, got {len(children)}"
    assert len(exercises) >= 16, f"Expected >= 16 exercises, got {len(exercises)}"

    adhd_ex = [e for e in exercises if e.pathway == "adhd"]
    dys_ex = [e for e in exercises if e.pathway == "dyslexia"]
    speech_ex = [e for e in exercises if e.pathway == "speech"]
    print(f"  ✓ ADHD exercises: {len(adhd_ex)}")
    print(f"  ✓ Dyslexia exercises: {len(dys_ex)}")
    print(f"  ✓ Speech & Language exercises: {len(speech_ex)}")
    assert len(adhd_ex) >= 5, "Missing ADHD exercises"
    assert len(dys_ex) >= 4, "Missing Dyslexia exercises"
    assert len(speech_ex) >= 4, "Missing Speech exercises"

    # 2. Child Login: Aarav (ADHD + Dyslexia)
    print("\n[TEST 2] Testing Child Authentication (Aarav Sharma - ADHD + Dyslexia)...")
    login_req = LoginRequest(email="aarav.child@neuroadapt.org", password="password123")
    child_auth = login(login_req, db=db)
    aarav_token = child_auth["access_token"]
    user_info = child_auth["user"]
    print(f"  ✓ Role: {user_info['role']}")
    print(f"  ✓ User ID: {user_info['id']}")
    print(f"  ✓ Child ID: {user_info['child_id']}")
    print(f"  ✓ Assigned pathways: {user_info['assigned_pathways']}")
    print(f"  ✓ JWT Token issued: {aarav_token[:25]}...")
    assert user_info["role"] == "child"
    assert user_info["child_id"] is not None
    assert "adhd" in user_info["assigned_pathways"]
    assert "dyslexia" in user_info["assigned_pathways"]

    # Test token decode
    decoded = jwt.decode(aarav_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    assert decoded["email"] == "aarav.child@neuroadapt.org"
    assert decoded["role"] == "child"
    print(f"  ✓ JWT Token decoded successfully: email={decoded['email']}, role={decoded['role']}")

    # 3. Clinician Login: Dr. Rajesh Mehta
    print("\n[TEST 3] Testing Clinician Authentication (Dr. Rajesh Mehta)...")
    clin_req = LoginRequest(email="dr.mehta@neuroadapt.org", password="password123", role="clinician")
    clin_auth = login(clin_req, db=db)
    dr_token = clin_auth["access_token"]
    clinician_id = clin_auth["user"]["id"]
    print(f"  ✓ Role: {clin_auth['user']['role']}")
    print(f"  ✓ Clinician User ID: {clinician_id}")
    assert clin_auth["user"]["role"] == "clinician"

    # 4. Role Enforcement & Invalid Password Rejection
    print("\n[TEST 4] Testing Role Enforcement & Invalid Credentials Rejection...")
    # 4a. Role mismatch rejection
    try:
        login(LoginRequest(email="dr.mehta@neuroadapt.org", password="password123", role="child"), db=db)
        assert False, "Expected 403 when clinician attempts child portal login"
    except HTTPException as e:
        print(f"  ✓ Role mismatch correctly rejected with HTTP {e.status_code}: {e.detail}")
        assert e.status_code == 403

    # 4b. Invalid password rejection
    try:
        login(LoginRequest(email="dr.mehta@neuroadapt.org", password="wrongpassword!", role="clinician"), db=db)
        assert False, "Expected HTTPException 401 on wrong password"
    except HTTPException as e:
        print(f"  ✓ Incorrect password correctly rejected with HTTP {e.status_code}: {e.detail}")
        assert e.status_code == 401

    user_id = user_info["id"]
    child_id = user_info["child_id"]

    # 5. Multi-Pathway Child Dashboard (Aarav - ADHD + Dyslexia)
    print("\n[TEST 5] Testing Multi-Pathway Child Dashboard Aggregation (Aarav)...")
    dash = get_child_dashboard(user_id=user_id, db=db)
    pathways = dash["assigned_pathways"]
    print(f"  ✓ Child name: {dash['user']['name']}")
    print(f"  ✓ Assigned pathways: {pathways}")
    print(f"  ✓ Recommended activities count: {len(dash.get('recommended_exercises', []))}")
    assert "adhd" in pathways
    assert "dyslexia" in pathways
    rec_pathways = {ex["pathway"] for ex in dash.get("recommended_exercises", [])}
    print(f"  ✓ Pathways present in recommended exercises: {rec_pathways}")
    assert "adhd" in rec_pathways
    assert "dyslexia" in rec_pathways

    # 6. Dedicated Single-Pathway Child Profiles
    print("\n[TEST 6] Testing Dedicated Single-Pathway Profiles...")
    leo_child = db.query(Child).filter(Child.name == "Leo Miller").first()
    maya_child = db.query(Child).filter(Child.name == "Maya Patel").first()
    sam_child = db.query(Child).filter(Child.name == "Samira Khan").first()

    leo_dash = get_child_dashboard(user_id=leo_child.user_id, db=db)
    maya_dash = get_child_dashboard(user_id=maya_child.user_id, db=db)
    sam_dash = get_child_dashboard(user_id=sam_child.user_id, db=db)

    print(f"  ✓ Leo ({leo_dash['user']['name']}) pathways: {leo_dash['assigned_pathways']}")
    assert leo_dash["assigned_pathways"] == ["adhd"]

    print(f"  ✓ Maya ({maya_dash['user']['name']}) pathways: {maya_dash['assigned_pathways']}")
    assert maya_dash["assigned_pathways"] == ["dyslexia"]

    print(f"  ✓ Samira ({sam_dash['user']['name']}) pathways: {sam_dash['assigned_pathways']}")
    assert sam_dash["assigned_pathways"] == ["speech"]

    # 7. Clinician Dashboard & Cohort Monitoring
    print("\n[TEST 7] Testing Clinician Cohort Dashboard & Patient List...")
    c_dash = get_clinician_dashboard(clinician_id=clinician_id, db=db)
    print(f"  ✓ Total patients: {c_dash['stats']['total_patients']}")
    print(f"  ✓ Total sessions monitored: {c_dash['stats']['total_sessions_monitored']}")
    print(f"  ✓ Cohort accuracy: {c_dash['stats']['avg_cohort_accuracy']}%")

    c_children = get_clinician_children(clinician_id=clinician_id, db=db)
    print(f"  ✓ Patient roster count: {len(c_children)}")
    for p in c_children:
        print(f"    - {p['name']} (ID: #{p['id']}): Pathways={p.get('assigned_pathways', [])}, Sessions={p['total_sessions']}, Acc={p['avg_accuracy']}%")

    # 8. Dynamic Multi-Pathway Assignment by Clinician
    print("\n[TEST 8] Testing Clinician Updating Child Pathways via PUT /api/child/{id}/pathways...")
    update_req = ChildPathwaysUpdateRequest(assigned_pathways=["adhd", "dyslexia", "speech"])
    updated_info = update_child_pathways(child_id=child_id, req=update_req, db=db)
    print(f"  ✓ Updated pathways response: {updated_info['assigned_pathways']}")
    assert set(updated_info["assigned_pathways"]) == {"adhd", "dyslexia", "speech"}

    # Verify updated dashboard now includes speech activities
    dash_updated = get_child_dashboard(user_id=user_id, db=db)
    updated_rec_pathways = {ex["pathway"] for ex in dash_updated.get("recommended_exercises", [])}
    print(f"  ✓ Child now has access to pathways: {updated_rec_pathways}")
    assert "speech" in updated_rec_pathways

    # Revert Aarav back to ["adhd", "dyslexia"]
    revert_req = ChildPathwaysUpdateRequest(assigned_pathways=["adhd", "dyslexia"])
    update_child_pathways(child_id=child_id, req=revert_req, db=db)
    print("  ✓ Aarav pathways successfully reverted back to ['adhd', 'dyslexia']")

    # 9. Session Completion & Telemetry Recording
    print("\n[TEST 9] Testing Interactive Exercise Completion & Session Telemetry Recording...")
    session_payload = SessionCompletionPayload(
        child_id=child_id,
        exercise_id=8, # Dyslexia Letter Detective
        difficulty=2,
        score=140,
        accuracy=88.5,
        response_time_ms=1150.0,
        errors=1,
        pathway="dyslexia",
    )
    sess_data = complete_exercise_session(req=session_payload, db=db)
    print(f"  ✓ Session recorded: ID #{sess_data['session_id']}, score={sess_data['score']}, accuracy={sess_data['accuracy']}%")

    # 10. Therapy Plan Configuration
    print("\n[TEST 10] Testing Clinician Therapy Plan Creation...")
    plan_payload = TherapyPlanCreateRequest(
        child_id=child_id,
        clinician_id=clinician_id,
        target_pathways=["adhd", "dyslexia"],
        target_domains=["attention", "working_memory", "letter_recognition"],
        min_difficulty=1,
        max_difficulty=6,
        schedule_notes="3 home sessions weekly. Emphasize letter orientation."
    )
    plan_data = save_therapy_plan(req=plan_payload, db=db)
    print(f"  ✓ Therapy plan saved: ID #{plan_data['plan']['id']}, target_pathways={plan_data['plan']['target_pathways']}")

    print("\n" + "=" * 70)
    print("ALL 10 END-TO-END INTEGRATION TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
