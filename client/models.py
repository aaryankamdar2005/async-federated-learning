# models.py
import torch
import torch.nn as nn
import torch.nn.functional as F

class RobustCNN(nn.Module):
    def __init__(self):
        super(RobustCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.dropout = nn.Dropout(0.25)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.max_pool2d(x, 2)
        x = F.relu(self.conv2(x))
        x = F.max_pool2d(x, 2)
        x = self.dropout(x)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def restore_1d_to_model(model, weights_1d):
    state_dict = model.state_dict()
    pointer = 0
    for key in sorted(state_dict.keys()):
        num_params = state_dict[key].numel()
        layer_weights = weights_1d[pointer : pointer + num_params]
        state_dict[key] = torch.from_numpy(layer_weights).reshape(state_dict[key].shape)
        pointer += num_params
    model.load_state_dict(state_dict)
    return model