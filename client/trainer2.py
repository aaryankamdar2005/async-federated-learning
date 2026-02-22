import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import requests
import numpy as np
import uuid
import json
import io

from standardizer import WeightStandardizer

SERVER_URL = "http://localhost:8000"
REPO_ID = "80df3861"   # 🔥 PUT YOUR ACTIVE REPO ID HERE
CLIENT_ID = f"alternative-mlp-node-{uuid.uuid4().hex[:4]}"
MODEL_DIM = 500000


# =====================================
# DIFFERENT MODEL ARCHITECTURE (MLP)
# =====================================
class SimpleMLP(nn.Module):
    def __init__(self):
        super(SimpleMLP, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(28*28, 128),
            nn.ReLU(),
            nn.Linear(128, 10)
        )

    def forward(self, x):
        x = x.view(-1, 28*28)
        return self.fc(x)


def run_trainer():
    print(f"--- Starting Trainer 2 (MLP): {CLIENT_ID} ---")

    # ==============================
    # FETCH GLOBAL MODEL
    # ==============================
    try:
        res = requests.get(
            f"{SERVER_URL}/repos/{REPO_ID}/get_model",
            timeout=30
        )

        print("GET Status:", res.status_code)

        if res.status_code != 200:
            print("GET Error:", res.text)
            return

        res = res.json()

    except Exception as e:
        print("Fetch Error:", e)
        return

    global_weights_1d = np.array(res["weights"], dtype=np.float32)
    current_version = res["version"]

    # ==============================
    # TRAIN MLP LOCALLY
    # ==============================
    model = SimpleMLP()
    optimizer = optim.SGD(model.parameters(), lr=0.05)

    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])

    dataset = datasets.MNIST(
        "../data",
        train=True,
        download=True,
        transform=transform
    )

    train_loader = torch.utils.data.DataLoader(
        torch.utils.data.Subset(dataset, range(500)),
        batch_size=32,
        shuffle=True
    )

    model.train()

    for data, target in train_loader:
        optimizer.zero_grad()
        output = model(data)
        loss = nn.CrossEntropyLoss()(output, target)
        loss.backward()
        optimizer.step()

    # ==============================
    # STANDARDIZE TO 500K VECTOR
    # ==============================
    standardizer = WeightStandardizer(target_size=MODEL_DIM)
    updated_1d = standardizer.universal_standardize(model).astype(np.float32)

    if updated_1d.shape[0] != MODEL_DIM:
        print("Dimension mismatch in updated model!")
        return

    delta = updated_1d - global_weights_1d

    # ==============================
    # SUBMIT UPDATE (MULTIPART)
    # ==============================
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
        "client_version": str(current_version)
    }

    response = requests.post(
        f"{SERVER_URL}/repos/{REPO_ID}/submit_update",
        files=files,
        data=data,
        timeout=60
    )

    file_like.close()

    print("POST Status:", response.status_code)
    print("POST Response:", response.text)


if __name__ == "__main__":
    run_trainer()