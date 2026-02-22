import torch
import numpy as np

# Size must match MAX_WEIGHTS (500,000)
MAX_WEIGHTS = 500000

def create_sample_pth():
    # Simulate a trained delta (small random values)
    # In real use, this would be: (trained_weights - global_weights)
    delta = np.random.uniform(-0.01, 0.01, size=MAX_WEIGHTS).astype(np.float32)
    
    # Convert to Torch Tensor
    delta_tensor = torch.from_numpy(delta)
    
    # Save as binary .pth file
    # We save it as a dictionary so the server can easily find the key
    payload = {"weights_delta": delta_tensor}
    torch.save(payload, "update.pth")
    
    print("✅ Successfully created 'update.pth' (Size: ~2MB)")
    print("You can now upload this file in the Client Dashboard.")

if __name__ == "__main__":
    create_sample_pth()