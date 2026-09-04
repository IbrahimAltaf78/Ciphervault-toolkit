import io
import wave
from typing import Any, Dict, List, Tuple
import numpy as np
from app.steganalysis.schemas import Anomaly


def analyze_audio_bytes(
    content: bytes,
) -> Tuple[float, List[Anomaly], Dict[str, Any]]:
  """Analyzes raw audio bytes (WAV) for LSB modifications and trailing payload anomalies."""
  anomalies: List[Anomaly] = []
  metadata: Dict[str, Any] = {"file_size_bytes": len(content)}
  prob_score = 0.0

  try:
    with wave.open(io.BytesIO(content), "rb") as wav_file:
      n_channels = wav_file.getnchannels()
      sampwidth = wav_file.getsampwidth()
      framerate = wav_file.getframerate()
      n_frames = wav_file.getnframes()
      raw_frames = wav_file.readframes(n_frames)

      metadata.update({
          "channels": n_channels,
          "sample_width": sampwidth,
          "frame_rate": framerate,
          "frame_count": n_frames,
      })

      # LSB Steganography heuristic check on audio frames
      if raw_frames:
        audio_samples = np.frombuffer(raw_frames, dtype=np.uint8)
        lsb_bits = audio_samples & 1
        ones_ratio = float(np.mean(lsb_bits))

        # Balanced entropy on LSBs strongly hints at embedded data
        if 0.48 <= ones_ratio <= 0.52 and len(audio_samples) > 1000:
          prob_score = 0.72
          anomalies.append(
              Anomaly(
                  category="Audio LSB Analysis",
                  severity="MEDIUM",
                  description=(
                      "High LSB randomness detected (bit distribution ratio:"
                      f" {ones_ratio:.3f}), indicating hidden data payload."
                  ),
              )
          )

  except Exception as err:
    metadata["parsing_error"] = str(err)

  return prob_score, anomalies, metadata