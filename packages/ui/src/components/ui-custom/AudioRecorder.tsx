'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ArrowsCounterClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowsCounterClockwise';
import { CheckIcon } from '@phosphor-icons/react/dist/ssr/Check';
import { MicrophoneIcon } from '@phosphor-icons/react/dist/ssr/Microphone';

type Props = {
  className?: string;
  timerClassName?: string;
  onRecordingComplete?: (file: File) => void;
};

// Deliberately typed as nullable: it is only assigned once `startRecording` has fully
// succeeded, so every read has to be guarded. Typing it as a bare `MediaRecorder` is what
// let `stopRecording` dereference it unchecked (Sentry MY-2B).
let recorder: MediaRecorder | null = null;
let recordingChunks: BlobPart[] = [];
let timerTimeout: NodeJS.Timeout;

const padWithLeadingZeros = (num: number, length: number): string => {
  return String(num).padStart(length, '0');
};

const writeAsciiString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

const audioBufferToWavBlob = (audioBuffer: AudioBuffer): Blob => {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = audioBuffer.length * blockAlign;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAsciiString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAsciiString(view, 8, 'WAVE');
  writeAsciiString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeAsciiString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const channelData = Array.from({ length: numChannels }, (_, channel) =>
    audioBuffer.getChannelData(channel),
  );

  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

// MediaRecorder's real output codec (e.g. WebM/Opus in Chrome, MP4/AAC in Safari) never
// matches what we label the upload as. The backend sniffs actual file bytes, so we decode
// the recording and re-encode it as a genuine WAV container before handing it off.
const recordingToWavBlob = async (recordedBlob: Blob): Promise<Blob> => {
  const arrayBuffer = await recordedBlob.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return audioBufferToWavBlob(audioBuffer);
  } finally {
    await audioCtx.close();
  }
};

export const AudioRecorderWithVisualizer = ({
  className,
  timerClassName,
  onRecordingComplete,
}: Props) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const t = useTranslations('AudioRecorderWithVisualizer');
  const [isRecordingFinished, setIsRecordingFinished] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const seconds = timer % 60;

  const [hourLeft, hourRight] = useMemo(() => padWithLeadingZeros(hours, 2).split(''), [hours]);
  const [minuteLeft, minuteRight] = useMemo(
    () => padWithLeadingZeros(minutes, 2).split(''),
    [minutes],
  );
  const [secondLeft, secondRight] = useMemo(
    () => padWithLeadingZeros(seconds, 2).split(''),
    [seconds],
  );

  const mediaRecorderRef = useRef<{
    stream: MediaStream | null;
    analyser: AnalyserNode | null;
    audioContext: AudioContext | null;
  }>({
    stream: null,
    analyser: null,
    audioContext: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<any>(null);

  // Tears down the mic stream, analyser and audio context. Safe to call more than once.
  function releaseStream() {
    const { stream, analyser, audioContext } = mediaRecorderRef.current;

    if (analyser) {
      analyser.disconnect();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext && audioContext.state !== 'closed') {
      // Already-closed contexts reject; nothing to recover from either way.
      void audioContext.close().catch(() => {});
    }

    mediaRecorderRef.current = { stream: null, analyser: null, audioContext: null };
  }

  function startRecording(e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) {
    e.stopPropagation();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          const AudioContext = window.AudioContext;
          const audioCtx = new AudioContext();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          mediaRecorderRef.current = {
            stream,
            analyser,
            audioContext: audioCtx,
          };

          // No `mimeType` option on purpose. Every browser supports its own default
          // container, but an explicit one throws NotSupportedError where it is not
          // supported — WebKit before 18.4 offers only `audio/mp4`, so the old
          // mpeg -> webm -> wav fallback landed on an unsupported `audio/wav` and threw
          // on every iOS device (Sentry MY-2B). Whatever codec the browser picks is
          // re-encoded to real WAV by `recordingToWavBlob` before upload anyway.
          recordingChunks = [];
          recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (event) => {
            recordingChunks.push(event.data);
          };
          recorder.start();

          // Only now is there something to stop: entering the recording state any
          // earlier leaves the Save button wired to a recorder that does not exist.
          setIsRecording(true);
        })
        .catch((error) => {
          console.error(error);
          toast.error(t('micError'));
          releaseStream();
          setIsRecording(false);
        });
    }
  }

  function stopRecording(e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) {
    e.stopPropagation();

    const activeRecorder = recorder;

    // `startRecording` may have failed after the UI already flipped into the recording
    // state. Reset instead of dereferencing a recorder that was never created.
    if (!activeRecorder || activeRecorder.state === 'inactive') {
      recordingChunks = [];
      releaseStream();
      setIsRecording(false);
      setTimer(0);
      clearTimeout(timerTimeout);
      return;
    }

    activeRecorder.onstop = async () => {
      const recordedBlob = new Blob(recordingChunks, { type: activeRecorder.mimeType });
      recordingChunks = [];

      let wavBlob: Blob;
      try {
        wavBlob = await recordingToWavBlob(recordedBlob);
      } catch (error) {
        console.error(error);
        toast.error(t('encodeError'));
        return;
      }

      if (onRecordingComplete) {
        const file = new File([wavBlob], `Audio_${Date.now()}.wav`, {
          type: 'audio/wav',
        });
        onRecordingComplete(file);
      }
    };

    activeRecorder.stop();
    releaseStream();

    setIsRecording(false);
    setIsRecordingFinished(true);
    setTimer(0);
    clearTimeout(timerTimeout);
  }

  function resetRecording(e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) {
    e.stopPropagation();
    if (recorder && recorder.state !== 'inactive') {
      // Discard whatever was captured rather than handing it to `onRecordingComplete`.
      recorder.onstop = () => {
        recordingChunks = [];
      };
      recorder.stop();
    } else {
      recordingChunks = [];
    }

    releaseStream();
    setIsRecording(false);
    setIsRecordingFinished(true);
    setTimer(0);
    clearTimeout(timerTimeout);

    cancelAnimationFrame(animationRef.current || 0);
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasCtx = canvas.getContext('2d');
      if (canvasCtx) {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      }
    }
  }

  const handleSubmit = (e: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    stopRecording(e);
  };

  useEffect(() => {
    if (isRecording) {
      timerTimeout = setTimeout(() => {
        setTimer(timer + 1);
      }, 1000);
    }
    return () => clearTimeout(timerTimeout);
  }, [isRecording, timer]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const drawWaveform = (dataArray: Uint8Array) => {
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.fillStyle = '#939393';

      const barWidth = 1;
      const spacing = 1;
      const maxBarHeight = HEIGHT / 2.5;
      const numBars = Math.floor(WIDTH / (barWidth + spacing));

      for (let i = 0; i < numBars; i++) {
        const barHeight = Math.pow(dataArray[i] / 128.0, 8) * maxBarHeight;
        const x = (barWidth + spacing) * i;
        const y = HEIGHT / 2 - barHeight / 2;
        canvasCtx.fillRect(x, y, barWidth, barHeight);
      }
    };

    const visualizeVolume = () => {
      if (!mediaRecorderRef.current?.stream?.getAudioTracks()[0]?.getSettings().sampleRate) return;
      const bufferLength =
        (mediaRecorderRef.current?.stream?.getAudioTracks()[0]?.getSettings()
          .sampleRate as number) / 100;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isRecording) {
          cancelAnimationFrame(animationRef.current || 0);
          return;
        }
        animationRef.current = requestAnimationFrame(draw);
        mediaRecorderRef.current?.analyser?.getByteTimeDomainData(dataArray);
        drawWaveform(dataArray);
      };

      draw();
    };

    if (isRecording) {
      visualizeVolume();
    } else {
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      }
      cancelAnimationFrame(animationRef.current || 0);
    }

    return () => {
      cancelAnimationFrame(animationRef.current || 0);
    };
  }, [isRecording]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-background text-muted-foreground hover:bg-muted/50 relative flex min-h-20 cursor-pointer items-center justify-center rounded-lg border py-2 transition-colors',
          className,
        )}
        onClick={(e) => startRecording(e)}
      >
        {isRecording ? (
          <div className="lex h-full w-full flex-col items-center justify-center">
            <div className="flex w-full flex-col items-center justify-center gap-x-1 px-10">
              <div className="flex w-6/12 flex-col items-center justify-center">
                <canvas ref={canvasRef} className={`bg-background flex h-12 w-full`} />

                <Timer
                  hourLeft={hourLeft}
                  hourRight={hourRight}
                  minuteLeft={minuteLeft}
                  minuteRight={minuteRight}
                  secondLeft={secondLeft}
                  secondRight={secondRight}
                  timerClassName={timerClassName}
                />
              </div>
              <div className="flex w-6/12 items-center justify-center gap-x-2">
                <Button
                  className="text-primary h-7 text-xs"
                  type="button"
                  onClick={handleSubmit}
                  variant="ghost"
                >
                  <CheckIcon weight="bold" size={15} />
                  {t('saveRecord')}
                </Button>

                <Button
                  className="h-7 text-xs hover:text-red-500"
                  type="button"
                  onClick={resetRecording}
                  variant={'ghost'}
                >
                  <ArrowsCounterClockwiseIcon size={15} />
                  {t('recordAgain')}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex gap-2">
          {!isRecording ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-y-2 p-3">
              <MicrophoneIcon size={40} />
              <p>{t('title')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </TooltipProvider>
  );
};

const Timer = React.memo(
  ({
    hourLeft,
    hourRight,
    minuteLeft,
    minuteRight,
    secondLeft,
    secondRight,
    timerClassName,
  }: {
    hourLeft: string;
    hourRight: string;
    minuteLeft: string;
    minuteRight: string;
    secondLeft: string;
    secondRight: string;
    timerClassName?: string;
  }) => {
    return (
      <div
        className={cn(
          'text-foreground flex items-center justify-center gap-0.5 rounded-md font-mono font-medium rtl:flex-row-reverse',
          timerClassName,
        )}
      >
        <span className="bg-background text-foreground rounded-md p-0.5">{hourLeft}</span>
        <span className="bg-background text-foreground rounded-md p-0.5">{hourRight}</span>
        <span>:</span>
        <span className="bg-background text-foreground rounded-md p-0.5">{minuteLeft}</span>
        <span className="bg-background text-foreground rounded-md p-0.5">{minuteRight}</span>
        <span>:</span>
        <span className="bg-background text-foreground rounded-md p-0.5">{secondLeft}</span>
        <span className="bg-background text-foreground rounded-md p-0.5">{secondRight}</span>
      </div>
    );
  },
);
Timer.displayName = 'Timer';
