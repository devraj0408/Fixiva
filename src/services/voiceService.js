/**
 * Fixiva Multilingual Voice Assistant Service
 * Continuous, high-accuracy Speech-to-Text (STT) and Text-to-Speech (TTS) engine.
 * Guarantees hardware microphone initialization via getUserMedia API.
 */

export const LANG_LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  hinglish: 'en-IN'
};

let activeRecognition = null;
let activeMediaStream = null;
let isUserListening = false;
let cachedVoices = [];

// Pre-cache TTS voices
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Check browser support for Speech Recognition
 */
export function isSpeechRecognitionSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Check browser support for Speech Synthesis
 */
export function isSpeechSynthesisSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Start Continuous Voice Input (Speech-to-Text)
 */
export async function startListening({ language = 'en', onResult, onError, onEnd }) {
  if (!isSpeechRecognitionSupported()) {
    if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  // Stop any previous active recognition or microphone stream
  stopListening();

  isUserListening = true;

  // Step 1: Explicitly request hardware microphone stream via getUserMedia
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeMediaStream = stream;
    }
  } catch (err) {
    console.warn('Microphone stream access error:', err);
    isUserListening = false;
    if (onError) onError('Microphone access denied! Please allow microphone permissions in your browser address bar.');
    return null;
  }

  if (!isUserListening) return null;

  // Step 2: Initialize Web Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  // Language setting (maps active language: en -> en-IN, hi -> hi-IN, bn -> bn-IN)
  let targetLocale = LANG_LOCALE_MAP[language] || 'en-IN';
  if (language === 'bn') {
    targetLocale = 'bn-IN';
  }

  try {
    recognition.lang = targetLocale;
  } catch {
    try {
      recognition.lang = 'bn-BD';
    } catch {
      recognition.lang = 'en-US';
    }
  }

  let autoSubmitTimer = null;

  recognition.onresult = (event) => {
    let combinedTranscript = '';
    let isFinal = false;

    // Loop through all result items to construct complete live transcript
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result && result[0] && result[0].transcript) {
        combinedTranscript += result[0].transcript + ' ';
        if (result.isFinal) {
          isFinal = true;
        }
      }
    }

    const cleanText = combinedTranscript.trim();

    if (onResult && cleanText) {
      onResult({
        transcript: cleanText,
        isFinal
      });
    }

    // Auto-submit after 2.5 seconds of silence once speech is detected
    if (autoSubmitTimer) clearTimeout(autoSubmitTimer);
    if (cleanText.length > 1) {
      autoSubmitTimer = setTimeout(() => {
        if (isUserListening && onResult && cleanText.trim()) {
          onResult({
            transcript: cleanText.trim(),
            isFinal: true
          });
          stopListening();
        }
      }, 2500);
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    
    // Filter out harmless no-speech events in continuous mode
    if (event.error === 'no-speech') {
      return;
    }

    let friendlyMsg = 'Voice recognition error.';
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      friendlyMsg = 'Microphone access blocked! Please click the lock/mic icon in your browser address bar to allow microphone.';
      isUserListening = false;
    } else if (event.error === 'network') {
      friendlyMsg = 'Speech network error. Please check your internet connection.';
    }

    if (onError) onError(friendlyMsg);
  };

  recognition.onend = () => {
    // If user is still listening, keep session alive
    if (isUserListening) {
      try {
        recognition.start();
        return;
      } catch {
        // Fall through
      }
    }

    activeRecognition = null;
    isUserListening = false;
    if (autoSubmitTimer) clearTimeout(autoSubmitTimer);
    if (onEnd) onEnd();
  };

  try {
    recognition.start();
    activeRecognition = recognition;
    return recognition;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    isUserListening = false;
    if (onError) onError('Microphone activation failed. Check browser microphone permissions.');
    return null;
  }
}

/**
 * Stop active Voice Input recording and release microphone stream
 */
export function stopListening() {
  isUserListening = false;

  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // Ignore
    }
    activeRecognition = null;
  }

  // Release hardware audio tracks
  if (activeMediaStream) {
    try {
      activeMediaStream.getTracks().forEach((track) => track.stop());
    } catch {
      // Ignore
    }
    activeMediaStream = null;
  }
}

/**
 * Clean markdown symbols, bullet points, emojis, and URLs for smooth Speech Synthesis
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/[*#_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[•▪▫▶️👋🔑🤖🛠️📋💸⭐🔐🔄🚨💡👤🧭⚡📌🎉✔️✅]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Speak text aloud (Text-to-Speech)
 */
export function speakText({ text, language = 'en', onEnd, onError }) {
  if (!isSpeechSynthesisSupported()) {
    if (onError) onError('Speech synthesis is not supported in this browser.');
    return;
  }

  // Cancel ongoing speech
  stopSpeaking();

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) return;

  // Truncate long text to avoid Chrome 15-second SpeechSynthesis freeze
  const truncatedText = cleanText.length > 320 ? cleanText.slice(0, 320) + '.' : cleanText;

  const utterance = new SpeechSynthesisUtterance(truncatedText);
  let targetLocale = LANG_LOCALE_MAP[language] || 'en-IN';
  if (language === 'bn') {
    targetLocale = 'bn-IN';
  }
  utterance.lang = targetLocale;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  // Retrieve cached voices or browser voices
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    // 1. Try finding exact or partial language match (bn-IN, bn-BD, Bangla, Bengali)
    let matchedVoice = voices.find(
      (v) =>
        v.lang.toLowerCase() === targetLocale.toLowerCase() ||
        v.lang.toLowerCase().replace('_', '-').startsWith(targetLocale.split('-')[0]) ||
        (language === 'bn' && (v.lang.toLowerCase().includes('bn') || (v.name && (v.name.toLowerCase().includes('bangla') || v.name.toLowerCase().includes('bengali')))))
    );

    // 2. If no native Bengali voice installed in OS/browser, fallback to Indian / Google voice
    if (!matchedVoice && language === 'bn') {
      matchedVoice = voices.find(
        (v) => v.lang.toLowerCase().startsWith('bn') || v.lang.toLowerCase().includes('in') || v.name.toLowerCase().includes('google')
      );
    }

    // 3. Ultimate fallback to default voice to guarantee audio NEVER stays silent
    if (!matchedVoice) {
      matchedVoice = voices.find((v) => v.default) || voices[0];
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang || targetLocale;
    }
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis utterance error:', e);
    if (onError) onError(e);
  };

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Speech synthesis execution failed:', err);
    if (onError) onError(err);
  }
}

/**
 * Stop current Speech Synthesis playback
 */
export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}
