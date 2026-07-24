"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  DEFAULT_DEVICE_ID,
  DEFAULT_PREVIEW_PATH,
  DEVICE_PRESETS,
  getDevicePreset,
  normalizePreviewPath,
} from "@/features/dev/device-presets";
import "@/features/dev/device-mockup.css";

type Orientation = "portrait" | "landscape";

export function DeviceMockupPreview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [pathInput, setPathInput] = useState(DEFAULT_PREVIEW_PATH);
  const [previewPath, setPreviewPath] = useState(DEFAULT_PREVIEW_PATH);
  const [iframeKey, setIframeKey] = useState(0);
  const [scale, setScale] = useState(1);

  const preset = useMemo(() => getDevicePreset(deviceId), [deviceId]);

  const screenWidth =
    orientation === "portrait" ? preset.width : preset.height;
  const screenHeight =
    orientation === "portrait" ? preset.height : preset.width;
  const bezel = preset.kind === "tablet" ? 18 : 12;
  const outerWidth = screenWidth + bezel * 2;
  const outerHeight = screenHeight + bezel * 2;

  const updateScale = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const styles = getComputedStyle(stage);
    const padX =
      (Number.parseFloat(styles.paddingLeft) || 0) +
      (Number.parseFloat(styles.paddingRight) || 0);
    const padY =
      (Number.parseFloat(styles.paddingTop) || 0) +
      (Number.parseFloat(styles.paddingBottom) || 0);
    const availableW = Math.max(stage.clientWidth - padX, 120);
    const availableH = Math.max(stage.clientHeight - padY, 120);
    const next = Math.min(availableW / outerWidth, availableH / outerHeight, 1);
    setScale(Number(next.toFixed(3)));
  }, [outerHeight, outerWidth]);

  useLayoutEffect(() => {
    updateScale();
  }, [updateScale]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }

    const observer = new ResizeObserver(() => updateScale());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [updateScale]);

  const applyPath = (event?: FormEvent) => {
    event?.preventDefault();
    const next = normalizePreviewPath(pathInput);
    setPathInput(next);
    setPreviewPath(next);
    setIframeKey((key) => key + 1);
  };

  const reloadFrame = () => {
    setIframeKey((key) => key + 1);
  };

  const openRaw = () => {
    window.open(previewPath, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="device-mockup">
      <header className="device-mockup__toolbar">
        <p className="device-mockup__brand">
          VectorOS <span>Device</span>
        </p>

        <div className="device-mockup__presets" role="group" aria-label="Device">
          {DEVICE_PRESETS.map((device) => (
            <button
              key={device.id}
              type="button"
              className={
                device.id === deviceId
                  ? "device-mockup__chip is-active"
                  : "device-mockup__chip"
              }
              onClick={() => {
                setDeviceId(device.id);
                if (device.kind === "tablet") {
                  setOrientation("portrait");
                }
              }}
            >
              {device.label}
            </button>
          ))}
        </div>

        <div
          className="device-mockup__orientation"
          role="group"
          aria-label="Orientation"
        >
          {(["portrait", "landscape"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={
                orientation === value
                  ? "device-mockup__chip is-active"
                  : "device-mockup__chip"
              }
              onClick={() => setOrientation(value)}
            >
              {value === "portrait" ? "Portrait" : "Landscape"}
            </button>
          ))}
        </div>

        <form className="device-mockup__path" onSubmit={applyPath}>
          <input
            value={pathInput}
            onChange={(event) => setPathInput(event.target.value)}
            aria-label="Preview path"
            spellCheck={false}
          />
          <button type="submit">Go</button>
          <button type="button" onClick={reloadFrame}>
            Reload
          </button>
        </form>

        <div className="device-mockup__meta">
          <span>
            {screenWidth}×{screenHeight} · {Math.round(scale * 100)}%
          </span>
          <button type="button" className="device-mockup__meta-btn" onClick={openRaw}>
            Open raw
          </button>
        </div>
      </header>

      <div ref={stageRef} className="device-mockup__stage">
        <div
          className="device-mockup__scale"
          style={{ transform: `scale(${scale})` }}
        >
          <div
            className={`device-mockup__device is-${preset.kind}`}
            style={
              {
                "--screen-w": `${screenWidth}px`,
                "--screen-h": `${screenHeight}px`,
                "--radius": `${preset.radius}px`,
                "--bezel": `${bezel}px`,
              } as CSSProperties
            }
          >
            <div className="device-mockup__screen">
              {preset.notch === "island" && orientation === "portrait" ? (
                <div className="device-mockup__island" aria-hidden />
              ) : null}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                title={`Preview ${previewPath}`}
                src={previewPath}
                className="device-mockup__iframe"
              />
              <div className="device-mockup__home" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
