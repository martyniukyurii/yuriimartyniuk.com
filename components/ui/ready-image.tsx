"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/** Reveal each image as a whole, after the browser has decoded its pixels. */
export function ReadyImage({ style, onLoad, ...props }: ImageProps) {
  const [decodedSource, setDecodedSource] = useState<ImageProps["src"] | null>(null);

  return (
    <Image
      {...props}
      style={{ ...style, opacity: decodedSource === props.src ? style?.opacity ?? 1 : 0 }}
      onLoad={async event => {
        const img = event.currentTarget;
        try {
          await img.decode();
        } catch {
          // A decode failure must not reveal a partially loaded image.
          return;
        }
        setDecodedSource(props.src);
        onLoad?.(event);
      }}
    />
  );
}
