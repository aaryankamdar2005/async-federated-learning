import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import zipfile
import os

# Define a simple CNN for 28x28 grayscale images (MNIST / FashionMNIST)
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)
        self.pool = nn.MaxPool2d(2, 2)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = x.view(-1, 64 * 7 * 7)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def train_model(model, train_loader, epochs=1):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    model.train()
    for epoch in range(epochs):
        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
            
            if batch_idx % 100 == 0:
                print(f"Train Epoch: {epoch} [{batch_idx * len(data)}/{len(train_loader.dataset)}] Loss: {loss.item():.6f}")
                # Break early for faster execution in this demo
                if batch_idx >= 200: 
                    break

def main():
    print("Initializing Model...")
    model = SimpleCNN()
    
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    # --- Dataset 1: MNIST ---
    print("\n--- Training on Dataset 1: MNIST ---")
    mnist_train = datasets.MNIST(root='./data', train=True, download=True, transform=transform)
    mnist_loader = torch.utils.data.DataLoader(mnist_train, batch_size=64, shuffle=True)
    
    train_model(model, mnist_loader, epochs=1)
    
    # Save weights for Dataset 1
    file1 = "model_mnist.pth"
    torch.save(model.state_dict(), file1)
    print(f"Saved {file1}")

    # --- Dataset 2: FashionMNIST ---
    print("\n--- Training on Dataset 2: FashionMNIST (Transfer Learning) ---")
    # The model already has the weights from MNIST training
    fashion_train = datasets.FashionMNIST(root='./data', train=True, download=True, transform=transform)
    fashion_loader = torch.utils.data.DataLoader(fashion_train, batch_size=64, shuffle=True)
    
    train_model(model, fashion_loader, epochs=1)
    
    # Save weights for Dataset 2
    file2 = "model_fashion_mnist.pth"
    torch.save(model.state_dict(), file2)
    print(f"Saved {file2}")

    # --- Create ZIP Archive ---
    zip_filename = "trained_models.zip"
    print(f"\n--- Creating ZIP Archive: {zip_filename} ---")
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        zipf.write(file1)
        zipf.write(file2)
    
    print(f"Successfully created {zip_filename} containing {file1} and {file2}")

if __name__ == "__main__":
    main()
