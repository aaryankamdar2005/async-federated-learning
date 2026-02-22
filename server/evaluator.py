# server/evaluator.py
import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
from models import RobustCNN, restore_1d_to_model

class Evaluator:
    def __init__(self):
        # Server-side Secret Golden Dataset initialization
        print("[Server] Initializing Zero-Trust Golden Dataset...")
        transform = transforms.Compose([
            transforms.ToTensor(), 
            transforms.Normalize((0.1307,), (0.3081,))
        ])
        
        # We use a 1,000 image subset of MNIST Test for lightning-fast verification
        test_dataset = datasets.MNIST('../data', train=False, download=True, transform=transform)
        subset = torch.utils.data.Subset(test_dataset, list(range(2000)))
        self.golden_dataloader = DataLoader(subset, batch_size=64, shuffle=False)
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def evaluate_accuracy(self, model: torch.nn.Module):
        model.to(self.device)
        model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for inputs, targets in self.golden_dataloader:
                inputs, targets = inputs.to(self.device), targets.to(self.device)
                outputs = model(inputs)
                _, predicted = torch.max(outputs.data, 1)
                total += targets.size(0)
                correct += (predicted == targets).sum().item()
                
        return correct / total

    def verify_update(self, global_1d, weights_delta_1d):
        """
        Zero-Trust Verification: Calculates the real Accuracy Improvement (ΔI).
        The server ignores client-reported accuracy and calculates it here.
        """
        # 1. Evaluate current global model
        model_old = restore_1d_to_model(RobustCNN(), global_1d)
        old_acc = self.evaluate_accuracy(model_old)
        
        # 2. Evaluate proposed updated model (Global + Delta)
        proposed_1d = global_1d + weights_delta_1d
        model_new = restore_1d_to_model(RobustCNN(), proposed_1d)
        new_acc = self.evaluate_accuracy(model_new)
        
        delta_i = new_acc - old_acc
        return delta_i, new_acc