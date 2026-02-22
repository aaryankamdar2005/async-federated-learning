import requests
import numpy as np
import uuid
import json
import io
import time

# =====================================
# CONFIG
# =====================================
SERVER_URL = "http://localhost:8000"
REPO_ID = "80df3861"        # 🔥 change if needed
CLIENT_ID = f"balanced-node-{uuid.uuid4().hex[:4]}"
MODEL_DIM = 500000
LOCAL_STEPS = 5
LEARNING_RATE = 0.001
MAX_NORM = 5.0  # client-side clipping


# =====================================
# FETCH MODEL
# =====================================
def fetch_model():
    try:
        res = requests.get(
            f"{SERVER_URL}/repos/{REPO_ID}/get_model",
            timeout=15
        )

        print("GET Status:", res.status_code)

        if res.status_code != 200:
            print("GET Error:", res.text)
            return None

        return res.json()

    except Exception as e:
        print("Fetch Error:", e)
        return None


# =====================================
# SIMULATED LOCAL TRAINING
# =====================================
def simulate_local_training(global_weights):
    """
    Simulates a realistic local gradient update.
    """
    local_weights = global_weights.copy()

    for _ in range(LOCAL_STEPS):
        # simulate gradient
        gradient = np.random.normal(
            loc=0,
            scale=0.01,
            size=MODEL_DIM
        ).astype(np.float32)

        local_weights -= LEARNING_RATE * gradient

    return local_weights


# =====================================
# CLIP UPDATE NORM
# =====================================
def clip_delta(delta):
    norm = np.linalg.norm(delta)

    if norm > MAX_NORM:
        print(f"[{CLIENT_ID}] Clipping delta (norm {norm:.2f})")
        delta = delta * (MAX_NORM / norm)

    return delta


# =====================================
# SUBMIT UPDATE
# =====================================
def submit_update(delta, version):
    update_dict = {
        "weights_delta": delta.tolist()
    }

    json_bytes = json.dumps(update_dict).encode("utf-8")
    file_like = io.BytesIO(json_bytes)

    files = {
        "file": ("update.json", file_like, "application/json")
    }

    data = {
        "client_id": CLIENT_ID,
        "client_version": str(version)
    }

    try:
        start = time.time()

        res = requests.post(
            f"{SERVER_URL}/repos/{REPO_ID}/submit_update",
            files=files,
            data=data,
            timeout=30
        )

        duration = time.time() - start
        print(f"POST Status: {res.status_code}")
        print(f"Server responded in {duration:.2f}s")
        print("Response:", res.text)

    except Exception as e:
        print("Submission Error:", e)

    finally:
        file_like.close()


# =====================================
# MAIN
# =====================================
def run_client():
    print(f"--- Starting Safe Trainer 3: {CLIENT_ID} ---")

    state = fetch_model()
    if not state:
        return

    global_weights = np.array(state["weights"], dtype=np.float32)
    version = state["version"]

    print(f"[{CLIENT_ID}] Current version:", version)

    # Local training simulation
    updated_weights = simulate_local_training(global_weights)

    # Compute delta
    delta = updated_weights - global_weights

    # Client-side norm clipping
    delta = clip_delta(delta)

    print(f"[{CLIENT_ID}] Delta norm:", np.linalg.norm(delta))

    # Submit
    submit_update(delta, version)


if __name__ == "__main__":
    run_client()