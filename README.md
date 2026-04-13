# Emotion Detection AI Companion

A real-time emotion detection app that reads your facial expressions via webcam and responds with jokes, reactions, and soothing messages through an AI chat companion (in Egyptian Arabic). It's gamified with a mood score — reach 100 to win, or hit 0 and get a call from مستشفى العباسية.

## Project Structure

```
web/        Next.js 15 frontend + OpenAI chat API (GPT-5.4)
model/      Python FastAPI server running the YOLO emotion model locally
test-api/   Standalone CLI tool for batch-testing against the cloud Ultralytics API
```

## Prerequisites

- **Python 3.10+** (check with `python3 --version`)
- **Node.js 18+** (check with `node --version`)

## Quick Start

### 1. Local model server

```bash
cd model

# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip3 install -r requirements.txt

# Start the server
uvicorn server:app --host 0.0.0.0 --port 8000
```

On startup it auto-detects the first `*.pt` file in `model/models/` and serves predictions on `http://localhost:8000`.

To verify it's running:

```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","model_loaded":true}
```

To use a specific model file, override with the `MODEL_PATH` env var:

```bash
MODEL_PATH=./models/your-model.pt uvicorn server:app --port 8000
```

### 2. Web app (separate terminal)

```bash
cd web
npm install
cp .env.example .env
# Edit .env and set OPENAI_API_KEY and MODEL_API_URL (defaults to http://localhost:8000)
npm run dev
```

Open `http://localhost:3000`, allow camera access, and the AI will start talking.

### 3. Batch prediction tool (optional, uses cloud Ultralytics)

```bash
cd test-api
npm install
cp .env.example .env
# Edit .env and set ULTRALYTICS_API_KEY and ULTRALYTICS_URL
npm run predict -- --dir ./images
```

Results are saved to `test-api/results/`.

## How It Works

1. Webcam captures frames every **100ms** (~10 fps)
2. Frames are sent to the local YOLO model via FastAPI
3. Bounding box is drawn on detected face, colored by emotion
4. Rolling window of **5 predictions** determines stable emotion (majority vote, needs ≥3/5 agreement)
5. AI companion (GPT-5.4, Egyptian Arabic) responds based on emotion:
   - **Neutral** → tells a joke
   - **Happy** after joke → celebrates, marks joke as landed (+15 score)
   - **Still neutral** after 5s → soothes, marks joke as failed (-15 score)
   - Every **3 consecutive failed jokes** → switches joke category entirely
6. Mood score displayed as a progress bar with numeric score (e.g. 65/100)

## Mood Score & Game Mechanics

The app is gamified with a **mood score** (0–100) displayed in the chat header alongside a color-coded progress bar.

### Starting State

| Field | Value |
|---|---|
| Mood score | **50** ("كويس" / good) |
| Mood level | 🙂 Good |

### Score Changes

| Event | Score Change | When It Happens |
|---|---|---|
| Joke lands (you smile) | **+15** | You smile within 5s of seeing the joke |
| Joke fails (no smile) | **-15** | 5 seconds pass without smiling |
| Sustained happiness | **+5** | Every 10 seconds of continuous smiling |

### Mood Levels

| Score Range | Level | Badge | AI Joke Style |
|---|---|---|---|
| 75–100 | مبسوط (great) | 😄 Green | Light jokes, movie quotes, qafashat |
| 55–74 | كويس (good) | 🙂 Blue | Mixed — movies, folk jokes, situational comedy |
| 35–54 | عادي (meh) | 😐 Yellow | Bolder — stand-up comedy, unexpected punchlines |
| 15–34 | مش تمام (low) | 😕 Orange | 🔓 Unlocked: dark comedy, self-deprecating, absurdist |
| 0–14 | محتاج دعم (needs help) | 💙 Red | 🔓🔓 Unlocked: black comedy, surreal, supportive messages before jokes |

### Reaching 100 (Win 🎉)

From the starting score of 50, you need **+50 points**:

- **4 landed jokes in a row**: 50 → 65 → 80 → 95 → 100 (**~25 seconds**)
- **Pure smiling** (no jokes): 10 boosts × 10s = **~100 seconds**
- **Mix**: 2 landed jokes (50 → 80) + 4 happy boosts (40s smiling) → 100

When you hit 100, a **celebration screen** takes over with confetti and a trophy.

### Reaching 0 (Critical 🚨)

From the starting score of 50, you need **-50 points**:

- **4 failed jokes in a row**: 50 → 35 → 20 → 5 → 0 (**~44 seconds**)
- At **3 failures** the AI switches joke category as a last attempt

When you hit 0, an **emergency screen** appears — flashing red lights, ambulance, and a call to مستشفى العباسية (الصحة النفسية).

### Timing Breakdown

| Cycle | Duration | Details |
|---|---|---|
| Joke lands | **~6s** | Joke → smile detected → reaction → 5s cooldown |
| Joke fails | **~11s** | Joke → 5s wait → soothe message → 5s cooldown |
| Happy boost | **10s** | Continuous smiling without interruption |
| Cooldown | **5s** | Pause between joke cycles |

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| AI Chat | OpenAI GPT-5.4 |
| Emotion Model | YOLO (Ultralytics), served via FastAPI |
| Font | Cairo (Arabic) |
| State Management | React useReducer (custom state machine) |
