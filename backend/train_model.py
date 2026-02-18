"""
Model training script for Fake News Detection System
"""

import os
import sys
import pandas as pd
import numpy as np
from sklearn.utils import shuffle
from sklearn.model_selection import train_test_split
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, Conv1D, GlobalMaxPooling1D, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import matplotlib.pyplot as plt

# Import config
from config import (
    MODEL_PATH, TOKENIZER_PATH, FAKE_DATA_PATH, TRUE_DATA_PATH,
    MAX_WORDS, MAX_LEN, EMBEDDING_DIM, FILTERS, KERNEL_SIZE,
    DENSE_UNITS, DROPOUT_RATE
)
from utils import TextPreprocessor

class FakeNewsTrainer:
    def __init__(self):
        self.preprocessor = TextPreprocessor(max_words=MAX_WORDS, max_len=MAX_LEN)
        self.model = None
        self.tokenizer = None
        self.history = None
    
    def load_and_prepare_data(self):
        """Load and prepare the dataset"""
        print("=" * 60)
        print("📊 FAKE NEWS DETECTION - MODEL TRAINING")
        print("=" * 60)
        
        print("\n📂 Loading datasets...")
        
        # Load fake news data
        df_fake = pd.read_csv(FAKE_DATA_PATH)
        df_fake['target'] = 1  # Fake news = 1
        
        # Load true news data
        df_true = pd.read_csv(TRUE_DATA_PATH)
        df_true['target'] = 0  # Real news = 0
        
        # Combine datasets
        df = pd.concat([df_fake, df_true], ignore_index=True)
        df = shuffle(df, random_state=42).reset_index(drop=True)
        
        print(f"✅ Total samples: {len(df)}")
        print(f"📈 Distribution:\n{df['target'].value_counts()}")
        print(f"   Fake news: {len(df[df['target']==1])}")
        print(f"   Real news: {len(df[df['target']==0])}")
        
        return df
    
    def preprocess_data(self, df):
        """Preprocess text data"""
        print("\n🔄 Preprocessing text data...")
        
        # Combine title and text
        df['text_content'] = df['title'] + " " + df['text']
        
        # Clean text
        print("   Cleaning text...")
        df['text_content'] = df['text_content'].apply(self.preprocessor.clean_text)
        
        # Split data
        X_train_text, X_val_text, y_train, y_val = train_test_split(
            df['text_content'], df['target'], 
            test_size=0.2, random_state=42,
            stratify=df['target']
        )
        
        print(f"   Training samples: {len(X_train_text)}")
        print(f"   Validation samples: {len(X_val_text)}")
        
        # Initialize and fit tokenizer
        print("   Creating tokenizer...")
        self.tokenizer = Tokenizer(num_words=MAX_WORDS)
        self.tokenizer.fit_on_texts(X_train_text)
        
        # Convert to sequences
        X_train_seq = self.tokenizer.texts_to_sequences(X_train_text)
        X_val_seq = self.tokenizer.texts_to_sequences(X_val_text)
        
        # Pad sequences
        X_train = pad_sequences(X_train_seq, maxlen=MAX_LEN)
        X_val = pad_sequences(X_val_seq, maxlen=MAX_LEN)
        
        print(f"✅ Training set shape: {X_train.shape}")
        print(f"✅ Validation set shape: {X_val.shape}")
        
        return X_train, X_val, y_train, y_val
    
    def build_model(self):
        """Build CNN model architecture"""
        print("\n🏗️ Building CNN model...")
        
        model = Sequential([
            Embedding(
                input_dim=MAX_WORDS,
                output_dim=EMBEDDING_DIM,
                input_length=MAX_LEN
            ),
            Conv1D(
                filters=FILTERS,
                kernel_size=KERNEL_SIZE,
                activation='relu'
            ),
            GlobalMaxPooling1D(),
            Dense(DENSE_UNITS, activation='relu'),
            Dropout(DROPOUT_RATE),
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        self.model = model
        print("✅ Model built successfully!")
        model.summary()
        
        return model
    
    def train(self, X_train, X_val, y_train, y_val):
        """Train the model"""
        print("\n🎯 Starting training...")
        
        # Callbacks
        checkpoint = ModelCheckpoint(
            MODEL_PATH,
            monitor='val_accuracy',
            save_best_only=True,
            mode='max',
            verbose=1
        )
        
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True,
            verbose=1
        )
        
        # Train
        self.history = self.model.fit(
            X_train, y_train,
            epochs=10,
            batch_size=64,
            validation_data=(X_val, y_val),
            callbacks=[checkpoint, early_stopping],
            verbose=1
        )
        
        print("\n✅ Training completed!")
        
        # Save tokenizer
        self.preprocessor.save_tokenizer(self.tokenizer, TOKENIZER_PATH)
        print(f"✅ Tokenizer saved to {TOKENIZER_PATH}")
        
        return self.history
    
    def evaluate(self, X_val, y_val):
        """Evaluate the model"""
        print("\n📊 Evaluating model...")
        
        loss, accuracy = self.model.evaluate(X_val, y_val, verbose=0)
        
        print(f"   Validation Loss: {loss:.4f}")
        print(f"   Validation Accuracy: {accuracy:.4f}")
        
        return loss, accuracy
    
    def plot_training_history(self):
        """Plot training history"""
        if not self.history:
            print("No training history found!")
            return
        
        fig, axes = plt.subplots(1, 2, figsize=(14, 5))
        
        # Plot loss
        axes[0].plot(self.history.history['loss'], label='Training Loss', color='blue', linewidth=2)
        axes[0].plot(self.history.history['val_loss'], label='Validation Loss', color='red', linewidth=2)
        axes[0].set_title('Model Loss', fontsize=14, fontweight='bold')
        axes[0].set_xlabel('Epochs')
        axes[0].set_ylabel('Loss')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Plot accuracy
        axes[1].plot(self.history.history['accuracy'], label='Training Accuracy', color='blue', linewidth=2)
        axes[1].plot(self.history.history['val_accuracy'], label='Validation Accuracy', color='red', linewidth=2)
        axes[1].set_title('Model Accuracy', fontsize=14, fontweight='bold')
        axes[1].set_xlabel('Epochs')
        axes[1].set_ylabel('Accuracy')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('training_history.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("📊 Training history plot saved as 'training_history.png'")

def main():
    """Main training function"""
    
    # Initialize trainer
    trainer = FakeNewsTrainer()
    
    try:
        # Load and prepare data
        df = trainer.load_and_prepare_data()
        
        # Preprocess data
        X_train, X_val, y_train, y_val = trainer.preprocess_data(df)
        
        # Build model
        model = trainer.build_model()
        
        # Train model
        history = trainer.train(X_train, X_val, y_train, y_val)
        
        # Evaluate model
        loss, accuracy = trainer.evaluate(X_val, y_val)
        
        # Plot results
        trainer.plot_training_history()
        
        # Final summary
        print("\n" + "=" * 60)
        print("🎉 TRAINING COMPLETE!")
        print("=" * 60)
        print(f"✅ Best Validation Accuracy: {accuracy:.4f}")
        print(f"📁 Model saved: {MODEL_PATH}")
        print(f"📁 Tokenizer saved: {TOKENIZER_PATH}")
        print("=" * 60)
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: Dataset file not found. {e}")
        print("\nPlease make sure the following files exist:")
        print(f"   - {FAKE_DATA_PATH}")
        print(f"   - {TRUE_DATA_PATH}")
    except Exception as e:
        print(f"\n❌ Error during training: {e}")

if __name__ == "__main__":
    main()