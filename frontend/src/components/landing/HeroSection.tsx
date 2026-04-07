import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/harbor.jpg";
import { ShieldAlert, ArrowRight } from "lucide-react";

const WATER_START = 0.42;
const STRIP_H = 3;

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = heroImage;
    let mounted = true;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const coverRect = (w: number, h: number) => {
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = w / h;
      if (cr > ir) {
        const sw = img.naturalWidth;
        const sh = sw / cr;
        return { sx: 0, sy: (img.naturalHeight - sh) / 2, sw, sh };
      }
      const sh = img.naturalHeight;
      const sw = sh * cr;
      return { sx: (img.naturalWidth - sw) / 2, sy: 0, sw, sh };
    };

    const draw = (time: number) => {
      if (!mounted) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      if (w === 0 || h === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { sx, sy, sw, sh } = coverRect(w, h);

      if (reducedMotion) {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        return;
      }

      const t = time * 0.001;
      const waterY = Math.floor(h * WATER_START);
      const srcWaterH = (waterY / h) * sh;

      ctx.drawImage(img, sx, sy, sw, srcWaterH, 0, 0, w, waterY);

      const waterH = h - waterY;

      const getWave = (y: number) =>
        Math.sin(y * 0.015 + t * 0.6) +
        Math.sin(y * 0.028 + t * 1.0 + 2.0) * 0.5 +
        Math.sin(y * 0.008 + t * 0.35 + 5.0) * 0.7 +
        Math.sin(y * 0.05 + t * 1.4 + 0.8) * 0.3 +
        Math.sin(y * 0.07 + t * 0.85 + 3.5) * 0.2;

      for (let row = 0; row < waterH; row += STRIP_H) {
        const y = waterY + row;
        const depth = row / waterH;
        const amp = depth * 4;

        const dx =
          Math.sin(y * 0.022 + t * 0.9) * amp +
          Math.sin(y * 0.017 + t * 0.55 + 1.3) * amp * 0.5 +
          Math.sin(y * 0.033 + t * 1.3 + 2.7) * amp * 0.3;

        const vAmp = depth * 6;
        const dy = getWave(y) * vAmp;

        const srcY = sy + ((y + dy) / h) * sh;
        const srcH = (STRIP_H / h) * sh + 0.5;
        ctx.drawImage(img, sx, srcY, sw, srcH, dx, y, w, STRIP_H + 0.5);
      }

      // Visible ripple highlights and shadows
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let row = 0; row < waterH; row += STRIP_H) {
        const y = waterY + row;
        const depth = row / waterH;
        const slope = (getWave(y + 1) - getWave(y - 1)) * depth;
        const brightness = slope * 1.2;

        if (brightness > 0.01) {
          ctx.fillStyle = `rgba(210,230,250,${Math.min(brightness, 0.6)})`;
          ctx.fillRect(0, y, w, STRIP_H);
        }
      }
      ctx.globalCompositeOperation = "multiply";
      for (let row = 0; row < waterH; row += STRIP_H) {
        const y = waterY + row;
        const depth = row / waterH;
        const slope = (getWave(y + 1) - getWave(y - 1)) * depth;
        const darkness = -slope * 0.9;

        if (darkness > 0.01) {
          const v = Math.max(1.0 - Math.min(darkness, 0.15), 0);
          const c = Math.round(v * 255);
          ctx.fillStyle = `rgb(${c},${c},${Math.min(c + 20, 255)})`;
          ctx.fillRect(0, y, w, STRIP_H);
        }
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    img.onload = () => {
      if (!mounted) return;
      resize();
      animRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);

    return () => {
      mounted = false;
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Hope Harbor exterior"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          role="img"
          aria-label="Hope Harbor with gentle water ripples"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
      </div>

      <div className="relative container pb-20 pt-40 md:pb-28 md:pt-48">
        <div className="max-w-2xl">
          <p className="font-body text-teal-light text-sm tracking-widest uppercase mb-4">
            A 501(c)(3) Nonprofit Organization
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.15] mb-6">
            Every girl deserves
            <br />
            a safe place to heal.
          </h1>
          <p className="font-body text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
            Hope Harbor operates safe homes for survivors of trafficking and
            sexual abuse, providing shelter, counseling, education, and a path
            toward independence.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/donor/login">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-teal-light rounded-full font-body font-semibold px-8 h-12 text-base"
              >
                Support Our Work
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/programs">
              <Button
                variant="ghost"
                size="lg"
                className="text-white/80 hover:text-white hover:bg-white/10 rounded-full font-body h-12 text-base"
              >
                See How We Help
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <button
        className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 text-white text-xs font-body font-semibold shadow-elevated hover:bg-red-700 transition-colors"
        onClick={() => {
          window.location.replace("https://google.com");
        }}
        aria-label="Quick exit — immediately leave this site"
      >
        <ShieldAlert className="h-3.5 w-3.5" />
        Quick Exit
      </button>
    </section>
  );
};

export default HeroSection;
