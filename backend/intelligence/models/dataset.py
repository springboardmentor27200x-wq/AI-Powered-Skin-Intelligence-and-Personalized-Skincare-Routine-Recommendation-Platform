"""
dataset.py
PyTorch Dataset for skin profile tabular data.
Handles both concern labels (10) and risk labels (5).
"""
import numpy as np
import torch
from torch.utils.data import Dataset


class SkinDataset(Dataset):
    """
    Generic tabular dataset for multi-label skin classification.
    X: float32 feature matrix (N, num_features)
    y: float32 label matrix (N, num_labels)
    """

    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self) -> int:
        return len(self.X)

    def __getitem__(self, idx: int):
        return self.X[idx], self.y[idx]
