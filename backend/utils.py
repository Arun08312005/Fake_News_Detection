"""
Utility functions for Fake News Detection System
"""

import re
import string
import pickle
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences

class TextPreprocessor:
    """Handles text preprocessing for fake news detection"""
    
    def __init__(self, max_words=10000, max_len=500):
        self.max_words = max_words
        self.max_len = max_len
        self.tokenizer = None
    
    def clean_text(self, text):
        """
        Clean and preprocess text
        """
        if not isinstance(text, str):
            text = str(text)
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation
        text = re.sub(f'[{re.escape(string.punctuation)}]', '', text)
        
        # Remove extra whitespaces
        text = ' '.join(text.split())
        
        # Remove digits
        text = re.sub(r'\d+', '', text)
        
        return text
    
    def preprocess_for_prediction(self, text, tokenizer):
        """
        Preprocess single text for prediction
        """
        # Clean the text
        cleaned_text = self.clean_text(text)
        
        # Convert to sequence
        sequence = tokenizer.texts_to_sequences([cleaned_text])
        
        # Pad sequence
        padded = pad_sequences(sequence, maxlen=self.max_len)
        
        return padded
    
    def save_tokenizer(self, tokenizer, filepath):
        """Save tokenizer to file"""
        with open(filepath, 'wb') as f:
            pickle.dump(tokenizer, f)
    
    def load_tokenizer(self, filepath):
        """Load tokenizer from file"""
        with open(filepath, 'rb') as f:
            tokenizer = pickle.load(f)
        return tokenizer

def analyze_prediction(probability):
    """
    Analyze prediction probability and return detailed results
    """
    confidence = float(probability[0][0]) if isinstance(probability, np.ndarray) else float(probability)
    
    if confidence >= 0.7:
        result = "FAKE NEWS"
        confidence_level = "High"
        color = "#dc3545"
        icon = "🚫"
        message = "This article appears to be fake news with high confidence."
    elif confidence >= 0.5:
        result = "SUSPICIOUS"
        confidence_level = "Medium"
        color = "#ffc107"
        icon = "⚠️"
        message = "This article shows suspicious patterns. Please verify with other sources."
    else:
        result = "REAL NEWS"
        confidence_level = "High" if confidence < 0.3 else "Medium"
        color = "#28a745"
        icon = "✅"
        message = "This article appears to be legitimate news."
    
    return {
        'result': result,
        'confidence': confidence,
        'confidence_percentage': f"{confidence*100:.1f}%",
        'confidence_level': confidence_level,
        'color': color,
        'icon': icon,
        'message': message
    }

def get_model_summary():
    """Return model architecture summary"""
    return {
        'type': 'CNN',
        'layers': [
            {'name': 'Embedding', 'params': '10000×128'},
            {'name': 'Conv1D', 'params': '128 filters, kernel_size=5'},
            {'name': 'GlobalMaxPooling1D', 'params': ''},
            {'name': 'Dense', 'params': '64 units'},
            {'name': 'Dropout', 'params': '0.5'},
            {'name': 'Dense', 'params': '1 unit (sigmoid)'}
        ],
        'total_params': '~1.3M',
        'accuracy': '95%'
    }