import * as React from 'react';
import { render, screen, cleanup, waitFor, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The component calls `useTranslations(...)`; without a provider it throws
// "No intl context found", so echo the key back (same stub as MediaContent.test).
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

// Sentry MY-2B: 276 crashes, 100% iOS 17.3–18.2. WebKit before 18.4 supports only
// `audio/mp4` for MediaRecorder — not `audio/mpeg`, `audio/webm` or `audio/wav` — and
// the constructor throws NotSupportedError for anything else, per spec.
const WEBKIT_PRE_18_4 = ['audio/mp4'];
// Chrome/Firefox: WebM is supported, `audio/wav` and `audio/mpeg` are not.
const CHROMIUM = ['audio/webm', 'audio/webm;codecs=opus'];

let supportedTypes: string[] = [];
let constructed: FakeMediaRecorder[] = [];

class FakeMediaRecorder {
  static isTypeSupported(type: string) {
    return supportedTypes.includes(type);
  }

  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: unknown, options?: { mimeType?: string }) {
    if (options?.mimeType && !FakeMediaRecorder.isTypeSupported(options.mimeType)) {
      // Real browser behaviour: NotSupportedError DOMException.
      const err = new Error(`mimeType not supported: ${options.mimeType}`);
      err.name = 'NotSupportedError';
      throw err;
    }
    // With no options the browser picks its own default container, which always works.
    this.mimeType = options?.mimeType ?? supportedTypes[0];
    constructed.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['audio-bytes'], { type: this.mimeType }) });
    this.onstop?.();
  }
}

const track = { stop: vi.fn(), getSettings: () => ({ sampleRate: 48000 }) };
const fakeStream = { getTracks: () => [track], getAudioTracks: () => [track] };

const decodedBuffer = {
  numberOfChannels: 1,
  sampleRate: 48000,
  length: 8,
  getChannelData: () => new Float32Array(8),
};

class FakeAudioContext {
  createAnalyser() {
    return { disconnect: vi.fn(), getByteTimeDomainData: vi.fn(), connect: vi.fn() };
  }
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }
  decodeAudioData() {
    return Promise.resolve(decodedBuffer);
  }
  close() {
    return Promise.resolve();
  }
}

let AudioRecorderWithVisualizer: (typeof import('../AudioRecorder'))['AudioRecorderWithVisualizer'];

beforeEach(async () => {
  constructed = [];
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('alert', vi.fn());
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: FakeAudioContext,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    writable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream) },
  });
  window.URL.createObjectURL = vi.fn(() => 'blob:preview');

  // jsdom 25's Blob has no `arrayBuffer()`, which `recordingToWavBlob` needs.
  if (!Blob.prototype.arrayBuffer) {
    Blob.prototype.arrayBuffer = function () {
      return Promise.resolve(new ArrayBuffer(8));
    };
  }
  // jsdom implements no canvas; the waveform effect calls getContext on mount.
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  })) as unknown as HTMLCanvasElement['getContext'];

  // `recorder` / `recordingChunks` are module-level in AudioRecorder.tsx, so state leaks
  // between tests. Re-import a fresh module per test to keep them isolated.
  vi.resetModules();
  ({ AudioRecorderWithVisualizer } = await import('../AudioRecorder'));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function startRecording(container: HTMLElement) {
  await act(async () => {
    fireEvent.click(container.firstElementChild as HTMLElement);
  });
  await waitFor(() => expect(screen.getByText('saveRecord')).toBeInTheDocument());
}

describe('AudioRecorderWithVisualizer', () => {
  it('records and hands back a wav file on iOS WebKit (only audio/mp4 supported)', async () => {
    supportedTypes = WEBKIT_PRE_18_4;
    const onRecordingComplete = vi.fn();

    const { container } = render(
      <AudioRecorderWithVisualizer onRecordingComplete={onRecordingComplete} />,
    );

    await startRecording(container);

    await act(async () => {
      fireEvent.click(screen.getByText('saveRecord'));
    });

    await waitFor(() => expect(onRecordingComplete).toHaveBeenCalledTimes(1));
    const file = onRecordingComplete.mock.calls[0][0] as File;
    expect(file.type).toBe('audio/wav');
  });

  it('never constructs a MediaRecorder with an unsupported mimeType', async () => {
    supportedTypes = WEBKIT_PRE_18_4;

    const { container } = render(<AudioRecorderWithVisualizer />);
    await startRecording(container);

    expect(constructed.length).toBeGreaterThan(0);
    for (const rec of constructed) {
      expect(supportedTypes).toContain(rec.mimeType);
    }
  });

  it('still records on Chromium (audio/webm supported)', async () => {
    supportedTypes = CHROMIUM;
    const onRecordingComplete = vi.fn();

    const { container } = render(
      <AudioRecorderWithVisualizer onRecordingComplete={onRecordingComplete} />,
    );

    await startRecording(container);
    await act(async () => {
      fireEvent.click(screen.getByText('saveRecord'));
    });

    await waitFor(() => expect(onRecordingComplete).toHaveBeenCalledTimes(1));
  });

  it('does not leave the UI in a recording state when the mic is denied', async () => {
    supportedTypes = WEBKIT_PRE_18_4;
    (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    );

    const { container } = render(<AudioRecorderWithVisualizer />);
    await act(async () => {
      fireEvent.click(container.firstElementChild as HTMLElement);
    });

    await waitFor(() => expect(screen.queryByText('saveRecord')).not.toBeInTheDocument());
    expect(toastError).toHaveBeenCalledWith('micError');
  });
});
