let mediaRecorder;
let audioChunks = [];
let timerInterval;
let startTime;

document.getElementById('record_button').addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            startTime = Date.now(); // Start time in milliseconds
            mediaRecorder.start();
            document.getElementById('record_button').classList.add('recording');
            document.getElementById('record_status').classList.remove('hidden');
            updateTimer();

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                clearInterval(timerInterval);
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = document.getElementById('audio_playback');
                audio.src = audioUrl;

                document.getElementById('play_button').disabled = false;
                document.getElementById('send_button').disabled = false;

                document.getElementById('play_button').addEventListener('click', () => {
                    audio.play();
                });

                document.getElementById('send_button').addEventListener('click', () => {
                    const inputLanguage = document.getElementById('input_language').value;
                    const targetLanguage = document.getElementById('target_language').value;
                    const formData = new FormData();
                    formData.append('audio_data', audioBlob);
                    formData.append('input_language', inputLanguage);
                    formData.append('target_language', targetLanguage);

                    fetch('/translate', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('translation_result').innerText = data.translation;
                    });
                });
            };
        });
}

function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder = null;
    audioChunks = [];
    document.getElementById('record_button').classList.remove('recording');
    document.getElementById('record_status').classList.add('hidden');
}

function updateTimer() {
    timerInterval = setInterval(() => {
        const elapsedTime = new Date(Date.now() - startTime);
        const minutes = elapsedTime.getUTCMinutes();
        const seconds = elapsedTime.getUTCSeconds();
        const milliseconds = elapsedTime.getUTCMilliseconds();

        document.getElementById('record_status').innerText = `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
    }, 10); // Update every 10 milliseconds for smoother display
}

function pad(value, width = 2) {
    return value.toString().padStart(width, '0');
}
