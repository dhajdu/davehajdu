'use client';

import { useEffect, useRef, useState } from 'react';

// ::widevideo is always 16:9. ::video checks the file and shrinks to phone width if it's vertical.
export default function PostVideo({ src, poster, wide }: { src?: string; poster?: string; wide?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [tall, setTall] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || wide) return;
    const check = () => setTall(v.videoHeight > v.videoWidth);
    // Metadata can arrive before hydration, so check now as well as on the event.
    if (v.readyState >= 1) check();
    v.addEventListener('loadedmetadata', check);
    return () => v.removeEventListener('loadedmetadata', check);
  }, [wide]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      preload="metadata"
      src={src}
      poster={poster}
      className={`block mx-auto bg-[#04102D] ${tall ? 'h-[min(78vh,720px)] w-auto max-w-full' : 'w-full aspect-video'}`}
    />
  );
}
