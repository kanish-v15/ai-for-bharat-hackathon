import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio, speakText } from '../services/api';

// Language code mapping for browser Web Speech API
const LANG_CODES = {
  english: 'en-IN', hindi: 'hi-IN', tamil: 'ta-IN', telugu: 'te-IN',
  kannada: 'kn-IN', malayalam: 'ml-IN', bengali: 'bn-IN', marathi: 'mr-IN',
  gujarati: 'gu-IN',
};

/**
 * Custom hook for voice: backend Polly TTS + Transcribe STT,
 * with automatic browser Web Speech API fallback when backend is unavailable.
 */
export function useBackendVoice(language) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const onResultRef = useRef(null);
  const onErrorRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  // Waveform support
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  const langCode = LANG_CODES[language] || 'en-IN';

  // ── Browser TTS fallback ──
  const speakBrowser = useCallback((text, onEnd) => {
    const synth = window.speechSynthesis;
    if (!synth) { onEnd?.(); return; }

    // Cancel any ongoing speech
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 1.0;
    utter.pitch = 1.0;

    // Try to find an Indian voice
    const voices = synth.getVoices();
    const match = voices.find(v => v.lang === langCode) || voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (match) utter.voice = match;

    utter.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utter.onerror = () => { setIsSpeaking(false); onEnd?.(); };

    setIsSpeaking(true);
    synth.speak(utter);
  }, [langCode]);

  // ── TTS: Try backend Polly first, fallback to browser ──
  const speak = useCallback(async (text, onEnd) => {
    if (!text?.trim()) { onEnd?.(); return; }

    try {
      setIsSpeaking(true);
      const audioBuffer = await speakText(text, language);

      // Validate we got actual audio data
      if (!audioBuffer || audioBuffer.byteLength < 100) {
        throw new Error('Empty audio response');
      }

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); onEnd?.(); };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        // Fallback to browser TTS on playback error
        console.warn('[useBackendVoice] Audio playback failed, using browser TTS');
        speakBrowser(text, onEnd);
      };

      await audio.play();
    } catch (err) {
      console.warn('[useBackendVoice] Backend TTS failed, using browser fallback:', err.message);
      setIsSpeaking(false);
      // Fallback to browser TTS
      speakBrowser(text, onEnd);
    }
  }, [language, speakBrowser]);

  // Cancel TTS playback
  const cancelSpeech = useCallback(() => {
    // Cancel backend audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Cancel browser TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // ── STT: Use browser SpeechRecognition with MediaRecorder as backup ──
  const startListening = useCallback(async (onResult, onError) => {
    cancelSpeech();
    onResultRef.current = onResult;
    onErrorRef.current = onError;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio analyser for waveform
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;

      // ── Strategy: Use browser SpeechRecognition as primary (instant results)
      //    + MediaRecorder as backup (sent to backend if available) ──
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      let browserTranscript = '';
      let backendAttempted = false;

      // Start MediaRecorder to capture audio for backend STT
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus' : 'audio/webm',
      });
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Cleanup audio context
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
        audioCtxRef.current = null;
        analyserRef.current = null;
        sourceRef.current = null;

        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;

        // Stop browser recognition too
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
          recognitionRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Try backend STT first (more accurate)
        if (blob.size > 0) {
          setIsTranscribing(true);
          setLiveTranscript('');
          backendAttempted = true;
          try {
            const transcript = await transcribeAudio(blob, language);
            setIsTranscribing(false);
            setIsListening(false);
            if (transcript?.trim()) {
              onResultRef.current?.(transcript.trim());
              return;
            }
          } catch (err) {
            console.warn('[useBackendVoice] Backend STT failed, using browser result:', err.message);
            setIsTranscribing(false);
          }
        }

        // Fallback: use browser SpeechRecognition transcript
        setIsListening(false);
        if (browserTranscript.trim()) {
          console.log('[useBackendVoice] Using browser STT result:', browserTranscript);
          onResultRef.current?.(browserTranscript.trim());
        } else {
          onErrorRef.current?.(backendAttempted ? 'empty' : 'no_transcript');
        }
      };

      // Start browser SpeechRecognition for live transcript + fallback
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = langCode;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              final += result[0].transcript;
            } else {
              interim += result[0].transcript;
            }
          }
          browserTranscript = final || interim;
          setLiveTranscript(browserTranscript);
        };

        recognition.onerror = () => {};
        recognition.onend = () => {
          // If still recording, restart (browser may stop after silence)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { recognition.start(); } catch {}
          }
        };

        try { recognition.start(); } catch {}
        recognitionRef.current = recognition;
      }

      mediaRecorder.start(250);
      setIsListening(true);
      setLiveTranscript('');

      // Auto-stop after 10 seconds
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch (err) {
      console.error('[useBackendVoice] Microphone access denied:', err);
      setIsListening(false);
      onErrorRef.current?.('mic_denied');
    }
  }, [language, langCode, cancelSpeech]);

  // Stop recording manually
  const stopListening = useCallback(() => {
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Get analyser for waveform visualization
  const getAnalyser = useCallback(() => analyserRef.current, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancelSpeech();
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} }
  }, [cancelSpeech]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isListening,
    isSpeaking,
    isTranscribing,
    liveTranscript,
    speak,
    cancelSpeech,
    startListening,
    stopListening,
    getAnalyser,
    cleanup,
  };
}
