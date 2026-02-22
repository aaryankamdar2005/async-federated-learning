import torch
import torch.optim as optim
from torchvision import datasets, transforms
from opacus import PrivacyEngine
import requests
import numpy as np
import uuid
import random
import json
import io

from models import RobustCNN, restore_1d_to_model
from standardizer import WeightStandardizer

SERVER_URL = "http://localhost:8000"
REPO_ID = "80df3861"
CLIENT_ID = f"specialist-node-{uuid.uuid4().hex[:4]}"
MODEL_DIM = 500000


def run_trainer():
    print(f"--- Starting Trainer: {CLIENT_ID} ---")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # ==============================
    # FETCH MODEL
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
    # LOAD MODEL
    # ==============================
    model = RobustCNN().to(device)
    model = restore_1d_to_model(model, global_weights_1d)

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

    subset_indices = random.sample(range(len(dataset)), 5000)
    subset = torch.utils.data.Subset(dataset, subset_indices)

    train_loader = torch.utils.data.DataLoader(
        subset,
        batch_size=32,
        shuffle=True
    )

    optimizer = optim.SGD(model.parameters(), lr=0.01)
    privacy_engine = PrivacyEngine()

    model, optimizer, train_loader = privacy_engine.make_private(
        module=model,
        optimizer=optimizer,
        data_loader=train_loader,
        noise_multiplier=0.7,
        max_grad_norm=1.0
    )

    model.train()

    for epoch in range(3):
        print(f"Epoch {epoch+1}/3")
        for data, target in train_loader:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = torch.nn.CrossEntropyLoss()(output, target)
            loss.backward()
            optimizer.step()

    # ==============================
    # PREPARE UPDATE
    # ==============================
    standardizer = WeightStandardizer(target_size=MODEL_DIM)
    updated_1d = standardizer.universal_standardize(model).astype(np.float32)

    if updated_1d.shape[0] != MODEL_DIM:
        print("Dimension mismatch in updated model!")
        return

    delta = updated_1d - global_weights_1d

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