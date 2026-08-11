"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SlideContent, Lang } from "@/lib/contentKit/topics";
import { CANVAS_W, CANVAS_H, readTokens, loadFonts } from "@/lib/contentKit/canvasCore";
import { STYLES, type DrawSlideAssets } from "@/lib/contentKit/styles";
import { getEditableLayers } from "@/lib/contentKit/editorLayers";
import { UI_STRINGS } from "@/lib/contentKit/uiStrings";

const FONT_FAMILY = "Visby Canvas";
const FONT_FAMILY_ZH = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Heiti SC", sans-serif';
const SWATCHES = ["#FFDAA4", "#9E7C45", "#FFFFFF", "#0F0D0A", "#B08442", "#241505"];
const HISTORY_LIMIT = 30;

interface PosterEditorProps {
  styleId: string;
  slideIndex: number;
  content: SlideContent;
  handle: string;
  lang: Lang;
  assets: DrawSlideAssets;
  filenameBase: string;
  onClose: () => void;
}

// fabric ships no first-party types for a plain CJS/ESM require here; keep this loose rather than fighting the import.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricNS = any;

async function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  // decode() (unlike onload) guarantees the bitmap is fully ready for synchronous drawImage calls --
  // Fabric renders/caches the object as soon as it's added, so a decode race here can leave its
  // internal object cache holding a partially-painted bitmap.
  await img.decode();
  return img;
}

export function PosterEditor({ styleId, slideIndex, content, handle, lang, assets, filenameBase, onClose }: PosterEditorProps) {
  const t = UI_STRINGS[lang];
  const style = STYLES.find((s) => s.id === styleId) ?? STYLES[0];

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fabricRef = useRef<any>(null);
  const fabricNsRef = useRef<FabricNS>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const restoringRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionIsText, setSelectionIsText] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [busy, setBusy] = useState(false);

  const pushHistory = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || restoringRef.current) return;
    const json = JSON.stringify(canvas.toJSON(["layerId"]));
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1);
    stack.push(json);
    if (stack.length > HISTORY_LIMIT) stack.shift();
    historyRef.current = stack;
    historyIndexRef.current = stack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const restoreFromHistory = useCallback((index: number) => {
    const canvas = fabricRef.current;
    const json = historyRef.current[index];
    if (!canvas || !json) return;
    restoringRef.current = true;
    canvas.loadFromJSON(JSON.parse(json)).then(() => {
      canvas.renderAll();
      restoringRef.current = false;
      historyIndexRef.current = index;
      setCanUndo(index > 0);
      setCanRedo(index < historyRef.current.length - 1);
    });
  }, []);

  function resizeCanvas() {
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    // Contain-fit within the container's actual content box (not clientWidth, which includes
    // padding): sizing the canvas past the visible area leaves it clipped by overflow-hidden,
    // and the clipped-off portion never gets composited/painted at all.
    const style = getComputedStyle(container);
    const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availW = container.clientWidth - padX;
    const availH = container.clientHeight - padY;
    const scale = Math.min(availW / CANVAS_W, availH / CANVAS_H);
    const displayWidth = CANVAS_W * scale;
    const displayHeight = CANVAS_H * scale;
    canvas.setDimensions({ width: displayWidth, height: displayHeight });
    canvas.setZoom(scale);
    canvas.renderAll();
  }

  // Mount: build the Fabric canvas, background, and editable layers.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fabricModule = await import("fabric");
      if (cancelled) return;
      fabricNsRef.current = fabricModule;
      await loadFonts();

      const el = canvasElRef.current;
      if (!el || cancelled) return;

      const canvas = new fabricModule.Canvas(el, {
        width: CANVAS_W,
        height: CANVAS_H,
        preserveObjectStacking: true,
        // Retina scaling multiplies the canvas's pixel buffer by devicePixelRatio, but our own
        // setDimensions/setZoom resize logic doesn't stay in sync with that multiplier, leaving
        // most of the buffer unpainted. Export always renders at full 1080px via `multiplier`
        // regardless, so disabling this only affects on-screen editing sharpness, not output quality.
        enableRetinaScaling: false,
      });
      fabricRef.current = canvas;
      restoringRef.current = true; // suppress history pushes while the initial layers are being built

      const tokens = readTokens();

      const bgCanvas = document.createElement("canvas");
      bgCanvas.width = CANVAS_W;
      bgCanvas.height = CANVAS_H;
      const bgCtx = bgCanvas.getContext("2d")!;
      style.drawBackground(bgCtx, tokens, lang, slideIndex);
      // Converted to a real <img> rather than handing Fabric the live <canvas> element directly --
      // canvas-sourced FabricImages don't reliably pick up the canvas's retina/zoom scaling.
      // Added as a regular (non-interactive) object rather than canvas.backgroundImage, which
      // has the same scaling problem.
      const bgImgEl = await loadImageFromSrc(bgCanvas.toDataURL("image/png"));
      const bgImg = new fabricModule.FabricImage(bgImgEl, {
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        hoverCursor: "default",
        objectCaching: false,
      });
      canvas.add(bgImg);
      canvas.sendObjectToBack(bgImg);

      const layers = getEditableLayers(bgCtx, styleId, slideIndex, content, handle, lang, tokens, assets);

      for (const layer of layers) {
        if (layer.kind === "text") {
          const fontFamily = layer.fontFamily ?? (lang === "zh" ? FONT_FAMILY_ZH : FONT_FAMILY);
          const textbox = new fabricModule.Textbox(layer.text, {
            left: layer.left,
            top: layer.top,
            width: layer.width,
            fontSize: layer.fontSize,
            fontWeight: layer.fontWeight,
            fontFamily,
            fill: layer.fill,
            textAlign: layer.textAlign,
          });
          if (layer.gradient) {
            const gradient = new fabricModule.Gradient({
              type: "linear",
              coords: { x1: 0, y1: 0, x2: layer.width, y2: 0 },
              colorStops: [
                { offset: 0, color: layer.gradient.from },
                { offset: 1, color: layer.gradient.to },
              ],
            });
            textbox.set("fill", gradient);
          }
          textbox.set("layerId", layer.id);
          canvas.add(textbox);
        } else {
          const imgEl = typeof layer.source === "string" ? await loadImageFromSrc(layer.source) : layer.source;
          if (cancelled) return;
          const img = new fabricModule.FabricImage(imgEl, { left: layer.left, top: layer.top });
          img.scaleToWidth(layer.width);
          img.set("layerId", layer.id);
          canvas.add(img);
        }
      }

      canvas.renderAll();
      resizeCanvas();

      canvas.on("selection:created", (e: { selected: FabricNS[] }) => {
        setHasSelection(true);
        setSelectionIsText(e.selected?.[0]?.isType?.("Textbox") ?? false);
      });
      canvas.on("selection:updated", (e: { selected: FabricNS[] }) => {
        setHasSelection(true);
        setSelectionIsText(e.selected?.[0]?.isType?.("Textbox") ?? false);
      });
      canvas.on("selection:cleared", () => {
        setHasSelection(false);
        setSelectionIsText(false);
      });
      canvas.on("object:modified", pushHistory);
      canvas.on("object:added", pushHistory);
      canvas.on("object:removed", pushHistory);

      restoringRef.current = false;
      pushHistory();
      setReady(true);
    })();

    window.addEventListener("resize", resizeCanvas);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", resizeCanvas);
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function undo() {
    if (historyIndexRef.current <= 0) return;
    restoreFromHistory(historyIndexRef.current - 1);
  }

  function redo() {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    restoreFromHistory(historyIndexRef.current + 1);
  }

  function addText() {
    const canvas = fabricRef.current;
    const fabricModule = fabricNsRef.current;
    if (!canvas || !fabricModule) return;
    const textbox = new fabricModule.Textbox(lang === "zh" ? "新文字" : lang === "bm" ? "Teks Baharu" : "New Text", {
      left: CANVAS_W / 2 - 150,
      top: CANVAS_H / 2,
      width: 300,
      fontSize: 40,
      fontWeight: 600,
      fontFamily: lang === "zh" ? FONT_FAMILY_ZH : FONT_FAMILY,
      fill: "#FFFFFF",
      textAlign: "center",
    });
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    canvas.renderAll();
  }

  function addImage(file: File) {
    const canvas = fabricRef.current;
    const fabricModule = fabricNsRef.current;
    if (!canvas || !fabricModule) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      const imgEl = await loadImageFromSrc(src);
      const img = new fabricModule.FabricImage(imgEl, { left: CANVAS_W / 2 - 150, top: CANVAS_H / 2 - 150 });
      img.scaleToWidth(300);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    };
    reader.readAsDataURL(file);
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    canvas.remove(obj);
    canvas.discardActiveObject();
    canvas.renderAll();
  }

  function duplicateSelected() {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.clone().then((clone: FabricNS) => {
      clone.set({ left: (obj.left ?? 0) + 24, top: (obj.top ?? 0) + 24 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
    });
  }

  function setColor(color: string) {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    obj.set("fill", color);
    canvas.renderAll();
    pushHistory();
  }

  function bumpFontSize(delta: number) {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj || obj.fontSize === undefined) return;
    obj.set("fontSize", Math.max(10, obj.fontSize + delta));
    canvas.renderAll();
    pushHistory();
  }

  function reset() {
    historyRef.current = [];
    historyIndexRef.current = -1;
    fabricRef.current?.dispose();
    fabricRef.current = null;
    setReady(false);
    // Re-trigger the mount effect's logic by remounting the canvas element via a key change is simplest,
    // but since this component only mounts once per Edit click, closing and reopening achieves the same
    // result -- so Reset just asks the parent to reopen a fresh editor.
    onClose();
  }

  async function exportPng(): Promise<Blob | null> {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    const scale = canvas.getZoom();
    const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 / scale });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function download() {
    setBusy(true);
    const blob = await exportPng();
    setBusy(false);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}-edited.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    setBusy(true);
    const blob = await exportPng();
    setBusy(false);
    if (!blob) return;
    const file = new File([blob], `${filenameBase}-edited.png`, { type: "image/png" });
    const nav = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: "AlphasAxis" });
      } catch {
        // user cancelled
      }
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameBase}-edited.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between border-b border-[var(--gold-border)] px-3 py-2.5">
        <button type="button" onClick={onClose} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[13px]">
          {t.close}
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={undo} disabled={!canUndo} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[13px]">
            {t.undo}
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[13px]">
            {t.redo}
          </button>
          <button type="button" onClick={reset} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[13px]">
            {t.reset}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={download} disabled={busy} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[13px]">
            {t.download}
          </button>
          <button type="button" onClick={share} disabled={busy} className="btn primary !mb-0 !w-auto px-3 py-2 text-[13px]">
            {t.share}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex flex-1 items-center justify-center overflow-hidden p-4">
        <canvas ref={canvasElRef} />
        {!ready && <p className="p-note absolute">{t.loadingAssets}</p>}
      </div>

      <div className="border-t border-[var(--gold-border)] px-3 py-3">
        {hasSelection ? (
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {selectionIsText && (
              <>
                <div className="flex flex-none items-center gap-1.5">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="h-9 w-9 flex-none rounded-full border border-[var(--gold-border)]"
                      style={{ backgroundColor: c }}
                      aria-label={c}
                    />
                  ))}
                  <input
                    type="color"
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-9 flex-none cursor-pointer rounded-full border border-[var(--gold-border)] bg-transparent p-0"
                  />
                </div>
                <div className="flex flex-none items-center gap-1.5">
                  <button type="button" onClick={() => bumpFontSize(-4)} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[15px]">
                    A-
                  </button>
                  <button type="button" onClick={() => bumpFontSize(4)} className="btn secondary !mb-0 !w-auto px-3 py-2 text-[15px]">
                    A+
                  </button>
                </div>
              </>
            )}
            <button type="button" onClick={duplicateSelected} className="btn secondary !mb-0 !w-auto flex-none px-3 py-2 text-[13px]">
              {t.duplicate}
            </button>
            <button type="button" onClick={deleteSelected} className="btn secondary !mb-0 !w-auto flex-none px-3 py-2 text-[13px]">
              {t.delete}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={addText} className="btn secondary !mb-0 !w-auto px-4 py-2 text-[13px]">
              {t.addText}
            </button>
            <label className="btn secondary !mb-0 !w-auto cursor-pointer px-4 py-2 text-[13px]">
              {t.addImage}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) addImage(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
