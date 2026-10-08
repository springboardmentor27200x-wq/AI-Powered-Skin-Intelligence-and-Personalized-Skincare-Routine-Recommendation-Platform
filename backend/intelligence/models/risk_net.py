"""
risk_net.py
PyTorch neural network for multi-label skin risk factor prediction.

Input:  8 lifestyle/environment features
Output: 5 logits (one per risk category)
        Apply sigmoid to get probabilities.

Loss function: BCEWithLogitsLoss
"""
import torch
import torch.nn as nn


# Ordered risk labels - order must match dataset column order
RISK_LABELS = [
    "STRESS",
    "SLEEP",
    "HYDRATION",
    "LIFESTYLE",
    "ENVIRONMENT",
]


class RiskNet(nn.Module):
    """
    2-layer feedforward network for multi-label skin risk prediction.
    Architecture: Input(8) -> FC(32) -> ReLU -> Dropout(0.2) -> FC(5)
    """

    def __init__(self, input_dim: int = 8, hidden_dim: int = 32, output_dim: int = 5):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, output_dim),
            # No Sigmoid - BCEWithLogitsLoss expects raw logits
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Run inference and return probabilities (0-1) via sigmoid."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            return torch.sigmoid(logits)
