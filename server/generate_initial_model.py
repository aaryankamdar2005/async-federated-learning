import torch
import numpy as np
import os

# Configuration matches your server
MAX_WEIGHTS = 500000
from models import RobustCNN

def generate_base_model():
    print("🏢 Orchestrator: Generating Initial Base Model...")
    
    # Create a fresh model with random initialization
    model = RobustCNN()
    
    # Flatten weights to 1D
    weights = []
    for param in model.parameters():
        weights.append(param.data.cpu().numpy().flatten())
    
    weights_1d = np.concatenate(weights)
    
    # Pad to 500,000
    if len(weights_1d) < MAX_WEIGHTS:
        padding = np.zeros(MAX_WEIGHTS - len(weights_1d))
        weights_1d = np.concatenate([weights_1d, padding])
    else:
        weights_1d = weights_1d[:MAX_WEIGHTS]

    # Save as global_base.pth
    # Note: For the INITIAL model, we save the RAW weights, not a delta.
    payload = {"raw_weights": torch.from_numpy(weights_1d).float()}
    torch.save(payload, "global_base.pth")
    
    print("✅ Created 'global_base.pth'.")
    print("Admin can now upload this to 'Initialize' a new repository.")

if __name__ == "__main__":
    generate_base_model()