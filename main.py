# app.py

import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from dotenv import load_dotenv
from translate import translate_speech

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='src/templates', static_folder='src/static')
app.secret_key = os.urandom(24)

# Credentials from .env file
USERNAME = os.getenv('USERNAME')
PASSWORD = os.getenv('PASSWORD')

@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username == USERNAME and password == PASSWORD:
            return redirect(url_for('main'))
        else:
            flash('Invalid credentials. Please try again.')
    return render_template('index.html')

@app.route('/main')
def main():
    return render_template('main.html')

@app.route('/translate', methods=['POST'])
def translate():
    input_language = request.form['input_language']
    target_language = request.form['target_language']
    audio_data = request.files['audio_data']

    audio_file_path = 'audio.wav'
    audio_data.save(audio_file_path)

    translation = translate_speech(audio_file_path, input_language, target_language)
    return jsonify({'translation': translation})

def run_app():
    app.run(port=int(os.environ.get('PORT', 5000)))

if __name__ == "__main__":
    run_app()
