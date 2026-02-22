# client/trainer.py
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import requests
import numpy as np
import random
import sys
import os

from privacy import PrivacyWrapper
from standardizer import WeightStandardizer

SERVER_URL = "http://localhost:8000"
CLIENT_ID = f"client-node-{random.randint(100, 999)}"

# =========================================================
# AUTONOMOUS DOWNLOAD: GET ARCHITECTURE
# =========================================================
print(f"[{CLIENT_ID}] Requesting model architecture from server...")
response = requests.get(f"{SERVER_URL}/download_architecture")

if response.status_code == 200:
    with open("models.py", "wb") as f:
        f.write(response.content)
    print(f"[{CLIENT_ID}] Successfully downloaded architecture (models.py).")
else:
    print(f"[{CLIENT_ID}] Failed to download architecture.")
    sys.exit(1)

from models import RobustCNN, restore_1d_to_model
# =========================================================

def fetch_global_model():
    print(f"[{CLIENT_ID}] Fetching latest global weights...")
    response = requests.get(f"{SERVER_URL}/get_model")
    data = response.json()
    
    # FIX: Use the actual weights from the server, not zeros!
    global_1d = np.array(data["weights"]) 
    return global_1d, data["version"]

def train_local(global_1d):
    print(f"[{CLIENT_ID}] Preparing local MNIST dataset...")
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    dataset = datasets.MNIST('../data', train=True, download=True, transform=transform)
    
    subset_indices = random.sample(range(len(dataset)), 2000)
    subset = torch.utils.data.Subset(dataset, subset_indices)
    dataloader = DataLoader(subset, batch_size=32, drop_last=True)

    print(f"[{CLIENT_ID}] Setting up Model & Differential Privacy...")
    model = RobustCNN()
    # Start training from the CURRENT global knowledge
    model = restore_1d_to_model(model, global_1d)
    
    optimizer = optim.SGD(model.parameters(), lr=0.01, momentum=0.5)
    criterion = nn.CrossEntropyLoss()

    dp_wrapper = PrivacyWrapper(target_epsilon=10.0)
    model, optimizer, dataloader = dp_wrapper.make_private(model, optimizer, dataloader, epochs=1)

    print(f"[{CLIENT_ID}] Starting local training loop...")
    model.train()
    for batch_idx, (data, target) in enumerate(dataloader):
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        
    print(f"[{CLIENT_ID}] Training complete. Flattening and Standardizing weights...")
    standardizer = WeightStandardizer(target_size=500000)
    
    # Get the inner model from the Opacus wrapper
    clean_model = model._module if hasattr(model, '_module') else model
    
    # FIX: Call 'universal_standardize' to match the new standardizer.py
    updated_1d = standardizer.universal_standardize(clean_model)
    
    return updated_1d

import time # Make sure to add this at the top of your file if it's not there!

import time

def submit_update(updated_1d, old_1d, current_version):
    weight_delta = updated_1d - old_1d
    payload = {
        "client_id": CLIENT_ID,
        "client_version": current_version,
        "weights_delta": weight_delta.tolist()
    }
    
    print(f"[{CLIENT_ID}] Submitting to consensus pool...")
    try:
        response = requests.post(f"{SERVER_URL}/submit_update", json=payload)
        res = response.json()
    except Exception as e:
        print(f"[{CLIENT_ID}] Error connecting to server: {e}")
        return

    # Normalize the status for comparison
    status = str(res.get('status', '')).strip().lower()

    # 7️⃣ POLLING LOOP: Keep terminal active until TTL Watchdog or Threshold merges it
    if status == 'queued' or status == 'pending':
        print(f"[{CLIENT_ID}] {res.get('message', 'Queued for consensus.')}")
        print(f"[{CLIENT_ID}] >>> TERMINAL ACTIVE: Waiting for Consensus merge...")
        
        while True:
            time.sleep(3) # Poll every 3 seconds
            try:
                # Check the dashboard data to see if our ID moved to 'Merged'
                stats_res = requests.get(f"{SERVER_URL}/dashboard_data")
                stats = stats_res.json()
                commits = stats.get('commits', [])
                
                # Search for our latest commit in the history
                my_commit = None
                for c in commits:
                    # Check both 'client_id' and 'client' keys just in case
                    c_id = c.get('client_id') or c.get('client')
                    if c_id == CLIENT_ID:
                        my_commit = c
                        break
                
                if my_commit:
                    current_status = str(my_commit.get('status', ''))
                    if "Merged" in current_status:
                        print(f"\n[{CLIENT_ID}] ✅ SUCCESS: Consensus reached and merged!")
                        print(f"[{CLIENT_ID}] 💰 Bounty Earned: {my_commit.get('bounty', 0)} Tokens")
                        break # Exit loop and close script
                    elif "Rejected" in current_status:
                        print(f"\n[{CLIENT_ID}] ❌ FAILED: Update was rejected by Zero-Trust Evaluator.")
                        print(f"[{CLIENT_ID}] Reason: {my_commit.get('reason', 'Unknown')}")
                        break # Exit loop and close script
                
                # Optional: print a dot to show we are still waiting
                print(".", end="", flush=True)

            except Exception as e:
                # If server is briefly busy/restarting, just keep trying
                continue 
    else:
        # If it wasn't queued (e.g., immediate success or immediate rejection)
        print(f"[{CLIENT_ID}] Final Server Response: {res}")