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
    <div className="min-h-screen bg-transparent text-[#E2E8F0] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-[#ffffff]" />
              </div>
              Cloud Compute
            </h1>
            <p className="text-[#64748B] text-sm">Write your training code, upload your dataset, and get the trained weights (.pth) back.</p>
            <p className="text-xs text-[#64748B] mt-2">Logged in as <span className="text-[#E2E8F0] font-semibold">{user.username}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="token-badge px-5 py-2 rounded-xl font-bold flex gap-2 items-center text-sm">
              <Coins size={16}/> {user.tokens} TOKENS
            </div>
            <button onClick={logout} className="p-2.5 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Code & Dataset */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#ffffff]" />
                Training Script (Python)
              </h2>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[400px] bg-[rgba(6,9,26,0.8)] text-[#4ade80] font-mono text-sm p-4 rounded-xl border border-[rgba(255,255,255,0.1)] focus:outline-none focus:ring-2 focus:ring-[rgba(255,255,255,0.3)] focus:border-[rgba(255,255,255,0.3)] resize-none transition-all"
                spellCheck="false"
              />
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#5b7fff]" />
                Dataset Upload (.zip)
              </h2>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setDataset(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-[#64748B]
                    file:mr-4 file:py-2.5 file:px-5
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[rgba(255,255,255,0.1)] file:text-[#5b7fff]
                    hover:file:bg-[rgba(255,255,255,0.2)] file:transition-colors file:cursor-pointer"
                />
              </div>
              <p className="text-xs text-[#64748B] mt-3">
                The zip file will be extracted to the <code className="text-[#ffffff] bg-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded">./data</code> directory in your script&apos;s environment.
              </p>
            </div>

            <button
              onClick={handleRun}
              disabled={isExecuting}
              className="w-full primary-button py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Executing on Cloud...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Run Compute Job
                </>
              )}
            </button>
          </div>

          {/* Right Column: Logs & Output */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl h-full flex flex-col">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#64748B]" />
                Execution Logs
              </h2>
              
              {error && (
                <div className="badge-danger p-4 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="flex-1 bg-[rgba(6,9,26,0.8)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4 overflow-y-auto font-mono text-xs text-[#94a3b8] whitespace-pre-wrap min-h-[300px]">
                {logs || "Waiting for execution..."}
              </div>

              {runId && (
                <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.12)]">
                  <h3 className="text-lg font-medium mb-2 text-[#4ade80]">Job Completed Successfully!</h3>
                  <p className="text-sm text-[#64748B] mb-4">Your model weights have been saved and are ready for download.</p>
                  <a
                    href={`http://localhost:8000/compute/download/${runId}`}
                    download
                    className="inline-flex items-center gap-2 badge-success px-6 py-3 rounded-xl font-medium transition-colors hover:bg-[rgba(34,197,94,0.15)] text-sm"
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
