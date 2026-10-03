"use client";
import { useEffect, useRef, useState } from "react";

export default function ImageCropField({ label, value, onChange, hint, ratio = 1.5 }: {
  label: string; value: string; onChange: (value: string) => void; hint?: string; ratio?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [aspect, setAspect] = useState(ratio);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const source = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    setLoaded(false); setError(""); source.current = null;
    const image = new Image(); image.crossOrigin = "anonymous";
    image.onload = () => { if (!cancelled) { source.current = image; setLoaded(true); } };
    image.onerror = () => { if (!cancelled) setError("Couldn't load this photo for cropping. Use a local /photos/ path."); };
    image.src = value.startsWith("public/") ? `/${value.slice(7)}` : value;
    return () => { cancelled = true; };
  }, [value, editing]);
  useEffect(() => {
    const image = source.current, output = canvas.current;
    if (!editing || !loaded || !image || !output) return;
    output.width = 1200; output.height = Math.round(1200 / aspect);
    const scale = Math.max(output.width / image.naturalWidth, output.height / image.naturalHeight) * zoom;
    const width = output.width / scale, height = output.height / scale;
    output.getContext("2d")?.drawImage(image, (image.naturalWidth - width) * x / 100, (image.naturalHeight - height) * y / 100, width, height, 0, 0, output.width, output.height);
  }, [editing, loaded, zoom, x, y, aspect]);
  const apply = () => {
    try { if (!loaded || !canvas.current) return; onChange(canvas.current.toDataURL("image/jpeg", .9)); setEditing(false); }
    catch { setError("This image host doesn't allow cropping. Use a local /photos/ image instead."); }
  };
  return <div className="image-field">
    <label><span>{label}</span><input aria-label={`${label} path`} value={value} onChange={event => { setEditing(false); onChange(event.target.value); }} />{hint && <small>{hint}</small>}</label>
    {value && (editing ? <div className="photo-crop-editor">
      <canvas ref={canvas} aria-label="Crop preview" style={{ width: "100%", height: "auto", display: "block", marginTop: "1rem" }} />
      <label><span>Frame</span><select value={aspect} onChange={event => setAspect(Number(event.target.value))}><option value={1.5}>Cinema / final photo (3:2)</option><option value={16/9}>Phone story (16:9)</option><option value={4/3}>Story (4:3)</option></select></label>
      {([['Zoom', zoom, setZoom, 1, 3, .01], ['Horizontal position', x, setX, 0, 100, 1], ['Vertical position', y, setY, 0, 100, 1]] as const).map(([name, current, setter, min, max, step]) => <label key={name}><span>{name}</span><input type="range" aria-label={name} value={current} min={min} max={max} step={step} onChange={event => setter(Number(event.target.value))} /></label>)}
      <div className="crop-actions"><button type="button" disabled={!loaded} onClick={apply}>Apply crop</button><button type="button" onClick={() => setEditing(false)}>Cancel</button></div>
      <small>Apply the crop, then Save all changes. Your original file stays untouched.</small>
      {error && <p role="alert">{error}</p>}
    </div> : <><div className="editor-image-frame" style={{ aspectRatio: ratio }}><img src={value} alt="" /></div><button type="button" onClick={() => { setZoom(1); setX(50); setY(50); setAspect(ratio); setEditing(true); }}>Crop photo</button></>)}
  </div>;
}
