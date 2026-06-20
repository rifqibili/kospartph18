import React, { useEffect, useRef } from 'react';

export default function WaveBackground({ className = "absolute inset-0 w-full h-full pointer-events-none z-0", colors = ['rgba(201, 168, 76, 0.15)', 'rgba(26, 61, 43, 0.12)', 'rgba(201, 168, 76, 0.08)'] }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        const parent = canvas.parentElement;
        
        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = parent.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
        };
        
        // Use ResizeObserver to respond to parent container size changes
        const observer = new ResizeObserver(resize);
        observer.observe(parent);
        resize();

        let time = 0;
        const draw = () => {
            const width = canvas.width / (window.devicePixelRatio || 1);
            const height = canvas.height / (window.devicePixelRatio || 1);
            
            ctx.clearRect(0, 0, width, height);
            
            // Elegant slow overlapping waves at the bottom of the container
            const waves = [
                { yOffset: height * 0.75, amplitude: height * 0.05, length: 0.003, speed: 0.015, color: colors[0] },
                { yOffset: height * 0.8, amplitude: height * 0.06, length: 0.002, speed: 0.01, color: colors[1] },
                { yOffset: height * 0.85, amplitude: height * 0.04, length: 0.004, speed: 0.02, color: colors[2] },
            ];

            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, height);
                for (let i = 0; i <= width; i += 20) {
                    const y = wave.yOffset + Math.sin(i * wave.length + time * wave.speed) * wave.amplitude;
                    ctx.lineTo(i, y);
                }
                ctx.lineTo(width, height);
                ctx.fillStyle = wave.color;
                ctx.fill();
                ctx.closePath();
            });

            time++;
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [colors]);

    return <canvas ref={canvasRef} className={className} />;
}
