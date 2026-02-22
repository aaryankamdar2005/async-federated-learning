import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import numpy as np
import os

# Configuration
MAX_WEIGHTS = 500000
from models import RobustCNN

def save_payload(delta_1d, filename):
    payload = {"weights_delta": torch.from_numpy(delta_1d).float()}
    torch.save(payload, filename)
    print(f"📦 Generated: {filename}")

def generate_scenarios():
    print("🚀 Initializing Master Scenario Generator...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    
    # Base model (Starting point)
    model = RobustCNN().to(device)
    
    # Extract starting weights
    start_weights = []
    for param in model.parameters():
        start_weights.append(param.data.cpu().numpy().flatten())
    start_1d = np.concatenate(start_weights)
    start_1d = np.pad(start_1d, (0, MAX_WEIGHTS - len(start_1d)), 'constant')

    # --- SCENARIO 1: THE SPECIALIST (Success ✅) ---
    print("\n🧠 Training Scenario 1: High Quality Contribution...")
    # Train on a good chunk of data to ensure accuracy goes UP
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    train_set = datasets.MNIST('../data', train=True, download=True, transform=transform)
    train_loader = torch.utils.data.DataLoader(torch.utils.data.Subset(train_set, range(1000)), batch_size=32)
    
    optimizer = optim.SGD(model.parameters(), lr=0.1)
    model.train()
    for data, target in train_loader:
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        loss = nn.CrossEntropyLoss()(model(data), target)
        loss.backward()
        optimizer.step()

    trained_weights = np.concatenate([p.data.cpu().numpy().flatten() for p in model.parameters()])
    trained_weights = np.pad(trained_weights, (0, MAX_WEIGHTS - len(trained_weights)), 'constant')
    save_payload(trained_weights - start_1d, "success_update.pth")

    # --- SCENARIO 2: THE LAZY NODE (Failure/Low Quality ❌) ---
    print("\n💤 Generating Scenario 2: Lazy/Noisy Update...")
    # Very tiny random noise - not enough to help, but not enough to be called 'fraud'
    # Server will likely return: "No measurable improvement"
    lazy_delta = np.random.normal(0, 0.0001, size=MAX_WEIGHTS)
    save_payload(lazy_delta, "weak_update.pth")

    # --- SCENARIO 3: THE HACKER (Poisoning Detected ❌) ---
    print("\n💀 Generating Scenario 3: Model Poisoning Attack...")
    # Large, chaotic values designed to scramble the model's brain
    # Server will return: "Fraud Detected: Accuracy dropped"
    poison_delta = np.random.uniform(-5.0, 5.0, size=MAX_WEIGHTS)
    save_payload(poison_delta, "poison_update.pth")

    print("\n✅ All scenarios ready! Use the Client Dashboard to upload them.")

if __name__ == "__main__":
    generate_scenarios()