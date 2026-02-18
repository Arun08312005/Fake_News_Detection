"""
Configuration file for Fake News Detection System
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = os.path.join(BASE_DIR, 'model')

# Create model directory if it doesn't exist
os.makedirs(MODEL_DIR, exist_ok=True)

# Model configuration
MAX_WORDS = 10000
MAX_LEN = 500
EMBEDDING_DIM = 128
FILTERS = 128
KERNEL_SIZE = 5
DENSE_UNITS = 64
DROPOUT_RATE = 0.5

# File paths
MODEL_PATH = os.path.join(MODEL_DIR, 'fake_news_cnn.h5')
TOKENIZER_PATH = os.path.join(MODEL_DIR, 'tokenizer.pkl')

# Dataset paths (update these with your actual paths)
FAKE_DATA_PATH = '/content/fake.csv'
TRUE_DATA_PATH = '/content/true.csv'

# API configuration
DEBUG = True
HOST = '0.0.0.0'
PORT = 5000

# Confidence thresholds
HIGH_CONFIDENCE = 0.8
MEDIUM_CONFIDENCE = 0.6

FAKE_DATA_PATH = os.path.join(BASE_DIR, 'content', 'fake.csv')
TRUE_DATA_PATH = os.path.join(BASE_DIR, 'content', 'true.csv')