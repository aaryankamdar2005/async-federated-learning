"use client";
import React, { useState } from 'react';
import { Play, Upload, Download, Terminal, Loader2, LogOut, Coins } from 'lucide-react';
import AuthWrapper, { User } from "@/components/AuthWrapper";

export default function CloudComputePage() {
  return (
    <AuthWrapper>
      {(user, logout, refreshUser) => <CloudComputeContent user={user} logout={logout} refreshUser={refreshUser} />}
    </AuthWrapper>
  );
}

function CloudComputeContent({ user, logout, refreshUser }: { user: User, logout: () => void, refreshUser: () => void }) {
  const [code, setCode] = useState(`import torch
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
`);
  const [dataset, setDataset] = useState<File | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [logs, setLogs] = useState<string>("");
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!dataset) {
      setError("Please upload a dataset (.zip) first.");
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    setLogs("Initializing cloud compute instance...\nUploading dataset and code...\n");
    setRunId(null);

    const formData = new FormData();
    formData.append("code", code);
    formData.append("dataset", dataset);

    try {
      const res = await fetch("http://localhost:8000/compute/run", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setLogs(prev => prev + "\n--- EXECUTION LOGS ---\n" + data.logs);
        setRunId(data.run_id);
      } else {
        setError(data.message);
        setLogs(prev => prev + "\n--- EXECUTION FAILED ---\n" + data.logs);
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the compute server.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Cloud Compute Simulator</h1>
            <p className="text-muted-foreground">Write your training code, upload your dataset, and get the trained weights (.pth) back.</p>
            <p className="text-xs text-gray-500 mt-2 font-mono">LOGGED IN AS: <span className="text-white">{user.username}</span></p>
          </div>
          <div className="flex items-center gap-4 font-mono">
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-2 rounded-full text-yellow-500 font-bold flex gap-2 items-center">
              <Coins size={18}/> Balance: <span>{user.tokens} TOKENS</span>
            </div>
            <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Code & Dataset */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-blue-400" />
                Training Script (Python)
              </h2>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[400px] bg-black/50 text-green-400 font-mono text-sm p-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                spellCheck="false"
              />
            </div>

            <div className="glass-card p-6 rounded-2xl border border-border">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-400" />
                Dataset Upload (.zip)
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setDataset(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500/10 file:text-blue-400
                    hover:file:bg-blue-500/20 transition-colors"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                The zip file will be extracted to the <code>./data</code> directory in your script's environment.
              </p>
            </div>

            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="w-full primary-button py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Executing on Cloud...
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  Run Compute Job
                </>
              )}
            </button>
          </div>

          {/* Right Column: Logs & Output */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-border h-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-gray-400" />
                Execution Logs
              </h2>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex-1 bg-black/50 rounded-xl border border-border p-4 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap min-h-[300px]">
                {logs || "Waiting for execution..."}
              </div>

              {runId && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-medium mb-2 text-green-400">Job Completed Successfully!</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your model weights have been saved and are ready for download.</p>
                  <a
                    href={`http://localhost:8000/compute/download/${runId}`}
                    download
                    className="inline-flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50 px-6 py-3 rounded-xl font-medium transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    Download output.pth
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
