# Emotion Detection AI Companion

A real-time emotion detection app that reads your facial expressions via webcam and responds with jokes, reactions, and soothing messages through an AI chat companion (in Egyptian Arabic).

## Project Structure

```
web/        Next.js frontend + OpenAI chat API
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

On startup it loads `models/exp-5.pt` and serves predictions on `http://localhost:8000`.

To verify it's running:

```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","model_loaded":true}
```

To use a different model file, either rename it to `exp-5.pt` in `model/models/`, or override the path:

```bash
MODEL_PATH=./models/your-model.pt uvicorn server:app --port 8000
```

### 2. Web app (separate terminal)

```bash
cd web
npm install
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
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

1. Webcam captures frames every ~1.5s
2. Frames are sent to the local YOLO model via FastAPI
3. Bounding box is drawn on detected face, colored by emotion
4. Rolling window of 5 predictions determines stable emotion
5. AI companion responds based on emotion:
   - Neutral: tells a joke
   - Happy after joke: tells a similar joke
   - Still neutral after joke: tries a different approach
