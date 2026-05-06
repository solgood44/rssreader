"use client";

type Props = {
  src: string;
  title: string;
};

/** Native controls only — stream stays on Spreaker / enclosure URL. */
export function ExternalAudio({ src, title }: Props) {
  return (
    <audio className="audio-player" controls preload="metadata" src={src}>
      {title}
    </audio>
  );
}
