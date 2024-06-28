# app.py
import os

from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from dotenv import load_dotenv

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

def run_app():
    app.run(port=int(os.environ.get('PORT', 80)))

if __name__ == "__main__":
    run_app()
