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

            mediaRecorder.onstop = async () => {
                clearInterval(timerInterval);
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioBuffer = await processAudio(audioBlob);
                const wavBlob = await createWavBlob(audioBuffer, 16000); // Resample to 16 kHz
                const audioUrl = URL.createObjectURL(wavBlob);
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
                    formData.append('audio_data', wavBlob);
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

async function processAudio(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

async function createWavBlob(audioBuffer, sampleRate) {
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * sampleRate / audioBuffer.sampleRate;
    const offlineAudioContext = new OfflineAudioContext(numChannels, length, sampleRate);

    // Create buffer source
    const bufferSource = offlineAudioContext.createBufferSource();
    bufferSource.buffer = audioBuffer;

    // Connect buffer source to destination
    bufferSource.connect(offlineAudioContext.destination);
    bufferSource.start();

    // Render the audio
    const renderedBuffer = await offlineAudioContext.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    return wavBlob;
}

function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    let offset = 0;
    const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
        offset += str.length;
    };

    // RIFF identifier
    writeString('RIFF');
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    // RIFF type
    writeString('WAVE');
    // Format chunk identifier
    writeString('fmt ');
    // Format chunk length
    view.setUint32(offset, 16, true);
    offset += 4;
    // Sample format (raw)
    view.setUint16(offset, 1, true);
    offset += 2;
    // Channel count
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    // Sample rate
    view.setUint32(offset, buffer.sampleRate, true);
    offset += 4;
    // Byte rate (sample rate * block align)
    view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true);
    offset += 4;
    // Block align (channel count * bytes per sample)
    view.setUint16(offset, numOfChan * 2, true);
    offset += 2;
    // Bits per sample
    view.setUint16(offset, 16, true);
    offset += 2;
    // Data chunk identifier
    writeString('data');
    // Data chunk length
    view.setUint32(offset, buffer.length * numOfChan * 2, true);
    offset += 4;

    // Write interleaved data
    const interleaved = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    for (let i = 0; i < interleaved.length; i++) {
        view.setInt16(offset, interleaved[i] * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
}

function interleave(leftChannel, rightChannel) {
    const length = leftChannel.length + rightChannel.length;
    const result = new Float32Array(length);

    let inputIndex = 0;

    for (let i = 0; i < length;) {
        result[i++] = leftChannel[inputIndex];
        result[i++] = rightChannel[inputIndex];
        inputIndex++;
    }
    return result;
}
