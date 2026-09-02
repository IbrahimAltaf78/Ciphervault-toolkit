from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Anomaly(BaseModel):
    category: str = Field(..., description="e.g., 'LSB Analysis', 'EOF Check', 'EXIF Metadata'")
    severity: str = Field(..., description="'LOW', 'MEDIUM', or 'HIGH'")
    description: str = Field(..., description="Human-readable explanation of the anomaly")

class AnalysisReport(BaseModel):
    filename: str
    file_type: str
    probability_score: float = Field(..., ge=0.0, le=1.0, description="Overall probability (0.0 to 1.0) of hidden data")
    is_suspicious: bool
    anomalies: List[Anomaly]
    metadata: Dict[str, Any] = Field(default_factory=dict)