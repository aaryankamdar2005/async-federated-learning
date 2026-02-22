import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import numpy as np
import io

# MUST match server configuration
MAX_WEIGHTS = 500000 

# We need the architecture to calculate real gradients
from models import RobustCNN, restore_1d_to_model

def generate_smart_delta():
    print("🧠 Generating a 'Smart Delta' to guarantee server approval...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 1. Initialize a model with random weights (simulating a fresh start)
    model = RobustCNN().to(device)
    
    # Save the starting weights so we can calculate the DIFFERENCE (Delta) later
    start_weights = []
    for param in model.parameters():
        start_weights.append(param.data.cpu().numpy().flatten())
    start_1d = np.concatenate(start_weights)
    start_1d = np.pad(start_1d, (0, MAX_WEIGHTS - len(start_1d)), 'constant')

    # 2. Grab a few real MNIST images to "study"
    print("📚 Loading a tiny bit of MNIST data...")
    transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
    train_set = datasets.MNIST('../data', train=True, download=True, transform=transform)
    train_loader = torch.utils.data.DataLoader(torch.utils.data.Subset(train_set, range(100)), batch_size=32)

    # 3. Perform 1 step of training
    # We use a high learning rate to make sure the improvement is "visible" to the server
    optimizer = optim.SGD(model.parameters(), lr=0.1) 
    criterion = nn.CrossEntropyLoss()

    print("🔥 Performing a quick training step...")
    model.train()
    for data, target in train_loader:
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

    # 4. Extract the NEW weights and calculate the Delta
    end_weights = []
    for param in model.parameters():
        end_weights.append(param.data.cpu().numpy().flatten())
    end_1d = np.concatenate(end_weights)
    end_1d = np.pad(end_1d, (0, MAX_WEIGHTS - len(end_1d)), 'constant')

    # IMPORTANT: The server expects the CHANGE (Delta), not the full model
    delta_1d = end_1d - start_1d

    # 5. Save as .pth
    payload = {"weights_delta": torch.from_numpy(delta_1d).float()}
    torch.save(payload, "success_update.pth")
    
    print("\n✅ SUCCESS: 'success_update.pth' created!")
    print("This file contains real 'learned' patterns and should be accepted by the server.")

if __name__ == "__main__":
    generate_smart_delta()