import { ArrowRight } from "lucide-react";
import React, { useState, Suspense, lazy } from "react";

const Dithering = lazy(() => 
  import("@paper-design/shaders-react").then((mod) => ({ default: mod.Dithering }))
);

export function CTASection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section id="contact" className="py-20 w-full flex justify-center items-center px-4 sm:px-6 lg:px-8 bg-white">
      <div 
        className="w-full max-w-7xl relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden rounded-[40px] border border-[rgba(201,168,76,0.3)] bg-[#132c1f] shadow-[0_30px_60px_rgba(26,61,43,0.3)] min-h-[500px] flex flex-col md:flex-row items-stretch justify-center duration-500">
          <Suspense fallback={<div className="absolute inset-0 bg-[#132c1f]" />}>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
              <Dithering
                colorBack="#00000000"
                colorFront="#c9a84c"
                shape="warp"
                type="4x4"
                speed={isHovered ? 0.6 : 0.2}
                className="w-full h-full"
                minPixelRatio={1}
              />
            </div>
          </Suspense>

          <div className="relative z-10 w-full grid md:grid-cols-2 gap-8 md:gap-16 p-8 md:p-12 lg:p-16 items-center">
            
            <div className="flex flex-col items-start text-left">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.1)] px-4 py-1.5 text-sm font-bold text-[#c9a84c] backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a84c]"></span>
                </span>
                Hubungi Kami
              </div>

              {/* Headline */}
              <h2 className="font-serif text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                Konsultasi Gratis <br />
                <span className="text-[#c9a84c]">dengan Admin Kami.</span>
              </h2>
              
              {/* Description */}
              <p className="text-white/80 text-lg max-w-lg mb-10 leading-relaxed font-medium">
                Punya pertanyaan? Tim admin Kospart siap membantu Anda memilih kamar yang paling sesuai dengan kebutuhan. Kami melayani 24/7.
              </p>

              <div className="space-y-4 w-full mb-10">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="text-[#c9a84c] text-[10px] font-bold uppercase tracking-wider">Alamat</div>
                    <div className="text-white text-sm font-semibold">Komplek PH 18, Palapa, Bandar Lampung</div>
                  </div>
                </div>
              </div>

              {/* Button */}
              <a href="https://wa.me/628980598327?text=Halo%20Kospart%20PH%2018,%20saya%20ingin%20tanya%20tentang%20kamar%20kos." target="_blank" rel="noopener noreferrer" className="group relative inline-flex h-14 items-center justify-center gap-3 overflow-hidden rounded-full bg-[#c9a84c] px-8 text-sm font-bold text-[#132c1f] transition-all duration-300 hover:bg-[#b08e35] hover:scale-[1.02] active:scale-95 hover:ring-4 hover:ring-[#c9a84c]/20">
                <span className="relative z-10">Chat via WhatsApp</span>
                <ArrowRight className="h-4 w-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>

            <div className="w-full h-full min-h-[300px] md:min-h-full rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
              <iframe
                  src="https://maps.google.com/maps?q=-5.416147,105.2535747&z=17&output=embed"
                  className="w-full h-full border-0 min-h-[350px]"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
