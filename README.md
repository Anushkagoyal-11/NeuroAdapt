# 🧠 NeuroAdapt — AI-Assisted Developmental Support & Cognitive Rehabilitation

> **A personalized pediatric support and progress-monitoring platform offering specialized intervention pathways for children with ADHD, Dyslexia, and Speech & Language difficulties.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![SQLite / PostgreSQL](https://img.shields.io/badge/Database-SQLite%20%7C%20PostgreSQL-3ECF8E?logo=sqlite)](https://sqlite.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)](https://python.org/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Frontend%20Ready-black?logo=vercel)](https://vercel.com/)

---

> [!NOTE]
> **Clinical Disclaimer**: NeuroAdapt is an assistive developmental support and progress-monitoring platform for children, clinicians, and authorized caregivers. **It is NOT a diagnostic tool** and does not formulate autonomous medical diagnoses or claim to cure any condition.

---

## 📌 Executive Summary

**NeuroAdapt** bridges clinical oversight and engaging home practice through three specialized developmental pathways and multi-pathway personalization:

1. **3 Specialized Intervention Pathways**:
   - 🎯 **ADHD Pathway**: Focus, working memory, organization, sequencing, and cognitive flexibility.
   - 📖 **Dyslexia Pathway**: Letter orientation recognition (b/d/p/q), phonological awareness, sight word fluency, phoneme spelling, and reading comprehension.
   - 🗣️ **Speech & Language Pathway**: Expressive vocabulary, grammatical sentence construction, auditory comprehension, and phoneme speech sound practice.
2. **Multi-Pathway Personalization**: Children with overlapping profiles (e.g. ADHD + Dyslexia) receive personalized activities and unified progress monitoring across all assigned pathways simultaneously.
3. **Interactive Hands-On Activities**: Real interactive games with instructions, tactile controls, real-time scoring, accuracy percentage, and reaction latency telemetry.
4. **Clinician Telemetry & Safety Corridors**: Longitudinal patient monitoring, prescription assignments, and strict Min/Max difficulty limits that prevent over-challenging or frustration.
5. **AI Clinical Decision Support**: Telemetry summarization, cognitive fatigue detection, AI voice interviews, parent progress dispatch, and downloadable clinical PDF reports.

---

## 🧭 The Three Specialized Pathways

```
                                 ┌──────────────────────────────────┐
                                 │   NeuroAdapt Unified Platform    │
                                 └─────────────────┬────────────────┘
                                                   │
                ┌──────────────────────────────────┼──────────────────────────────────┐
                │                                  │                                  │
                ▼                                  ▼                                  ▼
      ┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
      │   ADHD Pathway   │               │ Dyslexia Pathway │               │  Speech Pathway  │
      └────────┬─────────┘               └────────┬─────────┘               └────────┬─────────┘
               │                                  │                                  │
    • Focus Matrix (Attention)         • Letter Detective (b/d/p/q)        • Picture Word Explorer
    • Memory Card Flip (Memory)        • Phonics Sound Blend (Rhyme)       • Sentence Builder (Grammar)
    • Sequencer (Organization)         • Sight Word Sprint (Fluency)       • Auditory Listening Quest
    • Rule Switcher (Flexibility)      • Word Builder Scramble             • Sound Articulator (TTS)
               │                                  │                                  │
               └──────────────────────────────────┼──────────────────────────────────┘
                                                   │
                                                   ▼
                         ┌──────────────────────────────────────────────────┐
                         │   Multi-Pathway Personalization Engine           │
                         │   • Overlapping assignments (e.g. ADHD+Dyslexia) │
                         │   • Clinician safety corridor (Min/Max bound)    │
                         │   • Telemetry: accuracy, latency, score, errors  │
                         └──────────────────────────────────────────────────┘
```

### 1. 🎯 ADHD Pathway
* **Target Skills**: Sustained visual attention, selective focus, working memory span, pattern sequencing, and cognitive set-shifting.
* **Featured Interactive Exercises**:
  * **Focus Matrix**: Rapid visual search and target discrimination among distractors with millisecond latency logging.
  * **Card Memory Flip**: Paired spatial-visual memory matching.
  * **Step & Number Sequencer**: Numerical and sequential order training.
  * **Rule Switcher**: Cognitive flexibility task requiring rapid shifts between sorting rules (color vs. shape).

### 2. 📖 Dyslexia Pathway
* **Target Skills**: Orthographic discrimination, sound-letter correspondence, phonological rhyming, sight word recognition, spelling, and reading comprehension.
* **Featured Interactive Exercises**:
  * **Letter Detective**: Visual orientation discrimination targeting frequently confused mirror glyphs (**b**, **d**, **p**, **q**).
  * **Phonics Sound Blend**: Rhyming identification and phoneme-sound blending.
  * **Sight Word Sprint**: High-frequency word flash recognition.
  * **Word Builder Scramble**: Phoneme tile sequencing and spelling.
  * **Story Quest**: Age-appropriate micro-stories with reading comprehension checks.

### 3. 🗣️ Speech & Language Pathway
* **Target Skills**: Expressive vocabulary, semantic categorization, sentence syntax/grammar, receptive auditory processing, and speech articulation.
* **Featured Interactive Exercises**:
  * **Picture Word Explorer**: Visual object naming and semantic category classification.
  * **Sentence Builder**: Word-tile arrangement to form grammatically coherent sentences.
  * **Auditory Listening Quest**: Auditory prompt comprehension and task following.
  * **Speech Sound Articulator**: Model phoneme repetition with Text-to-Speech (TTS) audio models and microphone practice.

---

## 👥 Demo Test Accounts

The platform includes pre-seeded demo accounts for testing child and clinician roles. All accounts use password: `password123`.

| Role | Name | Email | Password | Assigned Pathways |
| :--- | :--- | :--- | :--- | :--- |
| **Child** | Aarav Sharma | `aarav.child@neuroadapt.org` | `password123` | **ADHD + Dyslexia** (Multi-Pathway) |
| **Child** | Leo Miller | `leo.adhd@neuroadapt.org` | `password123` | **ADHD** |
| **Child** | Maya Patel | `maya.dyslexia@neuroadapt.org` | `password123` | **Dyslexia** |
| **Child** | Samira Khan | `sam.speech@neuroadapt.org` | `password123` | **Speech & Language** |
| **Child** | Demo Child | `child@neuroadapt.org` | `password123` | **ADHD + Dyslexia + Speech** |
| **Clinician** | Dr. Rajesh Mehta | `dr.mehta@neuroadapt.org` | `password123` | Supervising Clinician |
| **Clinician** | Dr. Sarah Jenkins | `clinician@neuroadapt.org` | `password123` | Supervising Clinician |
| **Admin** | Rehab Center Admin | `admin@neuroadapt.org` | `password123` | Platform Administrator |

> *Tip: The `/auth` page includes 1-click test buttons that automatically populate credentials for each demo persona.*

---

## 🌐 Deploying to Vercel (Frontend)

NeuroAdapt is structured as a monorepo containing `frontend/` (Next.js) and `backend/` (FastAPI). When deploying the frontend to Vercel:

### 1. In Vercel Project Setup:
1. In the **"Configure Project"** screen, locate **Root Directory** and click **Edit**.
2. Set the root directory to:
   ```text
   frontend
   ```
3. Click **Continue** / **Save**.

### 2. Build & Development Settings (Auto-Detected):
- **Framework Preset**: `Next.js`
- **Build Command**: `next build --webpack` *(or leave default `npm run build`)*
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Environment Variables:
Under **Environment Variables** in Vercel, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-api.com` | URL of your deployed FastAPI backend *(or `http://localhost:8000` for local dev)* |

### 4. Updating an Existing Vercel Project:
If your project is already connected on Vercel:
1. Go to **Project Settings** → **General**.
2. Scroll to **Root Directory**, click **Edit**, type `frontend`, and click **Save**.
3. Go to **Deployments** and click **Redeploy**.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.17+
- **Python**: v3.9+
- **Git**

### 2. Backend Setup (FastAPI)
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server (auto-seeds database on first run)
uvicorn app.main:app --reload --port 8000
```
*Backend API docs will be available at:* [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup (Next.js)
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
*Frontend will be running at:* [http://localhost:3000](http://localhost:3000)

- **Sign In / Portal Selector**: [http://localhost:3000/auth](http://localhost:3000/auth)
- **Child Dashboard**: [http://localhost:3000/child](http://localhost:3000/child)
- **Clinician Dashboard**: [http://localhost:3000/clinician](http://localhost:3000/clinician)

---

## 🧪 Testing & Verification

NeuroAdapt includes a comprehensive 10-point automated end-to-end integration test suite verifying authentication, multi-pathway aggregation, single-pathway isolation, session telemetry, and clinician management:

```bash
# Run backend end-to-end integration tests
python backend/test_e2e_full.py

# Verify frontend production build
cd frontend && npm run build
```

---

## 💻 Tech Stack

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router) + Webpack | Responsive child and clinician dashboards, dynamic routing |
| **UI & Styling** | React 19 + TypeScript + Tailwind CSS | Type-safe components, accessibility tokens, tactile controls |
| **Audio & Speech** | Web Speech API + HTML5 Audio | Speech articulation models, text-to-speech cues |
| **Backend API** | FastAPI + Python 3.9+ | High-throughput asynchronous REST API, JWT auth, RBAC |
| **Database** | SQLite (Local fallback) / PostgreSQL | Resilient multi-environment persistence for patients & sessions |
| **Clinical Reporting** | ReportLab (Python) | PDF export with telemetry charts, benchmarks, and notes |
| **AI Decision Support** | Mistral Large API (Optional) | Clinical observation synthesis and parent summary drafting |

---

## 📄 License
This project is licensed under the MIT License.
