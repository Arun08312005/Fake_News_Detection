"""
Flask API for Fake News Detection System
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os
import sys
from datetime import datetime

# Import local modules
from config import MODEL_PATH, TOKENIZER_PATH, DEBUG, HOST, PORT, MAX_WORDS, MAX_LEN
from utils import TextPreprocessor, analyze_prediction, get_model_summary

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# Initialize preprocessor
preprocessor = TextPreprocessor(max_words=MAX_WORDS, max_len=MAX_LEN)

# Load model and tokenizer
print("=" * 60)
print("🔍 FAKE NEWS DETECTION SYSTEM API")
print("=" * 60)

print("\n🔄 Loading model and tokenizer...")
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    tokenizer = preprocessor.load_tokenizer(TOKENIZER_PATH)
    print("✅ Model and tokenizer loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    tokenizer = None

# Store prediction history
prediction_history = []

@app.route('/')
def index():
    """Serve the main application"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files"""
    return send_from_directory(app.static_folder, path)

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Predict whether news is fake or real
    Expected JSON: {"title": "news title", "text": "news content"}
    """
    if model is None or tokenizer is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded. Please train the model first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        title = data.get('title', '')
        text = data.get('text', '')
        
        if not title and not text:
            return jsonify({'success': False, 'error': 'Please provide either title or text'}), 400
        
        # Combine title and text
        full_text = f"{title} {text}".strip()
        
        # Preprocess text
        processed_text = preprocessor.preprocess_for_prediction(full_text, tokenizer)
        
        # Make prediction
        prediction_prob = model.predict(processed_text, verbose=0)
        
        # Analyze result
        result = analyze_prediction(prediction_prob)
        
        # Store prediction in history
        prediction_entry = {
            'id': len(prediction_history) + 1,
            'title': title[:100] + '...' if len(title) > 100 else title,
            'text_preview': text[:150] + '...' if len(text) > 150 else text,
            'result': result['result'],
            'confidence': result['confidence'],
            'timestamp': datetime.now().isoformat()
        }
        prediction_history.append(prediction_entry)
        
        # Keep only last 100 predictions
        if len(prediction_history) > 100:
            prediction_history.pop(0)
        
        return jsonify({
            'success': True,
            'prediction': result,
            'preview': {
                'title': title[:200] + '...' if len(title) > 200 else title,
                'text': text[:300] + '...' if len(text) > 300 else text
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get prediction history"""
    return jsonify({
        'history': prediction_history,
        'count': len(prediction_history)
    })

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get model information"""
    if model is None:
        return jsonify({
            'status': 'inactive',
            'message': 'Model not loaded'
        })
    
    return jsonify({
        'status': 'active',
        'type': 'CNN',
        'max_words': MAX_WORDS,
        'max_sequence_length': MAX_LEN,
        'embedding_dim': 128,
        'total_predictions': len(prediction_history),
        'architecture': get_model_summary()
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'tokenizer_loaded': tokenizer is not None,
        'total_predictions': len(prediction_history),
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print(f"\n📍 Server running at: http://{HOST}:{PORT}")
    print(f"📊 Model status: {'✅ Loaded' if model else '❌ Not loaded'}")
    print("=" * 60)
    
    app.run(debug=DEBUG, host=HOST, port=PORT)