import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CapturedPhoto, StripLayout, ThemeConfig } from "../types";
import { THEMES } from "../data";
import { Camera, RefreshCw, Sparkles, AlertCircle, ToggleLeft, ToggleRight, HelpCircle, Eye, Sliders, Volume2, VolumeX } from "lucide-react";
import { startCountdownRequest, submitFrameRequest, pollRoomStateRequest } from "../lib/roomsApi";

interface CameraViewProps {
  layout: StripLayout;
  theme: ThemeConfig;
  userName: string;
  partnerName: string;
  roomCode?: string;
  roomRole: "solo" | "host" | "guest";
  onPhotosCaptured: (photos: CapturedPhoto[]) => void;
  onBack: () => void;
}

const HALF_W = 320;
const HALF_H = 480;
const PARTNER_WAIT_TIMEOUT_MS = 8000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function computeCenteredCrop(vw: number, vh: number, ratio: number) {
  const sourceRatio = vw / vh;
  let cropX = 0;
  let cropY = 0;
  let cropW = vw;
  let cropH = vh;

  if (sourceRatio > ratio) {
    cropW = vh * ratio;
    cropH = vh;
    cropX = (vw - cropW) / 2;
    cropY = 0;
  } else {
    cropW = vw;
    cropH = vw / ratio;
    cropX = 0;
    cropY = (vh - cropH) / 2;
  }

  return { cropX, cropY, cropW, cropH };
}

function drawMockSelfie(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = "#1e1e24";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#e11d48";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.62, w * 0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fecdd3";
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.38, w * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.72, w * 0.42, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `bold ${Math.round(w * 0.18)}px sans-serif`;
  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.fillText("✨", w / 2, h * 0.34);
  ctx.restore();
}

function drawNameTag(ctx: CanvasRenderingContext2D, x: number, name: string) {
  ctx.save();
  ctx.fillStyle = "rgba(17, 24, 39, 0.8)";
  ctx.beginPath();
  ctx.roundRect(x, 430, 100, 32, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x + 50, 450);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load captured image."));
    img.src = src;
  });
}

export default function CameraView({
  layout,
  theme,
  userName,
  partnerName,
  roomCode,
  roomRole,
  onPhotosCaptured,
  onBack,
}: CameraViewProps) {
  const isConnectedSession = !!roomCode && roomRole !== "solo";
  const mySide: "host" | "guest" = roomRole === "guest" ? "guest" : "host";
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [captured, setCaptured] = useState<CapturedPhoto[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [flashActive, setFlashActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Refs to prevent stale closure bugs in automated async capture intervals
  const capturedRef = useRef<CapturedPhoto[]>([]);
  const currentFrameIndexRef = useRef<number>(0);
  
  // LDR Mode toggles
  const [isLdrMode, setIsLdrMode] = useState(() => !!partnerName.trim()); // Default to LDR mode if partnerName is provided!

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Connected (two-device) joint session state
  const [waitingForPartner, setWaitingForPartner] = useState(false);
  const [partnerWaitTimedOut, setPartnerWaitTimedOut] = useState(false);
  const cancelledRef = useRef(false);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUsingMockRef = useRef(isUsingMock);
  const isMirroredRef = useRef(isMirrored);

  useEffect(() => {
    isUsingMockRef.current = isUsingMock;
  }, [isUsingMock]);

  useEffect(() => {
    isMirroredRef.current = isMirrored;
  }, [isMirrored]);

  // Audio Context for sweet synthetic shutter sound
  const playShutterSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Shutter click white noise
      const bufferSize = audioCtx.sampleRate * 0.1;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {
      console.warn("Audio Context blocked or failed:", e);
    }
  };

  // Sound cue for countdown
  const playCountdownBeep = (isFinal = false) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = isFinal ? 880 : 440; // higher pitch for photo capture
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  // Initial WebRTC Camera Setup
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        const constraints = {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError(
          "Webcam access could not be established. This is common on sandboxed frames or devices without camera accessories."
        );
        setIsUsingMock(true); // Automatically fall back to mock stream for frictionless testing
      }
    }

    if (!isUsingMock) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isUsingMock]);

  // Handle start of the automated photobooth loop
  const startCaptureSequence = () => {
    if (isCapturing) return;

    if (isConnectedSession) {
      runConnectedSession();
      return;
    }

    setIsCapturing(true);
    setCaptured([]);
    capturedRef.current = [];
    setCurrentFrameIndex(0);
    currentFrameIndexRef.current = 0;
    triggerCountdown(3);
  };

  const triggerCountdown = (seconds: number) => {
    setCountdown(seconds);
    playCountdownBeep(seconds === 1);
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    countdownIntervalRef.current = setInterval(() => {
      seconds -= 1;
      if (seconds > 0) {
        setCountdown(seconds);
        playCountdownBeep(seconds === 1);
      } else {
        clearInterval(countdownIntervalRef.current!);
        setCountdown(null);
        captureFrame();
      }
    }, 1000);
  };

  // Capture current frame from Video element or generate Mock pose
  const captureFrame = async () => {
    const frameIndex = currentFrameIndexRef.current;

    // 1. Flash effect
    setFlashActive(true);
    playShutterSound();
    setTimeout(() => setFlashActive(false), 200);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    let photoUrl = "";

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 640;
        canvas.height = 480;

        // Draw User Feed (live or mock)
        if (!isUsingMock && video && video.readyState >= 2) {
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          
          // 1. Get coordinates of centered 4:3 crop (matches the 4:3 preview container)
          const previewRatio = 4 / 3;
          const sourceRatio = vw / vh;
          
          let cropX = 0;
          let cropY = 0;
          let cropW = vw;
          let cropH = vh;
          
          if (sourceRatio > previewRatio) {
            cropW = vh * previewRatio;
            cropH = vh;
            cropX = (vw - cropW) / 2;
            cropY = 0;
          } else {
            cropW = vw;
            cropH = vw / previewRatio;
            cropX = 0;
            cropY = (vh - cropH) / 2;
          }

          // 2. Extract left/right half for LDR mode, or full for Solo mode
          let sx = cropX;
          let sy = cropY;
          let sw = cropW;
          let sh = cropH;

          if (isLdrMode) {
            sw = cropW / 2;
            if (isMirrored) {
              sx = cropX + cropW / 2;
            } else {
              sx = cropX;
            }
          }

          // 3. Draw onto the canvas with proper mirroring
          ctx.save();
          if (isLdrMode) {
            if (isMirrored) {
              ctx.translate(320, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 320, 480);
            } else {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 320, 480);
            }
          } else {
            if (isMirrored) {
              ctx.translate(640, 0);
              ctx.scale(-1, 1);
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 640, 480);
            } else {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 640, 480);
            }
          }
          ctx.restore();
        } else {
          // Generate a stylish Mock User selfie on left or full canvas
          ctx.save();
          ctx.fillStyle = "#1e1e24";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw dynamic mock photo backdrop
          ctx.fillStyle = "#e11d48"; // Rose backdrop color
          ctx.beginPath();
          ctx.arc(isLdrMode ? 160 : 320, 300, 180, 0, Math.PI * 2);
          ctx.fill();

          // Draw stylized human figure placeholder for user (Mohit)
          ctx.fillStyle = "#fecdd3";
          ctx.beginPath();
          ctx.arc(isLdrMode ? 160 : 320, 200, 60, 0, Math.PI * 2); // head
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(isLdrMode ? 160 : 320, 360, 100, 90, 0, 0, Math.PI * 2); // shoulders
          ctx.fill();

          // Add a cute face or heart overlay
          ctx.font = "bold 32px font-sans";
          ctx.fillStyle = "#111827";
          ctx.textAlign = "center";
          ctx.fillText("✨", isLdrMode ? 160 : 320, 180);

          // Draw name tag on corner
          ctx.fillStyle = "#e11d48";
          ctx.beginPath();
          ctx.roundRect(isLdrMode ? 20 : 40, 400, 100, 32, 16);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px font-mono";
          ctx.fillText(userName || "Mohit", isLdrMode ? 70 : 90, 420);

          ctx.restore();
        }

        // 2. Draw Partner Khushi's Pose in LDR mode
        if (isLdrMode) {
          ctx.save();
          ctx.fillStyle = "#fdf2f8"; // Romantic pink paper side
          ctx.fillRect(320, 0, 320, 480);
          
          // Draw separating line
          ctx.strokeStyle = "#db2777";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(320, 0);
          ctx.lineTo(320, 480);
          ctx.stroke();

          // Draw a stylized vector representation of Khushi making a specific pose
          // dependent on the current frame index! This looks incredibly responsive and authentic.
          ctx.fillStyle = "#fbcfe8"; // Cute pink shirt
          ctx.beginPath();
          ctx.ellipse(480, 360, 90, 80, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#f472b6"; // Darker pink head/hair outline
          ctx.beginPath();
          ctx.arc(480, 210, 55, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#fff1f2"; // Face skin tone
          ctx.beginPath();
          ctx.arc(480, 215, 45, 0, Math.PI * 2);
          ctx.fill();

          // Draw Khushi's adorable hair outline (with cute buns or ponytails)
          ctx.fillStyle = "#4c0519";
          ctx.beginPath();
          ctx.arc(440, 170, 25, 0, Math.PI * 2); // left bun
          ctx.arc(520, 170, 25, 0, Math.PI * 2); // right bun
          ctx.fill();
          
          // Hair front bangs
          ctx.beginPath();
          ctx.ellipse(480, 180, 50, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw sweet, freeform expressions of Khushi to pose alongside
          ctx.strokeStyle = "#9f1239";
          ctx.lineWidth = 6;
          ctx.lineCap = "round";

          if (frameIndex === 0) {
            // Cozy smile and wave
            ctx.font = "32px font-sans";
            ctx.fillText("👋😊💖", 480, 250);
          } else if (frameIndex === 1) {
            // Cute peace sign
            ctx.font = "32px font-sans";
            ctx.fillText("✌️🥰✨", 480, 250);
          } else if (frameIndex === 2) {
            // Heart face
            ctx.font = "32px font-sans";
            ctx.fillText("😘💕🌸", 480, 250);
          } else if (frameIndex === 3) {
            // Playful/Silly
            ctx.font = "32px font-sans";
            ctx.fillText("🫶🌟😜", 480, 250);
          } else {
            // Cute wink
            ctx.font = "32px font-sans";
            ctx.fillText("😜⭐🎵", 480, 250);
          }

          // Draw Khushi name tag
          ctx.fillStyle = "#db2777";
          ctx.beginPath();
          ctx.roundRect(430, 400, 100, 32, 16);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px font-mono";
          ctx.textAlign = "center";
          ctx.fillText(partnerName || "Khushi", 480, 420);

          ctx.restore();
        }

        photoUrl = canvas.toDataURL("image/png");
      }
    }

    const newPhoto: CapturedPhoto = {
      id: `photo_${Date.now()}_${frameIndex}`,
      url: photoUrl,
      timestamp: Date.now(),
      by: isLdrMode ? "both" : "you",
    };

    const updatedCaptured = [...capturedRef.current, newPhoto];
    capturedRef.current = updatedCaptured;
    setCaptured(updatedCaptured);

    // Advance index or complete
    const nextIndex = frameIndex + 1;
    if (nextIndex < layout.frames) {
      currentFrameIndexRef.current = nextIndex;
      setCurrentFrameIndex(nextIndex);
      // Automatically trigger next countdown in 1.8 seconds (giving user a brief rest to see their photo progress)
      setTimeout(() => {
        triggerCountdown(3);
      }, 1800);
    } else {
      // Finished all frames!
      setTimeout(() => {
        setIsCapturing(false);
        onPhotosCaptured(updatedCaptured);
      }, 1500);
    }
  };

  const handleRetake = () => {
    cancelledRef.current = true;
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    setCountdown(null);
    setIsCapturing(false);
    setWaitingForPartner(false);
    setPartnerWaitTimedOut(false);
    setCaptured([]);
    capturedRef.current = [];
    setCurrentFrameIndex(0);
    currentFrameIndexRef.current = 0;
  };

  // --- Connected (two-device) joint session capture ---
  // Each device captures only its own half (a natural 2:3 portrait crop of its own
  // webcam, not half of a shared 4:3 crop like the simulated solo/LDR mode above).
  const captureOwnHalfDataUrl = (): string => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = HALF_W;
    canvas.height = HALF_H;

    const video = videoRef.current;
    if (!isUsingMockRef.current && video && video.readyState >= 2) {
      const { cropX, cropY, cropW, cropH } = computeCenteredCrop(video.videoWidth, video.videoHeight, HALF_W / HALF_H);
      ctx.save();
      if (isMirroredRef.current) {
        ctx.translate(HALF_W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, HALF_W, HALF_H);
      ctx.restore();
    } else {
      drawMockSelfie(ctx, HALF_W, HALF_H);
    }

    return canvas.toDataURL("image/png");
  };

  const compositeHalves = async (myUrl: string, partnerUrl: string, frameIndex: number): Promise<CapturedPhoto> => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = HALF_W * 2;
    canvas.height = HALF_H;

    const hostUrl = mySide === "host" ? myUrl : partnerUrl;
    const guestUrl = mySide === "guest" ? myUrl : partnerUrl;
    const [hostImg, guestImg] = await Promise.all([loadImage(hostUrl), loadImage(guestUrl)]);

    ctx.drawImage(hostImg, 0, 0, HALF_W, HALF_H);
    ctx.drawImage(guestImg, HALF_W, 0, HALF_W, HALF_H);

    ctx.strokeStyle = "#db2777";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(HALF_W, 0);
    ctx.lineTo(HALF_W, HALF_H);
    ctx.stroke();

    const leftName = roomRole === "host" ? userName : partnerName;
    const rightName = roomRole === "guest" ? userName : partnerName;
    drawNameTag(ctx, 110, leftName || "Host");
    drawNameTag(ctx, HALF_W + 110, rightName || "Guest");

    return {
      id: `photo_${Date.now()}_${frameIndex}`,
      url: canvas.toDataURL("image/png"),
      timestamp: Date.now(),
      by: "both",
    };
  };

  const runCountdownToTarget = (targetMs: number): Promise<void> => {
    return new Promise((resolve) => {
      let lastAnnounced: number | null = null;
      const tick = () => {
        if (cancelledRef.current) {
          resolve();
          return;
        }
        const remaining = Math.ceil((targetMs - Date.now()) / 1000);
        if (remaining > 0) {
          if (remaining !== lastAnnounced) {
            lastAnnounced = remaining;
            setCountdown(remaining);
            playCountdownBeep(remaining === 1);
          }
          countdownTimeoutRef.current = setTimeout(tick, 100);
        } else {
          setCountdown(null);
          resolve();
        }
      };
      tick();
    });
  };

  const waitForCountdownTarget = async (frameIndex: number): Promise<number | null> => {
    while (!cancelledRef.current) {
      try {
        const state = await pollRoomStateRequest(roomCode!);
        if (state.room.status === "done") return null;
        if (state.room.currentFrameIndex === frameIndex && state.room.countdownTarget) {
          return new Date(state.room.countdownTarget).getTime();
        }
      } catch {
        // transient poll failure; keep retrying
      }
      await sleep(1000);
    }
    return null;
  };

  const waitForPartnerHalf = async (frameIndex: number): Promise<string | null> => {
    const partnerSide = mySide === "host" ? "guest" : "host";
    const deadline = Date.now() + PARTNER_WAIT_TIMEOUT_MS;
    setWaitingForPartner(true);
    try {
      while (Date.now() < deadline) {
        if (cancelledRef.current) return null;
        try {
          const state = await pollRoomStateRequest(roomCode!);
          const url = state.frames[frameIndex]?.[partnerSide];
          if (url) return url;
        } catch {
          // transient poll failure; keep retrying
        }
        await sleep(1000);
      }
      return null;
    } finally {
      setWaitingForPartner(false);
    }
  };

  const runConnectedFrame = async (frameIndex: number) => {
    setPartnerWaitTimedOut(false);
    currentFrameIndexRef.current = frameIndex;
    setCurrentFrameIndex(frameIndex);

    let targetMs: number;
    if (mySide === "host") {
      const room = await startCountdownRequest(roomCode!, frameIndex);
      targetMs = room.countdownTarget ? new Date(room.countdownTarget).getTime() : Date.now();
    } else {
      const target = await waitForCountdownTarget(frameIndex);
      if (target === null || cancelledRef.current) {
        setIsCapturing(false);
        return;
      }
      targetMs = target;
    }

    await runCountdownToTarget(targetMs);
    if (cancelledRef.current) return;

    setFlashActive(true);
    playShutterSound();
    setTimeout(() => setFlashActive(false), 200);

    const ownHalfUrl = captureOwnHalfDataUrl();

    try {
      await submitFrameRequest(roomCode!, mySide, frameIndex, ownHalfUrl);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Unable to submit your photo right now.");
    }

    const partnerUrl = await waitForPartnerHalf(frameIndex);
    if (cancelledRef.current) return;

    if (partnerUrl === null) {
      setPartnerWaitTimedOut(true);
      return;
    }

    const composite = await compositeHalves(ownHalfUrl, partnerUrl, frameIndex);
    const updatedCaptured = [...capturedRef.current, composite];
    capturedRef.current = updatedCaptured;
    setCaptured(updatedCaptured);

    const nextIndex = frameIndex + 1;
    if (nextIndex < layout.frames) {
      setTimeout(() => {
        if (!cancelledRef.current) runConnectedFrame(nextIndex);
      }, 1800);
    } else {
      setTimeout(() => {
        setIsCapturing(false);
        onPhotosCaptured(updatedCaptured);
      }, 1500);
    }
  };

  const runConnectedSession = () => {
    cancelledRef.current = false;
    setIsCapturing(true);
    setCaptured([]);
    capturedRef.current = [];
    runConnectedFrame(0);
  };

  const handleRetakeFrame = () => {
    setPartnerWaitTimedOut(false);
    runConnectedFrame(currentFrameIndexRef.current);
  };

  // Guest never manually starts — it follows whatever frame the host starts a countdown for.
  useEffect(() => {
    if (isConnectedSession && roomRole === "guest") {
      runConnectedSession();
    }

    return () => {
      cancelledRef.current = true;
      if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col lg:flex-row items-stretch justify-center max-w-7xl mx-auto px-2 sm:px-4 py-6 gap-8 min-h-[80vh]">
      
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* LEFT COLUMN: THE PHOTOMINI PREVIEW STRIP (Visual representation of the physical strip filling up) */}
      <div className="w-full lg:w-80 flex flex-col items-center justify-start py-4">
        <h3 className="font-mono text-xs uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
          Progress Preview
        </h3>

        {/* Photostrip container */}
        <div
          className={`w-64 rounded-xl p-3 border-2 flex flex-col justify-between shadow-2xl relative overflow-hidden transition-all duration-300`}
          style={{
            backgroundColor: theme.paperColor,
            borderColor: theme.borderColor,
            color: theme.textColor,
          }}
        >
          {/* Theme background overlays */}
          {theme.texture === "paper" && (
            <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-40" />
          )}
          {theme.texture === "grain" && (
            <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
          )}
          {theme.texture === "both" && (
            <>
              <div className="absolute inset-0 bg-paper-texture pointer-events-none opacity-40" />
              <div className="absolute inset-0 bg-noise-grain pointer-events-none" />
            </>
          )}

          {/* Frames stack */}
          <div className="flex flex-col gap-2.5 z-10">
            {Array.from({ length: layout.frames }).map((_, index) => {
              const photo = captured[index];
              const isCurrent = index === currentFrameIndex && isCapturing;

              return (
                <div
                  key={index}
                  className={`relative w-full aspect-[4/3] rounded border border-zinc-200/10 overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? "ring-2 ring-rose-500 scale-[1.01]"
                      : photo
                      ? "opacity-100"
                      : "bg-zinc-200/20 opacity-40 border-dashed border-zinc-400"
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {photo ? (
                      <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        referrerPolicy="no-referrer"
                        src={photo.url}
                        alt={`Slot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-mono text-xs opacity-60">
                          {isCurrent ? "Capturing..." : `Slot ${index + 1}`}
                        </span>
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Footer of preview */}
          <div className="h-10 mt-4 border-t border-zinc-200/20 flex flex-col items-center justify-center z-10">
            <span className={`text-[10px] uppercase tracking-widest ${theme.fontFamily} font-bold opacity-80`}>
              {isLdrMode ? `${userName || "you"} & ${partnerName || "me"}` : (userName || "you")}
            </span>
            <span className="text-[8px] font-mono opacity-50 mt-0.5">
              {new Date().toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: LIVE CAMERA & CONTROLS */}
      <div className="flex-1 flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-2.5 sm:p-6 relative overflow-hidden">
        
        {/* Shutter flash screen */}
        <AnimatePresence>
          {flashActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Top Header Controls bar */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-zinc-50">
              {isConnectedSession
                ? `Joint Booth · You're ${mySide === "host" ? "Left" : "Right"}`
                : isLdrMode
                ? "LDR Collaborative Booth"
                : "Solo Photobooth"}
            </h3>
            <span className="text-xs font-mono bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full font-semibold">
              Frame {currentFrameIndex + 1} / {layout.frames}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* LDR Mode toggle switch (only for the simulated single-device mode) */}
            {!isConnectedSession && (
              <button
                onClick={() => !isCapturing && setIsLdrMode(!isLdrMode)}
                disabled={isCapturing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                  isLdrMode
                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <span>{isLdrMode ? `🌸 Pose with ${partnerName || "Khushi"}` : "👤 Solo Capture"}</span>
              </button>
            )}

            {/* Mirror Cam Toggle */}
            {!isUsingMock && (
              <button
                onClick={() => setIsMirrored(!isMirrored)}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 cursor-pointer hover:bg-zinc-100"
                title="Mirror Camera"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 cursor-pointer hover:bg-zinc-100"
              title={soundEnabled ? "Mute sounds" : "Enable sound effects"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Live Webcam / Mock Feed Screen stage */}
        <div className="relative aspect-[4/3] w-full bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 sm:border-4 border-zinc-200 dark:border-zinc-800">
          
          {/* Grid overlay for alignment assistance */}
          {showGrid && !isCapturing && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
              <div className="border-r border-b border-zinc-100" />
              <div className="border-r border-b border-zinc-100" />
              <div className="border-b border-zinc-100" />
              <div className="border-r border-b border-zinc-100" />
              <div className="border-r border-b border-zinc-100" />
              <div className="border-b border-zinc-100" />
              <div className="border-r border-zinc-100" />
              <div className="border-r border-zinc-100" />
              <div className="bg-transparent" />
            </div>
          )}

          {/* LDR Split line indicator (simulated single-device mode only) */}
          {!isConnectedSession && isLdrMode && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-rose-500/50 dashed z-20 pointer-events-none" />
          )}

          {/* Connected joint session: each device shows only its own live feed */}
          {isConnectedSession ? (
            <div className="w-full h-full relative">
              {isUsingMock ? (
                <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-white">
                  <div className="text-4xl animate-bounce mb-2">{mySide === "host" ? "👦" : "👧"}</div>
                  <span className="font-mono text-[10px] text-zinc-500">Mocking Your Cam</span>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
                />
              )}

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-950/70 backdrop-blur-sm rounded-xl px-4 py-2 text-center max-w-[90%]">
                {waitingForPartner ? (
                  <span className="text-xs text-white font-medium">
                    Waiting for {partnerName || "your partner"} to capture...
                  </span>
                ) : partnerWaitTimedOut ? (
                  <span className="text-xs text-amber-300 font-medium">
                    {partnerName || "Your partner"} hasn't captured this frame yet.
                  </span>
                ) : (
                  <span className="text-xs text-white/80 font-mono">
                    You're on the {mySide === "host" ? "left" : "right"} side of the strip
                  </span>
                )}
              </div>
            </div>
          ) : isUsingMock ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="grid grid-cols-2 h-full w-full">
                {/* Left Side: Mock User Feed */}
                <div className="bg-zinc-950 flex flex-col items-center justify-center text-white border-r border-zinc-800 relative">
                  <div className="text-4xl animate-bounce mb-2">👦</div>
                  <span className="font-mono text-[10px] text-zinc-500">
                    Mocking User Cam
                  </span>
                  
                  {isCapturing && (
                    <span className="absolute bottom-4 left-4 text-[10px] font-mono text-rose-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      REC
                    </span>
                  )}
                </div>

                {/* Right Side: Khushi / Virtual Partner pose display */}
                {isLdrMode ? (
                  <div className="bg-pink-950 flex flex-col items-center justify-center text-white relative">
                    <div className="text-4xl animate-pulse mb-2">👧</div>
                    <span className="font-mono text-[10px] text-pink-400">
                      Khushi's Turn
                    </span>

                    {/* Show pose suggestions/inspiration */}
                    <div className="absolute top-4 right-4 bg-pink-900/60 px-2 py-1 rounded text-[10px]">
                      {currentFrameIndex === 0 && "📸 Pose 1: Cozy Smile"}
                      {currentFrameIndex === 1 && "📸 Pose 2: Free Style!"}
                      {currentFrameIndex === 2 && "📸 Pose 3: Sweet Expression"}
                      {currentFrameIndex === 3 && "📸 Pose 4: Fun & Silly!"}
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-900 flex flex-col items-center justify-center text-zinc-500 border-l border-zinc-800">
                    <span className="text-xs font-mono">Solo Mode</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full relative">
              {/* Actual Video Track */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
              />

              {/* Khushi visual pose overlay for alignment reference */}
              {isLdrMode && (
                <div className="absolute top-0 right-0 w-1/2 h-full bg-pink-500/10 pointer-events-none flex flex-col items-center justify-center border-l border-rose-400">
                  <div className="text-center p-3 bg-zinc-950/70 backdrop-blur-sm rounded-xl max-w-[80%]">
                    <span className="font-mono text-[10px] text-pink-400 block uppercase tracking-wide">
                      Posing with {partnerName || "Khushi"}
                    </span>
                    <span className="text-xs text-white font-medium">
                      {currentFrameIndex === 0 && "Frame 1: Cozy Smile 💖"}
                      {currentFrameIndex === 1 && "Frame 2: Free Choice! ✨"}
                      {currentFrameIndex === 2 && "Frame 3: Sweet Expression 🌸"}
                      {currentFrameIndex === 3 && "Frame 4: Silly & Playful! 😜"}
                      {currentFrameIndex >= 4 && `Frame ${currentFrameIndex + 1}: Have Fun! ⭐`}
                    </span>
                    <span className="block text-[9px] text-zinc-400 mt-1.5 font-mono">
                      Strike any pose you want!
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Realtime Large Countdown Overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none"
              >
                <span className="font-display font-black text-white text-8xl md:text-9xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active indicator on cam */}
          {isCapturing && (
            <div className="absolute top-4 left-4 bg-rose-600 text-white font-mono text-[10px] font-bold tracking-widest px-2 py-0.5 rounded flex items-center gap-1.5 animate-pulse z-20">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE SHOT LOOP
            </div>
          )}
        </div>

        {/* Camera Device Warning / Simulation Option */}
        {cameraError && !isUsingMock && (
          <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                {cameraError}
              </p>
              <button
                onClick={() => setIsUsingMock(true)}
                className="mt-2 text-xs font-bold text-amber-900 dark:text-amber-300 underline cursor-pointer hover:text-amber-700"
              >
                Switch to Virtual Photo Simulation →
              </button>
            </div>
          </div>
        )}

        {/* Bottom Control Actions (Start capture, retake, restart) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
          <button
            onClick={onBack}
            disabled={isCapturing}
            className="w-full sm:w-auto px-6 py-3 border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 font-display font-medium rounded-xl text-zinc-700 dark:text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            ← Themes
          </button>

          {isConnectedSession && partnerWaitTimedOut ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleRetakeFrame}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-display font-bold rounded-xl shadow-lg transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Retake This Frame</span>
            </motion.button>
          ) : isConnectedSession && roomRole === "guest" ? (
            <div className="w-full sm:w-auto px-8 py-3.5 text-center font-mono text-xs text-zinc-400">
              {isCapturing ? "Following the shared countdown..." : "Waiting for host to start..."}
            </div>
          ) : !isCapturing ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={startCaptureSequence}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-display font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>{captured.length > 0 ? "RETAKE & CAPTURE" : "START PHOTOBOOTHS"}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRetake}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-zinc-800 dark:bg-zinc-700 text-white font-display font-medium rounded-xl hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <span>Cancel Capture</span>
            </motion.button>
          )}

          {captured.length > 0 && !isCapturing && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPhotosCaptured(captured)}
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-display font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <span>Next Frame Arranger</span>
              <span className="font-mono ml-1">▷</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
