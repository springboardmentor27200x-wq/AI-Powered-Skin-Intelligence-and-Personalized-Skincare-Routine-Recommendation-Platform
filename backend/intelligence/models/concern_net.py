"""
concern_net.py
PyTorch neural network for multi-label skin concern prediction.

Input:  15 structured features from user profile
Output: 10 logits (one per skin concern)
        Apply sigmoid to get probabilities.

Loss function: BCEWithLogitsLoss (combines sigmoid + BCE, numerically stable)
"""
import torch
import torch.nn as nn


# Ordered concern labels - order must match dataset column order
CONCERN_LABELS = [
    "ACNE",
    "HYPERPIGMENTATION",
    "DARK_SPOTS",
    "DRY_SKIN",
    "OILY_SKIN",
    "SENSITIVE_SKIN",
    "WRINKLES",
    "FINE_LINES",
    "REDNESS",
    "UNEVEN_TONE",
]


class ConcernNet(nn.Module):
    """
    3-layer feedforward network for multi-label skin concern prediction.
    Architecture: Input(15) -> FC(64) -> ReLU -> Dropout(0.3) -> FC(32) -> ReLU -> FC(10)
    """

    def __init__(self, input_dim: int = 15, hidden_dim: int = 64, output_dim: int = 10):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, output_dim),
            # No Sigmoid here - BCEWithLogitsLoss expects raw logits
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Run inference and return probabilities (0-1) via sigmoid."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            return torch.sigmoid(logits)
