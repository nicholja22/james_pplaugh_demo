
import React, { useState, useEffect, useRef, useCallback } from 'react';
import BillingDisplay from './components/BillingDisplay';
import { 
  COST_PER_LAUGH, 
  MAX_BILL, 
  LAUGH_THRESHOLD, 
  COOLDOWN_MS, 
  MODEL_URL 
} from './constants';
import { DetectionStatus } from './types';

// Access faceapi from window as it's loaded via script tag
declare const faceapi: any;

const App: React.FC = () => {
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.LOADING);
  const [totalLaughs, setTotalLaughs] = useState(0);
  const [currentBill, setCurrentBill] = useState(0);
  const [isCooldown, setIsCooldown] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [isMaxed, setIsMaxed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionInterval = useRef<number | null>(null);

  // Initialize Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setStatus(DetectionStatus.READY);
      } catch (err) {
        console.error("Failed to load models", err);
        setStatus(DetectionStatus.ERROR);
      }
    };
    loadModels();
  }, []);

  // Handle Laugh Logic
  const handleLaugh = useCallback(() => {
    if (isCooldown) return;

    setTotalLaughs(prev => prev + 1);
    
    setCurrentBill(prev => {
      if (prev >= MAX_BILL) {
        setIsMaxed(true);
        return prev;
      }
      const newBill = Math.min(prev + COST_PER_LAUGH, MAX_BILL);
      if (newBill >= MAX_BILL) setIsMaxed(true);
      return newBill;
    });

    // Trigger Visual Feedback
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 800);

    // Cooldown logic
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), COOLDOWN_MS);
  }, [isCooldown]);

  // Start Video Feed
  useEffect(() => {
    if (status !== DetectionStatus.READY || !videoRef.current) return;

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setStatus(DetectionStatus.ERROR);
      }
    };

    startVideo();
  }, [status]);

  // Real-time detection loop
  const onPlay = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight
    };
    faceapi.matchDimensions(canvasRef.current, displaySize);

    detectionInterval.current = window.setInterval(async () => {
      if (!videoRef.current) return;
      
      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      if (detections && detections.length > 0) {
        const primaryFace = detections[0];
        const happiness = primaryFace.expressions.happy;

        if (happiness > LAUGH_THRESHOLD) {
          handleLaugh();
        }

        // Draw for visual confirmation in debug
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, displaySize.width, displaySize.height);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
        }
      }
    }, 100);
  }, [handleLaugh]);

  useEffect(() => {
    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, []);

  if (status === DetectionStatus.ERROR) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-red-500 mb-4">System Error</h1>
          <p className="text-zinc-400">Could not initialize camera or face detection models. Please ensure camera permissions are granted and you are online.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-300 ${showFlash ? 'laugh-flash' : ''}`}>
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
          Pay <span className="text-zinc-500">Per</span> Laugh
        </h1>
        <p className="text-zinc-400 font-mono text-sm tracking-widest">REAL-TIME BIOMETRIC BILLING SYSTEM</p>
      </div>

      <BillingDisplay 
        currentBill={currentBill} 
        totalLaughs={totalLaughs} 
        isMaxed={isMaxed} 
      />

      {/* Camera / Theater View */}
      <div className="relative group max-w-4xl w-full aspect-video bg-black rounded-3xl overflow-hidden border-4 border-zinc-800 shadow-2xl">
        {status === DetectionStatus.LOADING && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/90">
            <div className="w-12 h-12 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-400 font-mono animate-pulse">BOOTING AI MODELS...</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={onPlay}
          className="absolute inset-0 w-full h-full object-cover mirror-mode"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Cooldown Overlay */}
        {isCooldown && (
          <div className="absolute bottom-6 right-6 z-30 bg-zinc-900/90 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 backdrop-blur-sm animate-bounce">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
            <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Processing Laugh...</span>
          </div>
        )}

        {/* Instructions Overlay */}
        <div className="absolute top-6 left-6 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-black/60 border border-white/10 p-3 rounded-lg backdrop-blur-sm text-[10px] text-zinc-300 uppercase tracking-widest font-bold">
            <div className="mb-1">Target: Joy Detection</div>
            <div className="mb-1 text-green-400">Fee: {COST_PER_LAUGH.toFixed(2)}€ / Smile</div>
            <div className="text-zinc-500">Cooldown: {COOLDOWN_MS/1000}s</div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 flex gap-8 text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
        <span>Model: TINY-YOLO-V2</span>
        <span>Version: 3.1.2-ALPHA</span>
        <span className="animate-pulse">Status: Monitoring</span>
      </div>

    </div>
  );
};

export default App;
