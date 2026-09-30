"use client";

import { useLayoutEffect, useRef } from "react";

/** Fit the natural scene size into its available space without cropping or scrolling. */
export default function SceneFit({ children }: { children: React.ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const frame = viewport.current;
    const page = content.current;
    if (!frame || !page) return;
    let animationFrame = 0;
    const fit = () => {
      const width = Math.max(page.offsetWidth, page.scrollWidth);
      const height = Math.max(page.offsetHeight, page.scrollHeight);
      const scale = Math.min(1, frame.clientWidth / Math.max(1, width), frame.clientHeight / Math.max(1, height));
      page.style.setProperty("--scene-scale", String(scale));
    };
    const scheduleFit = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(fit);
    };
    fit();
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(frame);
    observer.observe(page);
    // Fonts and photos can finish loading after the first layout.
    page.addEventListener("load", scheduleFit, true);
    document.fonts.addEventListener("loadingdone", scheduleFit);
    window.visualViewport?.addEventListener("resize", scheduleFit);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      page.removeEventListener("load", scheduleFit, true);
      document.fonts.removeEventListener("loadingdone", scheduleFit);
      window.visualViewport?.removeEventListener("resize", scheduleFit);
    };
  }, []);

  return <div className="editorial-content" ref={viewport}>
    <div className="scene-fit-content" ref={content}>{children}</div>
  </div>;
}
