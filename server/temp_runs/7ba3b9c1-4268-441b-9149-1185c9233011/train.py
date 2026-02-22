import torch
import torch.nn as nn
import torch.optim as optim
import csv
import os

print("Files extracted to ./data:", os.listdir('./data'))

# 1. Load the dataset from the extracted zip
x_data = []
y_data = []
with open('./data/dataset.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        x_data.append([float(row['x'])])
        y_data.append([float(row['y'])])

X = torch.tensor(x_data, dtype=torch.float32)
Y = torch.tensor(y_data, dtype=torch.float32)

# 2. Define a simple Linear Regression model
class SimpleLinear(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = nn.Linear(1, 1)
        
    def forward(self, x):
        return self.linear(x)

model = SimpleLinear()
criterion = nn.MSELoss()
optimizer = optim.SGD(model.parameters(), lr=0.01)

# 3. Train the model
print("Training started...")
for epoch in range(100):
    optimizer.zero_grad()
    outputs = model(X)
    loss = criterion(outputs, Y)
    loss.backward()
    optimizer.step()
    
    if (epoch + 1) % 20 == 0:
        print(f"Epoch {epoch+1}/100, Loss: {loss.item():.4f}")

# 4. Save the model to output.pth
print("Saving model to output.pth...")
torch.save(model.state_dict(), "output.pth")
print("Done! Model saved successfully.")