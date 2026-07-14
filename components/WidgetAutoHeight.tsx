"use client";

import { useEffect } from "react";

// Reports the widget's content height to the parent window so an embedding
// iframe (e.g. on copenhagenbikeshow.dk) can resize itself to fit exactly.
export default function WidgetAutoHeight() {
  useEffect(() => {
    const postHeight = () => {
      window.parent.postMessage(
        { type: "cbs-widget-height", height: document.body.scrollHeight },
        "*"
      );
    };
    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  return null;
}
