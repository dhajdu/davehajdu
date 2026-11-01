'use client';

import { useEffect, useRef, useState } from 'react';

// A member on camera: 9:16 card with poster, quote and name. Tap plays with
// sound. Only one clip plays at a time across the page. Clips are hosted by
// Infinite Leverage (Vercel Blob mp4s and YouTube shorts).
const PLAY_EVENT = 'dh:workshop-clip-play';

export type Clip = {
  id: string;
  src: string;
  youtubeId?: string;
  poster: string;
  name: string;
  role: string;
  room: string;
  quote?: string;
  /** Poster already carries the name and quote, so skip the overlay. */
  posterHasText?: boolean;
};

export default function WorkshopClip({ clip }: { clip: Clip }) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onPlay = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== clip.id) {
        ref.current?.pause();
        setActive(false);
      }
    };
    window.addEventListener(PLAY_EVENT, onPlay);
    return () => window.removeEventListener(PLAY_EVENT, onPlay);
  }, [clip.id]);

  function play() {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: clip.id }));
    setActive(true);
  }

  return (
    <figure>
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden bg-[#04102D]">
        {active ? (
          clip.youtubeId ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${clip.youtubeId}?autoplay=1&rel=0&playsinline=1`}
              title={clip.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              ref={ref}
              className="absolute inset-0 w-full h-full object-cover"
              src={clip.src}
              poster={clip.poster}
              controls
              autoPlay
              playsInline
              preload="metadata"
              onEnded={() => setActive(false)}
            />
          )
        ) : (
          <button
            type="button"
            onClick={play}
            aria-label={`Play ${clip.name}`}
            className="group absolute inset-0 w-full h-full text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={clip.poster} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            {clip.posterHasText ? null : (
              <span className="absolute inset-0 bg-gradient-to-t from-[#04102D] via-[#04102D]/30 to-transparent" />
            )}
            <span className="absolute top-3 right-3 w-10 h-10 rounded-full bg-[#6FF2C1] text-[#04102D] flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            </span>
            {clip.posterHasText ? null : (
              <span className="absolute left-4 right-4 bottom-4">
                {clip.quote ? (
                  <span className="block text-white text-[14px] font-semibold leading-snug mb-3">
                    &ldquo;{clip.quote}&rdquo;
                  </span>
                ) : null}
                <span className="block text-white font-bold text-[13px]">{clip.name}</span>
                <span className="block text-white/60 text-[12px]">{clip.role}</span>
              </span>
            )}
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-[11px] font-bold tracking-[0.1em] uppercase text-[#04102D]/50">
        {clip.room}
      </figcaption>
    </figure>
  );
}
