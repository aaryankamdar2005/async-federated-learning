import requests
import numpy as np
import uuid
import time

# Configuration
SERVER_URL = "http://localhost:8000"
CLIENT_ID = f"test-node-{uuid.uuid4().hex[:4]}"
WEIGHT_SIZE = 500000  # Must match server model size
NOISE_SCALE = 0.001   # Small bounded noise

def get_server_state():
    """Fetch current model from server."""
    try:
        response = requests.get(f"{SERVER_URL}/get_model", timeout=5)
        response.raise_for_status()
        data = response.json()

        if "version" not in data:
            print(f"[{CLIENT_ID}] Invalid response format:", data)
            return None

        return data

    except requests.exceptions.RequestException as e:
        print(f"[{CLIENT_ID}] Server connection error:", e)
        return None


def submit_update(delta, version):
    """Submit safe update to server."""
    payload = {
        "client_id": CLIENT_ID,
        "client_version": version,
        "weights_delta": delta.tolist()
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{SERVER_URL}/submit_update",
            json=payload,
            timeout=10
        )
        duration = time.time() - start_time
        response.raise_for_status()

        print(f"[{CLIENT_ID}] Server responded in {duration:.2f}s")
        return response.json()

    except requests.exceptions.RequestException as e:
        print(f"[{CLIENT_ID}] Submission failed:", e)
        return None


def run_client():
    print(f"--- Starting Client: {CLIENT_ID} ---")

    state = get_server_state()
    if not state:
        print("Failed to fetch server state.")
        return

    version = state["version"]
    print(f"[{CLIENT_ID}] Current Global Version: {version}")

    print(f"[{CLIENT_ID}] Generating bounded test update...")

    # Simulate small gradient update (safe)
    delta = np.random.normal(
        loc=0,
        scale=NOISE_SCALE,
        size=WEIGHT_SIZE
    )

    response = submit_update(delta, version)

    if response:
        print(f"[{CLIENT_ID}] Server Response:", response)


if __name__ == "__main__":
    run_client()