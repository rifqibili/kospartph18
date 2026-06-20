import React from 'react';
import { Warp } from "@paper-design/shaders-react";

export function BackgroundShaders({ className = "" }) {
  return (
    <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 ${className}`}>
      <Warp
        style={{ width: "100%", height: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={1}
        colors={["#faf7f2", "#c9a84c", "#ffffff", "#1a3d2b"]} 
      />
    </div>
  );
}
