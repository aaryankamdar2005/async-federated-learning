import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
import os

# 1. Define your model
class SimpleCNN(nn.Module):
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 10, kernel_size=5)
        self.conv2 = nn.Conv2d(10, 20, kernel_size=5)
        self.fc1 = nn.Linear(320, 50)
        self.fc2 = nn.Linear(50, 10)

    def forward(self, x):
        x = torch.relu(torch.max_pool2d(self.conv1(x), 2))
        x = torch.relu(torch.max_pool2d(self.conv2(x), 2))
        x = x.view(-1, 320)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return torch.log_softmax(x, dim=1)

# 2. Load your dataset from ./data
# (Assuming the uploaded zip contains MNIST data)
print("Loading dataset...")
transform = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.1307,), (0.3081,))])
train_set = datasets.MNIST('./data', train=True, download=True, transform=transform)
train_loader = torch.utils.data.DataLoader(torch.utils.data.Subset(train_set, range(100)), batch_size=32)

# 3. Train the model
print("Training model...")
model = SimpleCNN()
optimizer = optim.SGD(model.parameters(), lr=0.01)
model.train()

for epoch in range(1):
    for batch_idx, (data, target) in enumerate(train_loader):
        optimizer.zero_grad()
        output = model(data)
        loss = nn.CrossEntropyLoss()(output, target)
        loss.backward()
        optimizer.step()
        if batch_idx % 10 == 0:
            print(f"Epoch {epoch} | Batch {batch_idx} | Loss: {loss.item():.4f}")

# 4. Save the output to output.pth
print("Saving model to output.pth...")
torch.save(model.state_dict(), "output.pth")
print("Done!")
