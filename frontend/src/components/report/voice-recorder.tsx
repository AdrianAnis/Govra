"use client";

import { Check, Loader2, Play, RefreshCw, RotateCcw, Square, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResults {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResults;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

function getSupportedMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "";
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const STATIC_WAVE_HEIGHTS = [
  14, 26, 40, 20, 52, 34, 44, 58, 28, 48, 24, 38, 52, 30, 42, 56,
  22, 36, 50, 28, 44, 18, 46, 32, 40, 54, 26, 38, 60, 28, 42, 20,
];

function GradientMicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-10"}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="govra-mic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#136cfc" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path
        d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
        stroke="url(#govra-mic-gradient)"
        fill="url(#govra-mic-gradient)"
        fillOpacity="0.18"
      />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="url(#govra-mic-gradient)" />
      <line x1="12" x2="12" y1="19" y2="22" stroke="url(#govra-mic-gradient)" />
      <line x1="8" x2="16" y1="22" y2="22" stroke="url(#govra-mic-gradient)" />
    </svg>
  );
}

function GradientAlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "size-12"}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <linearGradient id="govra-alert-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="url(#govra-alert-gradient)"
        fill="url(#govra-alert-gradient)"
        fillOpacity="0.12"
      />
      <line x1="12" x2="12" y1="8" y2="12" stroke="url(#govra-alert-gradient)" />
      <line x1="12" x2="12.01" y1="16" y2="16" stroke="url(#govra-alert-gradient)" />
    </svg>
  );
}

export function VoiceRecorder({ onTranscript }: VoiceRecorderProps) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"recording" | "processing" | "error">("recording");
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(28).fill(8));
  const [liveTranscript, setLiveTranscript] = useState("");
  const [processingStep, setProcessingStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawErrorDetail, setRawErrorDetail] = useState<string | null>(null);
  const [isWindowsBlocked, setIsWindowsBlocked] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [successNotif, setSuccessNotif] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  const startSimulatedWaveform = () => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    simIntervalRef.current = setInterval(() => {
      const bars: number[] = [];
      let total = 0;
      for (let i = 0; i < 28; i++) {
        const val = Math.floor(Math.random() * 180) + 40;
        bars.push(val);
        total += val;
      }
      setWaveformBars(bars);
      setAudioLevel(total / 28);
    }, 100);
  };

  const openRecorder = async () => {
    setIsModalOpen(true);
    setModalMode("recording");
    setSeconds(0);
    setAudioLevel(0);
    setLiveTranscript("");
    setErrorMessage(null);
    setRawErrorDetail(null);
    setIsWindowsBlocked(false);
    setIsSimulated(false);
    setSuccessNotif(false);
    audioChunksRef.current = [];

    let mediaStream: MediaStream | null = null;
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("MEDIA_DEVICES_NOT_SUPPORTED");
      }

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = mediaStream;
    } catch (err) {
      cleanupAudio();
      setModalMode("error");
      await handlePermissionError(err);
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        const source = audioCtx.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWaveform = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] ?? 0;
          }
          const avg = sum / dataArray.length;
          setAudioLevel(avg);

          const barCount = 28;
          const step = Math.max(1, Math.floor(dataArray.length / barCount));
          const bars: number[] = [];
          for (let i = 0; i < barCount; i++) {
            const val = dataArray[i * step] || 0;
            bars.push(val);
          }
          setWaveformBars(bars);

          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        };
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      }
    } catch {
      startSimulatedWaveform();
    }

    try {
      const mimeType = getSupportedMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
    } catch {}

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    try {
      const win = window as WindowWithSpeech;
      const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechClass) {
        const recognition = new SpeechClass();
        recognition.lang = "id-ID";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEventLike) => {
          let text = "";
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            const transcript = res?.[0]?.transcript ?? "";
            text += (text ? " " : "") + transcript;
          }
          if (text) {
            setLiveTranscript(text);
          }
        };

        recognition.onerror = () => {};
        recognitionRef.current = recognition;
        recognition.start();
      }
    } catch {}
  };

  const startSimulation = () => {
    setIsSimulated(true);
    setModalMode("recording");
    setSeconds(0);
    setAudioLevel(120);
    setLiveTranscript("Laporan jalan berlubang cukup dalam di dekat persimpangan jalan...");
    setErrorMessage(null);
    setRawErrorDetail(null);
    startSimulatedWaveform();

    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handlePermissionError = async (err: unknown) => {
    let browserPermissionGranted = false;
    try {
      if (typeof navigator !== "undefined" && navigator.permissions?.query) {
        const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (status.state === "granted") {
          browserPermissionGranted = true;
        }
      }
    } catch {}

    const errObj = err && typeof err === "object" ? (err as { name?: string; message?: string }) : {};
    const errName = errObj.name || "Error";
    const errMsg = errObj.message || "";
    setRawErrorDetail(`${errName}: ${errMsg}`);

    if (browserPermissionGranted) {
      setIsWindowsBlocked(true);
      setErrorMessage(
        "Izin mikrofon di peramban Anda sudah aktif (Allow), namun akses perangkat diblokir oleh Pengaturan Privasi Sistem Windows. Silakan aktifkan akses mikrofon di Windows Settings."
      );
      return;
    }

    if (errName === "NotAllowedError" || errName === "PermissionDeniedError") {
      setErrorMessage(
        "Izin mikrofon baru saja diubah di bilah alamat Chrome. Peramban membutuhkan muat ulang (refresh) halaman agar izin baru tersebut aktif di halaman ini."
      );
      return;
    }

    if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
      setErrorMessage(
        "Perangkat mikrofon tidak ditemukan. Pastikan ada mikrofon atau headset yang terpasang dan aktif di komputer Anda."
      );
      return;
    }

    if (errName === "NotReadableError" || errName === "TrackStartError") {
      setErrorMessage(
        "Mikrofon sedang digunakan secara eksklusif oleh aplikasi lain (seperti Zoom, Google Meet, Teams, atau Discord). Silakan tutup aplikasi tersebut dan coba lagi."
      );
      return;
    }

    setErrorMessage(
      "Gagal mengakses mikrofon. Muat ulang halaman setelah mengaktifkan izin di bilah alamat peramban."
    );
  };

  const stopAndProcessRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setModalMode("processing");
    setProcessingStep(1);

    processingTimerRef.current = setInterval(() => {
      setProcessingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    if (isSimulated) {
      setTimeout(() => {
        executeSimulationTranscription();
      }, 1500);
      return;
    }

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") {
      mr.onstop = () => {
        const mimeType = getSupportedMimeType() || "audio/webm";
        const cleanMime = (mimeType.split(";")[0] ?? "audio/webm").trim();
        const audioBlob = new Blob(audioChunksRef.current, { type: cleanMime });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        executeTranscription(audioBlob, cleanMime);
      };
      mr.stop();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (liveTranscript.trim()) {
        finishSuccess(liveTranscript.trim());
      } else {
        setModalMode("error");
        setErrorMessage("Tidak ada suara yang terekam. Silakan coba kembali.");
      }
    }
  };

  const executeSimulationTranscription = async () => {
    try {
      const res = await fetch("/api/reports/speech-to-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio_base64: "dGVzdA==", mime_type: "audio/webm" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.transcript && data.transcript.trim()) {
          finishSuccess(data.transcript.trim());
          return;
        }
      }
    } catch {}

    finishSuccess(
      "Laporan mengenai jalan berlubang cukup dalam di persimpangan jalan utama yang membahayakan pengendara motor saat malam hari. Mohon perbaikan dan penambalan aspal segera."
    );
  };

  const executeTranscription = (audioBlob: Blob, cleanMime: string) => {
    if (audioBlob.size === 0) {
      if (liveTranscript.trim()) {
        finishSuccess(liveTranscript.trim());
        return;
      }
      setModalMode("error");
      setErrorMessage("Tidak ada data suara yang terekam. Silakan rekam kembali.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = (reader.result as string).split(",")[1];
        if (!base64Data) {
          throw new Error("EMPTY_DATA");
        }

        const res = await fetch("/api/reports/speech-to-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio_base64: base64Data, mime_type: cleanMime }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transcript && data.transcript.trim()) {
            finishSuccess(data.transcript.trim());
            return;
          }
        }

        if (liveTranscript.trim()) {
          finishSuccess(liveTranscript.trim());
          return;
        }

        setModalMode("error");
        setErrorMessage("Tidak dapat mengenali ucapan dari rekaman suara. Silakan coba bicara lebih jelas.");
      } catch {
        if (liveTranscript.trim()) {
          finishSuccess(liveTranscript.trim());
          return;
        }
        setModalMode("error");
        setErrorMessage("Gagal memproses rekaman suara ke teks. Pastikan koneksi internet stabil.");
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  const finishSuccess = (text: string) => {
    cleanupAudio();
    onTranscript(text);
    setIsModalOpen(false);
    setSuccessNotif(true);
    setTimeout(() => {
      setSuccessNotif(false);
    }, 6000);
  };

  const cancelRecording = () => {
    cleanupAudio();
    setIsModalOpen(false);
    setModalMode("recording");
    setErrorMessage(null);
  };

  const handleReloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const modalOverlay =
    isModalOpen && mounted ? (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      >
        <div className="relative flex w-full max-w-lg flex-col items-center rounded-2xl border border-border/80 bg-white p-6 sm:p-8 shadow-2xl text-fg animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={cancelRecording}
            className="absolute right-4 top-4 rounded-full p-2 text-fg-muted hover:bg-surface-muted hover:text-fg transition-colors"
            title="Tutup jendela"
          >
            <X className="size-5" />
          </button>

          {modalMode === "recording" && (
            <div className="flex w-full flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold tracking-wider text-red-600">
                  <span className="size-2 rounded-full bg-red-500 animate-ping" />
                  MEREKAM SUARA
                </div>
                <h3 className="text-xl font-bold tracking-tight text-fg mt-1">
                  Silakan Ceritakan Kejadian
                </h3>
                <p className="text-xs text-fg-muted max-w-sm">
                  {isSimulated
                    ? "Mode Uji Coba: Gelombang suara aktif merekam simulasi penjelasan warga."
                    : "Bicaralah secara wajar dalam Bahasa Indonesia. Gelombang suara akan bergerak dinamis mengikuti intonasi Anda."}
                </p>
              </div>

              <div className="relative flex size-32 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border border-primary/25 bg-primary/5 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + Math.min(0.5, (audioLevel / 255) * 0.7)})`,
                    opacity: 0.4 + (audioLevel / 255) * 0.6,
                  }}
                />
                <div
                  className="absolute inset-2 rounded-full border border-primary/35 bg-primary/10 transition-transform duration-75"
                  style={{
                    transform: `scale(${1 + Math.min(0.3, (audioLevel / 255) * 0.4)})`,
                  }}
                />
                <div className="relative flex size-20 items-center justify-center rounded-full bg-surface-muted border border-border shadow-md">
                  <GradientMicIcon className="size-9" />
                </div>
              </div>

              <div className="flex h-16 w-full items-center justify-center gap-1.5 px-4 rounded-xl bg-surface-muted/60 border border-border/60">
                {waveformBars.map((val, idx) => {
                  const barHeight = Math.max(6, Math.min(50, (val / 255) * 50));
                  return (
                    <div
                      key={idx}
                      className="w-1.5 rounded-full bg-primary transition-all duration-75"
                      style={{
                        height: `${barHeight}px`,
                        opacity: Math.max(0.35, val / 255),
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex flex-col items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-widest text-fg tabular-nums">
                  {formatTime(seconds)}
                </span>
                {liveTranscript && (
                  <div className="max-h-16 w-full overflow-hidden text-ellipsis rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-center text-xs italic text-fg-muted">
                    &quot;{liveTranscript}&quot;
                  </div>
                )}
              </div>

              <div className="flex w-full items-center justify-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelRecording}
                  className="h-11 px-6 font-medium text-fg-muted hover:text-fg"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={stopAndProcessRecording}
                  className="h-11 gap-2 bg-primary px-7 font-semibold text-primary-fg shadow-lg shadow-primary/20 hover:bg-primary-hover"
                >
                  <Square className="size-4 fill-current" />
                  <span>Selesai Merekam</span>
                </Button>
              </div>
            </div>
          )}

          {modalMode === "processing" && (
            <div className="flex w-full flex-col items-center gap-6 py-4">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  <Loader2 className="size-3.5 animate-spin" />
                  TRANSKRIPSI AKTIF
                </div>
                <h3 className="text-xl font-bold tracking-tight text-fg mt-1">
                  Mengekstrak Rekaman Suara
                </h3>
                <p className="text-xs text-fg-muted">
                  Mengonversi rekaman suara menjadi deskripsi laporan resmi
                </p>
              </div>

              <div className="relative flex h-20 w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-muted/50 px-4">
                <div className="flex items-center gap-1.5">
                  {STATIC_WAVE_HEIGHTS.map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full transition-all duration-300"
                      style={{
                        height: `${h}px`,
                        backgroundColor:
                          i % 4 === processingStep ? "var(--primary)" : "rgba(19, 108, 252, 0.25)",
                      }}
                    />
                  ))}
                </div>
                <div className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>

              <div className="flex w-full max-w-sm flex-col gap-2.5 rounded-xl border border-border bg-surface-muted/40 p-3.5 text-xs text-fg">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-3" />
                  </div>
                  <span>Data rekaman suara berhasil ditangkap ({formatTime(seconds)})</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                  <span className="font-semibold text-fg">
                    {processingStep === 1 && "Membaca struktur gelombang suara..."}
                    {processingStep === 2 && "Menganalisis pelafalan dan kosakata Bahasa Indonesia..."}
                    {processingStep >= 3 && "Menyusun teks deskripsi laporan warga..."}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-fg-subtle">
                  <div className="size-5 shrink-0 rounded-full border border-border-strong" />
                  <span>Menyimpan ke formulir pelaporan</span>
                </div>
              </div>

              <div className="h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full w-2/3 rounded-full bg-primary animate-pulse" />
              </div>
            </div>
          )}

          {modalMode === "error" && (
            <div className="flex w-full flex-col items-center gap-5 text-center py-2">
              <GradientAlertIcon className="size-14" />

              <div className="flex flex-col gap-2 max-w-md">
                <h3 className="text-lg font-bold text-fg">Akses Mikrofon Belum Aktif</h3>
                <p className="text-xs leading-relaxed text-fg-muted">
                  {errorMessage || "Tidak dapat mengakses mikrofon atau mengekstrak suara."}
                </p>
                {rawErrorDetail && (
                  <p className="text-[11px] font-mono text-fg-subtle bg-surface-muted px-2 py-1 rounded">
                    Status sistem: {rawErrorDetail}
                  </p>
                )}
              </div>

              <div className="flex w-full flex-col gap-2.5 rounded-xl border border-border bg-surface-muted/50 p-4 text-left text-xs text-fg">
                <div className="flex items-start gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
                    1
                  </span>
                  <div>
                    <span className="font-semibold">Muat Ulang Halaman (Wajib setelah ubah izin Chrome):</span>
                    <p className="text-fg-muted text-[11px] mt-0.5">
                      Karena Anda baru saja menyalakan toggle <em>&quot;Microphone: Only this time&quot;</em> di bilah alamat, Google Chrome mewajibkan halaman dimuat ulang agar izin tersebut aktif ke tab ini.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-fg">
                    2
                  </span>
                  <div>
                    <span className="font-semibold">Izin Privasi Windows (Jika Masih Ditolak):</span>
                    <p className="text-fg-muted text-[11px] mt-0.5">
                      {isWindowsBlocked ? (
                        <span className="text-destructive font-medium">
                          Izin di peramban sudah aktif, namun diblokir oleh Windows!
                        </span>
                      ) : null}{" "}
                      Buka <strong>Settings Windows (Win + I) &gt; Privacy &amp; security &gt; Microphone</strong>. Pastikan opsi <strong>&quot;Microphone access&quot;</strong> serta <strong>&quot;Let desktop apps access your microphone&quot;</strong> dalam keadaan <strong>ON</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReloadPage}
                  className="gap-2 font-medium text-primary border-primary/40 hover:bg-primary-soft"
                >
                  <RotateCcw className="size-4" />
                  <span>Muat Ulang Halaman (F5)</span>
                </Button>

                <Button
                  type="button"
                  onClick={openRecorder}
                  className="gap-2 bg-primary font-semibold text-primary-fg hover:bg-primary-hover shadow-md shadow-primary/20"
                >
                  <RefreshCw className="size-4" />
                  <span>Coba Rekam Lagi</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={startSimulation}
                  className="gap-1.5 text-xs text-fg-muted hover:text-fg w-full sm:w-auto"
                >
                  <Play className="size-3.5 text-primary" />
                  <span>Uji Coba Transkripsi (Simulasi Suara)</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-xs transition-colors hover:border-primary/40">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <GradientMicIcon className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-fg">Input Laporan Lewat Suara (VN)</p>
              <p className="text-xs text-fg-muted">
                Rekam penjelasan langsung, otomatis diekstrak menjadi teks laporan resmi
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openRecorder}
            className="inline-flex items-center gap-2 font-medium border-primary/30 text-primary hover:bg-primary hover:text-primary-fg"
          >
            <GradientMicIcon className="size-4" />
            <span>Mulai Rekam VN</span>
          </Button>
        </div>

        {successNotif && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary-soft/60 px-3.5 py-2.5 text-xs font-medium text-primary">
            <Check className="size-4 shrink-0" />
            <span>Suara berhasil diekstrak dan dimasukkan ke kolom deskripsi di bawah.</span>
          </div>
        )}
      </div>

      {mounted && modalOverlay ? createPortal(modalOverlay, document.body) : null}
    </>
  );
}
