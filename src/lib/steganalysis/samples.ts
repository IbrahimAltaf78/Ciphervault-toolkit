/**
 * The two reports behind "Sample: carrier" and "Sample: clean".
 *
 * Real engine output, not invented figures: backend/tests/samples/
 * stego/stego_image.png and clean/clean_image.png, run through
 * app/steganalysis/engine.py and saved here so the dashboard can be shown
 * without the backend running. Regenerate them if the engine changes.
 */
import type { AnalysisReport } from "./types";

export const SAMPLE_CARRIER_REPORT: AnalysisReport = {
  "histograms": {
    "red": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 211, 424, 778, 1661, 2424, 2520, 2654, 3840, 4494, 4871, 4690, 3931, 3561, 4224, 5008, 5838, 5715, 4570, 3315, 2397, 1527, 1146, 1160, 1257, 1199, 1005, 785, 668, 474, 204, 118, 58, 32, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "green": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 80, 212, 383, 972, 2213, 2860, 3646, 3873, 3744, 3554, 3683, 5001, 8745, 12259, 9772, 5780, 3935, 3329, 2140, 571, 43, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "blue": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 55, 232, 604, 1065, 2179, 2990, 2668, 3429, 3851, 4428, 6263, 7237, 6749, 6625, 5618, 5325, 5507, 4641, 3094, 1512, 1155, 850, 512, 177, 23, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  "file": {
    "name": "stego_image.png",
    "type": "image/png",
    "size": "115.8 KB",
    "dimensions": "320 × 240",
    "analyzedAt": "10/09/2026, 18:00:00"
  },
  "fileName": "stego_image.png",
  "fileType": "image/png",
  "fileSize": "115.8 KB",
  "dimensions": "320 × 240",
  "analyzedAt": "10/09/2026, 18:00:00",
  "threatLevel": "CRITICAL THREAT",
  "embeddingLikelihood": 99,
  "summary": "Carries a CipherVault LSB payload of 77 bytes.",
  "lsbDistribution": {
    "red": {
      "zero": 49.9,
      "one": 50.1,
      "lsb0": 49.9,
      "lsb1": 50.1
    },
    "green": {
      "zero": 50.0,
      "one": 50.0,
      "lsb0": 50.0,
      "lsb1": 50.0
    },
    "blue": {
      "zero": 50.2,
      "one": 49.8,
      "lsb0": 50.2,
      "lsb1": 49.8
    }
  },
  "channels": [
    {
      "name": "Red",
      "lsb0": 49.9,
      "lsb1": 50.1,
      "zero": 49.9,
      "one": 50.1
    },
    {
      "name": "Green",
      "lsb0": 50.0,
      "lsb1": 50.0,
      "zero": 50.0,
      "one": 50.0
    },
    {
      "name": "Blue",
      "lsb0": 50.2,
      "lsb1": 49.8,
      "zero": 50.2,
      "one": 49.8
    }
  ],
  "tests": [
    {
      "id": "toolkit-signature",
      "name": "CipherVault signature",
      "description": "Reads the LSB, DCT and DWT channels the way this toolkit's extractors do and looks for their end marker.",
      "value": "LSB: 77-byte payload",
      "score": 100,
      "status": "critical"
    },
    {
      "id": "leading-rows",
      "name": "Leading rows",
      "description": "Measures the embedding rate row by row from the top, where sequential tools start writing.",
      "value": "no leading payload rows",
      "score": 0,
      "status": "clean"
    },
    {
      "id": "chi-square",
      "name": "Chi-square attack",
      "description": "Pairs-of-values test over every pixel: near 1 when LSB replacement has evened out value pairs.",
      "value": "p = 0.0000",
      "score": 0,
      "status": "clean"
    },
    {
      "id": "rs-analysis",
      "name": "RS analysis",
      "description": "Estimates the replaced share of LSBs from how pixel groups respond to flipping.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    },
    {
      "id": "sample-pairs",
      "name": "Sample pairs",
      "description": "Estimates the replaced share of LSBs from the structure of adjacent pixel pairs.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    },
    {
      "id": "weighted-stego",
      "name": "Weighted stego",
      "description": "Estimates the replaced share of LSBs by predicting each pixel from its neighbours.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    }
  ],
  "anomalies": []
};

export const SAMPLE_CLEAN_REPORT: AnalysisReport = {
  "histograms": {
    "red": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 211, 424, 778, 1661, 2424, 2520, 2654, 3840, 4494, 4871, 4690, 3931, 3561, 4224, 5008, 5838, 5715, 4570, 3315, 2397, 1527, 1146, 1160, 1257, 1199, 1005, 785, 668, 474, 204, 118, 58, 32, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "green": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 80, 212, 383, 972, 2213, 2860, 3646, 3873, 3744, 3554, 3683, 5001, 8745, 12259, 9772, 5780, 3935, 3329, 2140, 571, 43, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "blue": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 55, 232, 604, 1065, 2179, 2990, 2668, 3429, 3851, 4428, 6263, 7237, 6749, 6625, 5618, 5325, 5507, 4641, 3094, 1512, 1155, 850, 512, 177, 23, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  "file": {
    "name": "clean_image.png",
    "type": "image/png",
    "size": "115.8 KB",
    "dimensions": "320 × 240",
    "analyzedAt": "10/09/2026, 18:00:00"
  },
  "fileName": "clean_image.png",
  "fileType": "image/png",
  "fileSize": "115.8 KB",
  "dimensions": "320 × 240",
  "analyzedAt": "10/09/2026, 18:00:00",
  "threatLevel": "CLEAN",
  "embeddingLikelihood": 3,
  "summary": "No test found a payload. Scattered payloads under ~5% of capacity cannot be ruled out.",
  "lsbDistribution": {
    "red": {
      "zero": 49.8,
      "one": 50.2,
      "lsb0": 49.8,
      "lsb1": 50.2
    },
    "green": {
      "zero": 50.0,
      "one": 50.0,
      "lsb0": 50.0,
      "lsb1": 50.0
    },
    "blue": {
      "zero": 50.1,
      "one": 49.9,
      "lsb0": 50.1,
      "lsb1": 49.9
    }
  },
  "channels": [
    {
      "name": "Red",
      "lsb0": 49.8,
      "lsb1": 50.2,
      "zero": 49.8,
      "one": 50.2
    },
    {
      "name": "Green",
      "lsb0": 50.0,
      "lsb1": 50.0,
      "zero": 50.0,
      "one": 50.0
    },
    {
      "name": "Blue",
      "lsb0": 50.1,
      "lsb1": 49.9,
      "zero": 50.1,
      "one": 49.9
    }
  ],
  "tests": [
    {
      "id": "toolkit-signature",
      "name": "CipherVault signature",
      "description": "Reads the LSB, DCT and DWT channels the way this toolkit's extractors do and looks for their end marker.",
      "value": "no end marker",
      "score": 0,
      "status": "clean"
    },
    {
      "id": "leading-rows",
      "name": "Leading rows",
      "description": "Measures the embedding rate row by row from the top, where sequential tools start writing.",
      "value": "no leading payload rows",
      "score": 0,
      "status": "clean"
    },
    {
      "id": "chi-square",
      "name": "Chi-square attack",
      "description": "Pairs-of-values test over every pixel: near 1 when LSB replacement has evened out value pairs.",
      "value": "p = 0.0000",
      "score": 0,
      "status": "clean"
    },
    {
      "id": "rs-analysis",
      "name": "RS analysis",
      "description": "Estimates the replaced share of LSBs from how pixel groups respond to flipping.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    },
    {
      "id": "sample-pairs",
      "name": "Sample pairs",
      "description": "Estimates the replaced share of LSBs from the structure of adjacent pixel pairs.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    },
    {
      "id": "weighted-stego",
      "name": "Weighted stego",
      "description": "Estimates the replaced share of LSBs by predicting each pixel from its neighbours.",
      "value": "rate 0.000 bits/sample",
      "score": 3,
      "status": "clean"
    }
  ],
  "anomalies": []
};
