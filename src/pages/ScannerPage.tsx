import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { hintFromFilename, WASTE_ITEMS } from "../data/items";
import { useApp } from "../context/AppContext";
import { uid } from "../lib/id";
import { ItemFacts } from "../components/ItemFacts";
import type { DisposalCategory } from "../types";
import {
  buttonClass,
  Card,
  CategoryBadge,
  DemoNote,
  EmptyState,
  PageHeader,
} from "../components/ui";

type ScanMethod = "manual" | "filename-hint" | "recognition";
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

type Stage =
  | { name: "capture" }
  | { name: "checking" }
  | {
      name: "pick";
      suggestionId: string | null;
      suggestionNote: string;
    }
  | {
      name: "outside";
      guess: { name: string; category: DisposalCategory; advice: string };
      note: string;
    }
  | {
      name: "result";
      itemId: string;
      method: ScanMethod;
      confidence: string;
      uncertain: boolean;
    };

interface StatusBody {
  acceptsImages?: boolean;
  reason?: string;
}

interface RecognizeBody {
  itemId?: string | null;
  confidence?: number | null;
  uncertain?: boolean;
  note?: string;
  error?: string;
  outside?: { name: string; category: DisposalCategory; advice: string } | null;
}

/** Shrinks a chosen image to a JPEG data URL the scanner can preview and send. */
async function previewFile(file: File) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(
          new Error(
            "This browser could not preview that image. Try a JPG or PNG.",
          ),
        );
      element.src = sourceUrl;
    });
    const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare that image.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

/** Photo capture, Gemini identify, and the manual item picker. */
export function ScannerPage() {
  const { addScan } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [stage, setStage] = useState<Stage>({ name: "capture" });
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [acceptsImages, setAcceptsImages] = useState(false);
  const [query, setQuery] = useState("");
  const [hintId, setHintId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/status", { signal: controller.signal })
      .then((response) => response.json() as Promise<StatusBody>)
      .then((body) => {
        setAcceptsImages(Boolean(body.acceptsImages));
        if (body.reason) setServiceNote(body.reason);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError")
          return;
        setAcceptsImages(false);
      });
    return () => controller.abort();
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => stopCamera, []);

  async function loadImage(file: File) {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Choose an image smaller than 20 MB.");
      return;
    }
    try {
      const url = await previewFile(file);
      stopCamera();
      setPreview(url);
      setFileName(file.name);
      setHintId(hintFromFilename(file.name)?.id ?? null);
      setStage({ name: "capture" });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not preview that image.",
      );
    }
  }

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "This browser cannot open a camera. Upload a photo instead. Nothing was recorded.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError(
        "Camera permission was denied or no camera is available. Upload a photo instead. Nothing was recorded.",
      );
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    setPreview(canvas.toDataURL("image/jpeg", 0.85));
    setFileName("camera-preview.jpg");
    setHintId(null);
    stopCamera();
    setStage({ name: "capture" });
  }

  function openPicker(suggestionId: string | null, suggestionNote: string) {
    setServiceNote(suggestionNote);
    setStage({ name: "pick", suggestionId, suggestionNote });
  }

  async function identify() {
    setStage({ name: "checking" });
    setError("");
    if (!preview || !acceptsImages) {
      openPicker(
        null,
        acceptsImages
          ? "Add a photo first, or choose the item yourself."
          : "Choose the item yourself. The photo was not uploaded.",
      );
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
        signal: controller.signal,
      });
      const body = (await response.json()) as RecognizeBody;
      if (response.ok && !body.itemId && body.outside) {
        setStage({
          name: "outside",
          guess: body.outside,
          note: body.note ?? "",
        });
        return;
      }
      if (!response.ok || !body.itemId) {
        openPicker(
          null,
          body.error ||
            "Gemini could not match this photo to the database. Choose the item yourself. The photo was not saved.",
        );
        return;
      }
      const percent =
        typeof body.confidence === "number"
          ? `${Math.round(body.confidence * 100)}%`
          : "not scored";
      const named =
        WASTE_ITEMS.find((item) => item.id === body.itemId)?.name ?? "an item";
      if (body.uncertain) {
        openPicker(
          body.itemId,
          `Gemini thinks this might be ${named} (${percent}). ${body.note ?? ""} Confirm it or choose a different item. This match is uncertain.`.trim(),
        );
        return;
      }
      addScan({
        id: uid(),
        itemId: body.itemId,
        at: new Date().toISOString(),
        method: "recognition",
        uncertain: false,
      });
      setStage({
        name: "result",
        itemId: body.itemId,
        method: "recognition",
        confidence:
          `${percent}. Gemini matched the photo to the database. ${body.note ?? ""}`.trim(),
        uncertain: false,
      });
    } catch {
      openPicker(
        null,
        "Gemini did not respond in time. Choose the item yourself. The photo was not saved.",
      );
    } finally {
      window.clearTimeout(timer);
    }
  }

  function confirmItem(itemId: string) {
    const suggestionId = stage.name === "pick" ? stage.suggestionId : null;
    const method: ScanMethod =
      suggestionId === itemId
        ? "recognition"
        : hintId === itemId && fileName
          ? "filename-hint"
          : "manual";
    const uncertain = method === "filename-hint" || method === "recognition";
    addScan({
      id: uid(),
      itemId,
      at: new Date().toISOString(),
      method,
      uncertain,
    });
    setStage({
      name: "result",
      itemId,
      method,
      uncertain,
      confidence:
        method === "recognition"
          ? "You confirmed Gemini's uncertain match. The photo was sent to Google and was not saved here."
          : method === "filename-hint"
            ? "Low. This suggestion came from the file name, not from the picture."
            : "Not scored. You selected this item.",
    });
  }

  const choices = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return WASTE_ITEMS;
    return WASTE_ITEMS.filter((item) =>
      [item.name, item.material, item.why, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query]);

  const resultItem =
    stage.name === "result"
      ? WASTE_ITEMS.find((item) => item.id === stage.itemId)
      : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={acceptsImages ? "Gemini" : "Scanner"}
        title="Waste scanner"
        description={
          acceptsImages
            ? "Add a photo, then identify it. A confident match comes from Gemini. A weak match asks you to confirm. D-Trashify does not store the picture."
            : "Add a photo for your own reference, then identify the item yourself. This build does not analyze pictures or upload them."
        }
      />
      {acceptsImages ? (
        <DemoNote>
          {serviceNote ||
            "Gemini is configured. Identify sends the photo to Google. D-Trashify does not store it."}
        </DemoNote>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <h2 className="font-display text-2xl text-forest-900">Photo</h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            D-Trashify does not store the picture. Identify sends it to Gemini only
            when recognition is turned on.
          </p>
          {error ? (
            <p
              className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-900"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {cameraOn ? (
            <div className="mt-4 space-y-3">
              <video
                ref={videoRef}
                className="aspect-video w-full rounded-2xl bg-forest-950 object-cover"
                playsInline
                muted
              />
              <div className="flex flex-wrap gap-2">
                <button
                  className={buttonClass()}
                  type="button"
                  onClick={captureFrame}
                >
                  Use this frame
                </button>
                <button
                  className={buttonClass("secondary")}
                  type="button"
                  onClick={stopCamera}
                >
                  Cancel camera
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`mt-4 rounded-3xl border-2 border-dashed p-4 ${dragging ? "border-leaf-600 bg-leaf-100" : "border-forest-900/15 bg-cream-50"}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) void loadImage(file);
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Selected waste item"
                  className="max-h-72 w-full rounded-2xl object-contain"
                />
              ) : (
                <div className="px-2 py-8 text-center">
                  <p className="font-extrabold text-forest-900">
                    Drop an image here
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    JPG or PNG works best.
                  </p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <label className={buttonClass("secondary")}>
                  <Upload aria-hidden size={16} />
                  Upload image
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void loadImage(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                <button
                  className={buttonClass("secondary")}
                  type="button"
                  onClick={() => void startCamera()}
                >
                  <Camera aria-hidden size={16} />
                  Use camera
                </button>
                {preview ? (
                  <button
                    className={buttonClass("ghost")}
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      setFileName("");
                      setHintId(null);
                      setStage({ name: "capture" });
                    }}
                  >
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={buttonClass()}
              type="button"
              disabled={!preview || stage.name === "checking"}
              onClick={() => void identify()}
            >
              {stage.name === "checking" ? "Identifying…" : "Identify item"}
            </button>
            <button
              className={buttonClass("ghost")}
              type="button"
              onClick={() => {
                setHintId(null);
                openPicker(
                  null,
                  "You skipped the photo. Choose the item from the database. Nothing was analyzed.",
                );
              }}
            >
              Choose without a photo
            </button>
          </div>
          {stage.name === "checking" ? (
            <div
              className="mt-4"
              role="progressbar"
              aria-valuetext={
                acceptsImages
                  ? "Sending the photo to Gemini"
                  : "Checking whether a recognition service is available"
              }
            >
              <div className="h-2 overflow-hidden rounded-full bg-leaf-100">
                <div className="h-full w-1/2 animate-pulse bg-leaf-600" />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {acceptsImages
                  ? "Sending the photo to Gemini. D-Trashify does not keep a copy."
                  : "Checking whether a recognition service is available. Your photo is not being uploaded."}
              </p>
            </div>
          ) : null}
        </Card>

        <Card>
          {stage.name === "capture" || stage.name === "checking" ? (
            <EmptyState title="Waiting to identify">
              Add a photo and choose Identify item, or pick an item from the
              database without a photo.
            </EmptyState>
          ) : null}

          {stage.name === "pick" ? (
            <div className="space-y-4">
              <h2 className="font-display text-2xl text-forest-900">
                Choose the item
              </h2>
              <DemoNote>{serviceNote}</DemoNote>
              {stage.suggestionId ? (
                <p
                  className="rounded-2xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"
                  role="status"
                >
                  {stage.suggestionNote}
                </p>
              ) : null}
              {hintId && hintId !== stage.suggestionId ? (
                <p
                  className="rounded-2xl bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950"
                  role="status"
                >
                  Filename hint only, not image recognition. The file name looks
                  like it might be{" "}
                  {WASTE_ITEMS.find((item) => item.id === hintId)?.name}.
                  Confirm it or choose a different item. This result is
                  uncertain until you do.
                </p>
              ) : null}
              <div>
                <label htmlFor="item-search" className="text-sm font-extrabold">
                  Search the database
                </label>
                <input
                  id="item-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Bottle, battery, pizza box…"
                  className="mt-2 min-h-11 w-full rounded-2xl border border-forest-900/15 px-3"
                />
              </div>
              {choices.length === 0 ? (
                <EmptyState title="No matching items">
                  Try a material, like glass, or a simpler name.
                </EmptyState>
              ) : (
                <ul className="grid max-h-[28rem] gap-2 overflow-auto pr-1">
                  {choices.map((item) => (
                    <li key={item.id}>
                      <button
                        className="flex w-full items-center gap-3 rounded-2xl bg-cream-50 px-3 py-2 text-left hover:bg-leaf-100"
                        type="button"
                        onClick={() => confirmItem(item.id)}
                      >
                        <span className="text-2xl" aria-hidden>
                          {item.emoji}
                        </span>
                        <span>
                          <span className="block font-extrabold text-forest-900">
                            {item.name}
                          </span>
                          <span className="text-sm text-ink-soft">
                            {item.material}
                            {item.id === stage.suggestionId
                              ? " · Gemini suggestion"
                              : ""}
                            {item.id === hintId &&
                            item.id !== stage.suggestionId
                              ? " · filename hint"
                              : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          {stage.name === "outside" ? (
            <div className="space-y-4">
              <p className="text-sm font-extrabold uppercase tracking-wide text-amber-800">
                Not in the D-Trashify database
              </p>
              <h2 className="font-display text-3xl text-forest-900">
                Looks like: {stage.guess.name}
              </h2>
              <CategoryBadge category={stage.guess.category} />
              {stage.guess.advice ? (
                <p className="text-sm leading-6 text-ink-soft">
                  {stage.guess.advice}
                </p>
              ) : null}
              <DemoNote>
                This is an unverified AI guess, not a database entry. It was not
                logged as a scan. Check your city's guidance before relying on
                it.
              </DemoNote>
              <button
                className={buttonClass("secondary")}
                type="button"
                onClick={() =>
                  openPicker(
                    null,
                    "Pick the closest database item, or search for a similar material.",
                  )
                }
              >
                Choose a similar database item
              </button>
            </div>
          ) : null}

          {stage.name === "result" && resultItem ? (
            <div className="space-y-4">
              <ItemFacts
                item={resultItem}
                source="scanner"
                uncertain={stage.uncertain}
                confidence={stage.confidence}
              />
              <button
                className={buttonClass("ghost")}
                type="button"
                onClick={() =>
                  openPicker(
                    null,
                    "Choose a different item. A new choice is recorded as your selection.",
                  )
                }
              >
                Choose a different item
              </button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
