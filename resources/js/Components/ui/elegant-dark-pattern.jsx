import React from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function ElegantPatternBg({ children, className, id }) {
  return (
    <div id={id} className={cn("relative w-full bg-[#fcfaf5] overflow-hidden", className)}>
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-100 mix-blend-multiply"
          style={{
            background: 'radial-gradient(100% 100% at 0% 0%, rgba(201,168,76,0.08) 0%, rgba(250, 247, 242, 0) 100%)',
            mask: 'radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)',
            WebkitMask: 'radial-gradient(125% 100% at 0% 0%, rgb(0, 0, 0) 0%, rgba(0, 0, 0, 0.224) 88.2883%, rgba(0, 0, 0, 0) 100%)'
          }}
        >
          {/* Skewed fading gold/green streaks (Increased opacity to make it visible on light theme) */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              background: 'linear-gradient(rgba(201, 168, 76, 0.8) 0%, rgba(201, 168, 76, 0) 100%)',
              mask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0) 36%, rgb(0,0,0) 55%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)',
              WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgb(0,0,0) 20%, rgba(0,0,0,0) 36%, rgb(0,0,0) 55%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)',
              transform: 'skewX(45deg)'
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              background: 'linear-gradient(rgba(26, 61, 43, 0.8) 0%, rgba(26, 61, 43, 0) 100%)',
              mask: 'linear-gradient(90deg, rgba(0,0,0,0) 11%, rgb(0,0,0) 25%, rgba(0,0,0,0.55) 41%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)',
              WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 11%, rgb(0,0,0) 25%, rgba(0,0,0,0.55) 41%, rgba(0,0,0,0.13) 67%, rgb(0,0,0) 78%, rgba(0,0,0,0) 97%)',
              transform: 'skewX(45deg)'
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.25]"
            style={{
              background: 'linear-gradient(rgba(201, 168, 76, 0.6) 0%, rgba(201, 168, 76, 0) 100%)',
              mask: 'linear-gradient(90deg, rgba(0,0,0,0) 9%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.424) 40%, rgb(0,0,0) 48%, rgba(0,0,0,0.267) 54%, rgba(0,0,0,0.13) 78%, rgb(0,0,0) 88%, rgba(0,0,0,0) 97%)',
              WebkitMask: 'linear-gradient(90deg, rgba(0,0,0,0) 9%, rgb(0,0,0) 20%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.424) 40%, rgb(0,0,0) 48%, rgba(0,0,0,0.267) 54%, rgba(0,0,0,0.13) 78%, rgb(0,0,0) 88%, rgba(0,0,0,0) 97%)',
              transform: 'skewX(45deg)'
            }}
          />
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-[0.06] bg-repeat mix-blend-multiply"
        style={{
          backgroundImage: 'url("https://framerusercontent.com/images/6mcf62RlDfRfU61Yg5vb2pefpi4.png")',
          backgroundSize: '149.76px'
        }}
      />
      {/* Subtle dot pattern overlay made darker to show on light background */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(26,61,43,0.3) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Subtle radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
