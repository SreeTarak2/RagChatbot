const micon = document.querySelector("#use_microphone");
const stopBtn = document.getElementById("stop_recording");
const closeBtn = document.getElementById("close");
const overlaydiv = document.querySelector(".voice");
const textarea = document.getElementById("chatboxInput");
// const sendButton = document.getElementById("send_button");
const sendIcon = document.getElementById("send_icon");
const statusMessage = document.querySelector("#status-text");

let socket;
let mediaRecorder;
let audioStream;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
let processingTimeout;

const socketUrl = "wss://crafts-london-discipline-offices.trycloudflare.com/ws/voice"; // change as needed

// Create and reuse WebSocket connection
function initWebSocket() {
  return new Promise((resolve, reject) => {
    if (socket && socket.readyState <= 1) return resolve();

    socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      resolve();
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      showError("Voice server connection error");
      overlaydiv.style.display = "none";
      socket = null;
      reject(err);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      socket = null;
    };

    socket.onmessage = (event) => {
      const transcribedText = event.data;
      clearTimeout(processingTimeout);
      isProcessing = false;
      updateTranscription(transcribedText);
    };
  });
}

// Send audio blob over WebSocket
async function sendAudioBlob(audioBlob) {
  try {
    const wavBlob = await webmToWav(audioBlob);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(wavBlob);
    } else {
      showError("WebSocket not connected");
    }
  } catch (e) {
    console.error("Failed to send audio:", e);
    showError("Audio send failed");
  }
}

// coversion logic
function webmToWav(webmBlob) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = function (e) {
      audioContext
        .decodeAudioData(e.target.result)
        .then((audioBuffer) => {
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: "audio/wav" });
          resolve(wavBlob);
        })
        .catch(reject);
    };

    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(webmBlob);
  });
}

function audioBufferToWav(buffer) {
  const length = buffer.length;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length * 2, true);

  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
}

// error handling
function showError(message) {
  const errorBox = document.getElementById("upload-error");
  if (!errorBox) return;

  errorBox.textContent = `❌ ${message}`;
  errorBox.style.display = "block";

  setTimeout(() => {
    errorBox.style.display = "none";
  }, 6000);
}

// Start mic and recording
async function startMicrophone() {
  try {
    await initWebSocket(); // Wait for WebSocket to be ready
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startRecording(audioStream);
  } catch (err) {
    console.error("Mic/WebSocket error:", err);
    showError("Mic or connection failed");

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      audioStream = null;
    }

    overlaydiv.style.display = "none";
  }

  // If the WebSocket fails, close the mic too.
  // if (!socket || socket.readyState === WebSocket.CLOSED) {
  //   if (audioStream) {
  //     audioStream.getTracks().forEach((track) => track.stop());
  //     audioStream = null;
  //   }
  //   overlaydiv.style.display = "none";
  //   showError("Voice server not reachable. Mic turned off.");
  // }
}

function startRecording(stream) {
  audioChunks = [];

  mediaRecorder = new MediaRecorder(stream, {
    mimeType: "audio/webm;codecs=opus",
    audioBitsPerSecond: 16000,
  });

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) audioChunks.push(e.data);
  };

  mediaRecorder.onstart = () => {
    isRecording = true;
    statusMessage.textContent = "Listening";
    stopBtn.classList.add("recording");
    console.log("Recording started");
  };

  mediaRecorder.onstop = async () => {
    stopBtn.classList.remove("recording");

    if (audioChunks.length > 0) {
      isProcessing = true;
      statusMessage.textContent = "Processing";
      stopBtn.classList.add("processing");

      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      await sendAudioBlob(audioBlob);

      processingTimeout = setTimeout(() => {
        if (isProcessing) {
          showError("Transcription timeout");
          resetRecordingState();
        }
      }, 10000);
    }

    stream.getTracks().forEach((track) => track.stop());
  };

  mediaRecorder.start();
}

// Stop recording
function stopRecording() {
  if (isRecording && mediaRecorder) {
    mediaRecorder.stop();
    isRecording = false;
    isProcessing = true; // Set processing true immediately after stopping recording
    statusMessage.textContent = "Processing...";
    stopBtn.classList.remove("recording");
    stopBtn.classList.add("processing");
  }
}

// Reset state
function resetRecordingState() {
  isRecording = false;
  isProcessing = false;
  audioChunks = [];
  stopBtn.classList.remove("recording", "processing");
  statusMessage.textContent = "Recording Stopped ";
}

// Handle transcription result
function updateTranscription(text) {
  if (text && text !== "[error transcribing]") {
    statusMessage.textContent = `"${text}"`;
    setTimeout(() => {
      textarea.value = text;
      textarea.dispatchEvent(new Event("input"));
    }, 2000);
  } else {
    statusMessage.textContent = "Transcription failed";
    showError("Try again");
  }

  setTimeout(() => resetRecordingState(), 1500);
}

// UI Event Listeners
micon.addEventListener("click", () => {
  overlaydiv.style.display = "flex";
  startMicrophone();
});

stopBtn.addEventListener("click", (event) => {
  event.preventDefault();
  stopRecording();
});

closeBtn.addEventListener("click", () => {
  overlaydiv.style.display = "none";
  stopRecording();
});

overlaydiv.addEventListener("click", (e) => {
  if (e.target === overlaydiv) {
    overlaydiv.style.display = "none";
    stopRecording();
  }
});
