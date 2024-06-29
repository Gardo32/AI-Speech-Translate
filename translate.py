import azure.cognitiveservices.speech as speechsdk
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

AZURE_SPEECH_KEY = os.getenv('AZURE_SPEECH_KEY')
AZURE_REGION = os.getenv('AZURE_REGION')

def translate_speech(audio_file_path, input_language, target_language):
    translation_config = speechsdk.translation.SpeechTranslationConfig(
        subscription=AZURE_SPEECH_KEY,
        region=AZURE_REGION
    )
    translation_config.speech_recognition_language = input_language
    translation_config.add_target_language(target_language)

    audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)
    
    recognizer = speechsdk.translation.TranslationRecognizer(
        translation_config=translation_config, audio_config=audio_config
    )
    
    result = recognizer.recognize_once()
    
    if result.reason == speechsdk.ResultReason.TranslatedSpeech:
        translation = result.translations[target_language]
        return translation
    else:
        return "Translation failed"
