# client/standardizer.py
import numpy as np
import torch

class WeightStandardizer:
    def __init__(self, target_size=500000):
        self.target_size = target_size

    def universal_standardize(self, model_or_weights):
        raw_weights = []
        if hasattr(model_or_weights, 'parameters'):
            for param in model_or_weights.parameters():
                raw_weights.append(param.data.cpu().numpy().flatten())
        elif isinstance(model_or_weights, dict):
            for key in sorted(model_or_weights.keys()):
                raw_weights.append(model_or_weights[key].cpu().numpy().flatten())
        
        flat_1d = np.concatenate(raw_weights)
        
        # 1. Padding to 500k
        current_size = len(flat_1d)
        if current_size < self.target_size:
            padding = np.zeros(self.target_size - current_size)
            standardized = np.concatenate([flat_1d, padding])
        else:
            standardized = flat_1d[:self.target_size]
            
        # 2. WEIGHT CLIPPING (The "Safe" Normalization)
        # Instead of Z-score, we cap weights between -1 and 1.
        # This prevents "Heterogeneous models" from sending massive values,
        # but keeps the internal math of the CNN intact.
        standardized = np.clip(standardized, -1.0, 1.0)
            
        return standardized