import io
import os
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

def _find_model() -> str:
    models_dir = Path(__file__).parent / "models"
    pt_files = sorted(models_dir.glob("*.pt"))
    if pt_files:
        return str(pt_files[0])
    return str(models_dir / "model.pt")

MODEL_PATH = os.environ.get("MODEL_PATH", _find_model())

app = FastAPI(title="Emotion Detection Model Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model: YOLO | None = None


@app.on_event("startup")
def load_model():
    global model
    print(f"Loading model from {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("Model loaded successfully")


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.7),
    imgsz: int = Form(640),
):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert("RGB")
    img_array = np.array(img)

    results = model.predict(
        source=img_array,
        conf=conf,
        iou=iou,
        imgsz=imgsz,
        verbose=False,
    )

    result = results[0]
    h, w = result.orig_shape

    top_box = None
    if result.boxes and len(result.boxes) > 0:
        best_idx = int(result.boxes.conf.argmax())
        box = result.boxes[best_idx]
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        top_box = {
            "emotion": result.names[int(box.cls[0])],
            "confidence": float(box.conf[0]),
            "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "imageWidth": w,
            "imageHeight": h,
        }

    if top_box:
        return top_box

    return {
        "emotion": None,
        "confidence": None,
        "box": None,
        "imageWidth": w,
        "imageHeight": h,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
