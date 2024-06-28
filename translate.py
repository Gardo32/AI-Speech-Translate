# translate.py

import azure.cognitiveservices.speech as speechsdk
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

AZURE_SPEECH_KEY = os.getenv('AZURE_SPEECH_KEY')
AZURE_REGION = os.getenv('AZURE_REGION')
AZURE_SPEECH_ENDPOINT = os.getenv('AZURE_SPEECH_ENDPOINT')

def translate_speech(audio_file_path, input_language, target_language):
    speech_config = speechsdk.SpeechTranslationConfig(
        subscription=AZURE_SPEECH_KEY, region=AZURE_REGION, endpoint=AZURE_SPEECH_ENDPOINT
    )
    audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)
    speech_config.speech_recognition_language = input_language
    speech_config.add_target_language(target_language)

    recognizer = speechsdk.translation.TranslationRecognizer(
        translation_config=speech_config, audio_config=audio_config
    )
    
    result = recognizer.recognize_once()
    
    if result.reason == speechsdk.ResultReason.TranslatedSpeech:
        translation = result.translations[target_language]
        return translation
    else:
        return "Translation failed"
