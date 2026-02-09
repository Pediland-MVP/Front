"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Save, Mic, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Props = {
  className?: string;
  timerClassName?: string;
  onRecordingComplete?: (file: File) => void;
};

type RecordState = {
  id: number;
  name: string;
  file: any;
};

let recorder: MediaRecorder;
let recordingChunks: BlobPart[] = [];
let timerTimeout: NodeJS.Timeout;

const padWithLeadingZeros = (num: number, length: number): string => {
  return String(num).padStart(length, "0");
};

export const AudioRecorderWithVisualizer = ({
  className,
  timerClassName,
  onRecordingComplete,
}: Props) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const t = useTranslations("AudioRecorderWithVisualizer")
  const [isRecordingFinished, setIsRecordingFinished] =
    useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);
  const [currentRecord, setCurrentRecord] = useState<RecordState>({
    id: -1,
    name: "",
    file: null,
  });

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const seconds = timer % 60;

  const [hourLeft, hourRight] = useMemo(
    () => padWithLeadingZeros(hours, 2).split(""),
    [hours],
  );
  const [minuteLeft, minuteRight] = useMemo(
    () => padWithLeadingZeros(minutes, 2).split(""),
    [minutes],
  );
  const [secondLeft, secondRight] = useMemo(
    () => padWithLeadingZeros(seconds, 2).split(""),
    [seconds],
  );

  const mediaRecorderRef = useRef<{
    stream: MediaStream | null;
    analyser: AnalyserNode | null;
    mediaRecorder: MediaRecorder | null;
    audioContext: AudioContext | null;
  }>({
    stream: null,
    analyser: null,
    mediaRecorder: null,
    audioContext: null,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<any>(null);

  function startRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((stream) => {
          setIsRecording(true);
          const AudioContext = window.AudioContext;
          const audioCtx = new AudioContext();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          mediaRecorderRef.current = {
            stream,
            analyser,
            mediaRecorder: null,
            audioContext: audioCtx,
          };

          const mimeType = MediaRecorder.isTypeSupported("audio/mpeg")
            ? "audio/mpeg"
            : MediaRecorder.isTypeSupported("audio/webm")
              ? "audio/webm"
              : "audio/wav";

          const options = { mimeType };
          mediaRecorderRef.current.mediaRecorder = new MediaRecorder(
            stream,
            options,
          );
          mediaRecorderRef.current.mediaRecorder.start();
          recordingChunks = [];

          recorder = new MediaRecorder(stream);
          recorder.start();
          recorder.ondataavailable = (e) => {
            recordingChunks.push(e.data);
          };
        })
        .catch((error) => {
          alert(error);
          console.log(error);
        });
    }
  }

  function stopRecording() {
    recorder.onstop = () => {
      const recordBlob = new Blob(recordingChunks, {
        type: "audio/wav",
      });

      if (onRecordingComplete) {
        const file = new File([recordBlob], `Audio_${Date.now()}.wav`, {
          type: "audio/wav",
        });
        onRecordingComplete(file);
      }

      setCurrentRecord({
        ...currentRecord,
        file: window.URL.createObjectURL(recordBlob),
      });
      recordingChunks = [];
    };

    recorder.stop();

    setIsRecording(false);
    setIsRecordingFinished(true);
    setTimer(0);
    clearTimeout(timerTimeout);
  }

  function resetRecording() {
    const { mediaRecorder, stream, analyser, audioContext } =
      mediaRecorderRef.current;

    if (mediaRecorder) {
      mediaRecorder.onstop = () => {
        recordingChunks = [];
      };
      mediaRecorder.stop();
    } else {
      alert("recorder instance is null!");
    }

    if (analyser) {
      analyser.disconnect();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    setIsRecording(false);
    setIsRecordingFinished(true);
    setTimer(0);
    clearTimeout(timerTimeout);

    cancelAnimationFrame(animationRef.current || 0);
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasCtx = canvas.getContext("2d");
      if (canvasCtx) {
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      }
    }
  }

  const handleSubmit = () => {
    stopRecording();
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
    const canvasCtx = canvas.getContext("2d");
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const drawWaveform = (dataArray: Uint8Array) => {
      if (!canvasCtx) return;
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      canvasCtx.fillStyle = "#939393";

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
      if (
        !mediaRecorderRef.current?.stream?.getAudioTracks()[0]?.getSettings()
          .sampleRate
      )
        return;
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
          "relative flex h-16 w-full max-w-5xl items-center justify-center gap-2 rounded-md",
          {
            "border p-1": isRecording,
            "border-none p-0": !isRecording,
          },
          className,
        )}
      >
        {isRecording ? (
          <Timer
            hourLeft={hourLeft}
            hourRight={hourRight}
            minuteLeft={minuteLeft}
            minuteRight={minuteRight}
            secondLeft={secondLeft}
            secondRight={secondRight}
            timerClassName={timerClassName}
          />
        ) : null}
        <canvas
          ref={canvasRef}
          className={`bg-background h-full w-full ${
            !isRecording ? "hidden" : "flex"
          }`}
        />
        <div className="flex gap-2">
          {/* Delete recording button */}
          {isRecording ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={resetRecording}
                  size={"icon"}
                  variant={"destructive"}
                >
                  <Trash size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="m-2">
                <span>{t('resetRecording')}</span>
              </TooltipContent>
            </Tooltip>
          ) : null}

          {/* Start and save recording button */}
          <Tooltip>
            <TooltipTrigger asChild>
              {!isRecording ? (
                <Button
                  type="button"
                  onClick={() => startRecording()}
                  size={"icon"}
                >
                  <Mic size={15} />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} size={"icon"}>
                  <Save size={15} />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent className="m-2">
              <span> {!isRecording ? t("recording") : t("save")} </span>
            </TooltipContent>
          </Tooltip>
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
          "text-foreground absolute -top-12 left-0 flex items-center justify-center gap-0.5 rounded-md border p-1.5 font-mono font-medium rtl:flex-row-reverse",
          timerClassName,
        )}
      >
        <span className="bg-background text-foreground rounded-md p-0.5">
          {hourLeft}
        </span>
        <span className="bg-background text-foreground rounded-md p-0.5">
          {hourRight}
        </span>
        <span>:</span>
        <span className="bg-background text-foreground rounded-md p-0.5">
          {minuteLeft}
        </span>
        <span className="bg-background text-foreground rounded-md p-0.5">
          {minuteRight}
        </span>
        <span>:</span>
        <span className="bg-background text-foreground rounded-md p-0.5">
          {secondLeft}
        </span>
        <span className="bg-background text-foreground rounded-md p-0.5">
          {secondRight}
        </span>
      </div>
    );
  },
);
Timer.displayName = "Timer";
