import React from 'react';
import { motion } from "framer-motion";

// --- Sub-Components ---
const TestimonialsColumn = ({ className, testimonials, duration = 10 }) => {
  return (
    <div className={className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {testimonials.map(({ text, image, name, role }, i) => (
              <motion.li 
                key={`${index}-${i}`}
                aria-hidden={index === 1 ? "true" : "false"}
                tabIndex={index === 1 ? -1 : 0}
                whileHover={{ 
                  scale: 1.03,
                  y: -8,
                  boxShadow: "0 25px 50px -12px rgba(201, 168, 76, 0.15), 0 10px 10px -5px rgba(201, 168, 76, 0.05)",
                  transition: { type: "spring", stiffness: 400, damping: 17 }
                }}
                className="p-8 rounded-[32px] border border-[rgba(201,168,76,0.15)] shadow-xl shadow-[rgba(26,61,43,0.05)] max-w-xs w-full bg-white transition-all duration-300 cursor-default select-none group focus:outline-none" 
              >
                <blockquote className="m-0 p-0 h-full flex flex-col justify-between">
                  <p className="text-slate-600 leading-relaxed font-medium m-0 mb-6 transition-colors duration-300">
                    "{text}"
                  </p>
                  <footer className="flex items-center gap-4 mt-auto">
                    {image ? (
                        <img
                            width={44}
                            height={44}
                            src={image}
                            alt={`Avatar of ${name}`}
                            className="h-11 w-11 rounded-full object-cover ring-2 ring-[rgba(201,168,76,0.2)] group-hover:ring-[#c9a84c] transition-all duration-300 ease-in-out"
                        />
                    ) : (
                        <div className="h-11 w-11 rounded-full bg-[#1a3d2b]/10 flex items-center justify-center text-[#1a3d2b] font-bold text-lg ring-2 ring-[rgba(201,168,76,0.2)] group-hover:ring-[#c9a84c] transition-all duration-300">
                            {name.charAt(0)}
                        </div>
                    )}
                    <div className="flex flex-col">
                      <cite className="font-bold not-italic tracking-tight leading-5 text-[#1a3d2b] transition-colors duration-300">
                        {name}
                      </cite>
                      <span className="text-xs leading-5 font-semibold uppercase tracking-wider text-[#c9a84c] mt-0.5 transition-colors duration-300">
                        {role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))]}
      </motion.ul>
    </div>
  );
};

export const TestimonialsSection = ({ testimonials = [] }) => {
    // We will expand the testimonials array to have enough items for 3 columns
    // If there are only 3, we repeat them to make it look full.
    let expandedTestimonials = [...testimonials];
    if (expandedTestimonials.length < 9) {
        expandedTestimonials = [...expandedTestimonials, ...expandedTestimonials, ...expandedTestimonials].slice(0, 9);
    }

    const firstColumn = expandedTestimonials.slice(0, 3);
    const secondColumn = expandedTestimonials.slice(3, 6);
    const thirdColumn = expandedTestimonials.slice(6, 9);

    return (
      <section 
        id="testimoni"
        aria-labelledby="testimonials-heading"
        className="bg-white py-24 relative overflow-hidden border-t border-[rgba(201,168,76,0.08)]"
      >
        {/* Amber/Gold Glow Background */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: "radial-gradient(125% 125% at 50% 10%, #ffffff 40%, #c9a84c 100%)",
            backgroundSize: "100% 100%",
          }}
        />
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-7xl px-4 sm:px-6 lg:px-8 z-10 mx-auto"
        >
          <div className="flex flex-col items-center justify-center max-w-[540px] mx-auto mb-16">
            <div className="flex justify-center">
            </div>
  
            <h2 id="testimonials-heading" className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mt-6 text-center text-[#1a3d2b] transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
                Pengalaman Penghuni Kospart
            </h2>
            <p className="text-center mt-5 text-slate-500 text-lg leading-relaxed max-w-sm transition-colors">
                Testimoni tulus dari mereka yang telah merasakan kenyamanan premium di Kospart PH 18.
            </p>
          </div>
  
          <div 
            className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[500px] md:max-h-[740px] overflow-hidden"
            role="region"
            aria-label="Scrolling Testimonials"
          >
            <TestimonialsColumn testimonials={firstColumn} duration={20} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={25} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={22} />
          </div>
        </motion.div>
      </section>
    );
  };
