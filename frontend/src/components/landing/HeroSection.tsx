import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/harbor.jpg";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getDonorPortalPath } from "@/lib/portalRoutes";

const WATER_START = 0.42;
const STRIP_H = 2;

interface Bird {
  x: number;
  y: number;
  speed: number;
  size: number;
  dir: 1 | -1;
  wingPhase: number;
  wingSpeed: number;
  drift: number;
  delay: number;
}

function spawnBird(w: number, h: number, close = false): Bird {
  const dir = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
  const skyH = h * WATER_START;
  if (close) {
    return {
      x: dir === 1 ? -50 : w + 50,
      y: skyH * 0.25 + Math.random() * skyH * 0.5,
      speed: 25 + Math.random() * 20,
      size: 4 + Math.random() * 3,
      dir,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 5 + Math.random() * 3,
      drift: (Math.random() - 0.5) * 4,
      delay: Math.random() * 6,
    };
  }
  return {
    x: dir === 1 ? -30 : w + 30,
    y: skyH * 0.1 + Math.random() * skyH * 0.55,
    speed: 10 + Math.random() * 14,
    size: 1.5 + Math.random() * 2.5,
    dir,
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: 4 + Math.random() * 3,
    drift: (Math.random() - 0.5) * 3,
    delay: Math.random() * 12,
  };
}

function spawnFlock(w: number, h: number): Bird[] {
  const dir = (Math.random() < 0.5 ? 1 : -1) as 1 | -1;
  const skyH = h * WATER_START;
  const count = 3 + Math.floor(Math.random() * 4);
  const baseY = skyH * 0.1 + Math.random() * skyH * 0.4;
  const baseSpeed = 12 + Math.random() * 10;
  const baseSize = 1.5 + Math.random() * 1.5;
  const flock: Bird[] = [];
  for (let i = 0; i < count; i++) {
    const offset = (i - count / 2) * (8 + Math.random() * 6);
    flock.push({
      x: (dir === 1 ? -30 : w + 30) - dir * Math.abs(offset) * 1.5,
      y: baseY + offset + (Math.random() - 0.5) * 10,
      speed: baseSpeed + (Math.random() - 0.5) * 4,
      size: baseSize + (Math.random() - 0.5) * 0.6,
      dir,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 4 + Math.random() * 2,
      drift: (Math.random() - 0.5) * 2,
      delay: Math.random() * 4,
    });
  }
  return flock;
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  wingAngle: number,
  dir: 1 | -1
) {
  const wing = Math.sin(wingAngle) * size * 1.1;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.6 * dir, y - wing);
  ctx.quadraticCurveTo(x - size * 0.5 * dir, y + size * 0.2, x, y);
  ctx.quadraticCurveTo(x + size * 0.5 * dir, y + size * 0.2, x + size * 1.6 * dir, y - wing * 0.8);
  const alpha = size > 3.5 ? 0.55 : 0.45;
  ctx.strokeStyle = `rgba(15,15,20,${alpha})`;
  ctx.lineWidth = Math.max(0.6, size * 0.3);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { authSession } = useAuth();
  const donorPortalPath = getDonorPortalPath(authSession);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = heroImage;
    let mounted = true;

    const birds: Bird[] = [];
    const DISTANT_COUNT = 3;
    let nextCloseAt = 15 + Math.random() * 25;
    let nextFlockAt = 40 + Math.random() * 50;
    let elapsed = 0;

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

      // --- Birds in the sky ---
      const dt = 1 / 60;
      elapsed += dt;

      // Keep a baseline of distant birds
      const distantCount = birds.filter((b) => b.size <= 4).length;
      while (distantCount + (birds.length - distantCount) < DISTANT_COUNT && birds.length < DISTANT_COUNT) {
        birds.push(spawnBird(w, h));
      }

      // Occasionally spawn a closer bird
      if (elapsed >= nextCloseAt) {
        birds.push(spawnBird(w, h, true));
        nextCloseAt = elapsed + 20 + Math.random() * 30;
      }

      // Rarely spawn a flock
      if (elapsed >= nextFlockAt) {
        birds.push(...spawnFlock(w, h));
        nextFlockAt = elapsed + 50 + Math.random() * 70;
      }

      ctx.save();
      for (let i = birds.length - 1; i >= 0; i--) {
        const b = birds[i];
        if (b.delay > 0) {
          b.delay -= dt;
          continue;
        }
        b.x += b.speed * b.dir * dt;
        b.y += b.drift * dt;
        const wingAngle = b.wingPhase + t * b.wingSpeed;
        drawBird(ctx, b.x, b.y, b.size, wingAngle, b.dir);

        const oob =
          (b.dir === 1 && b.x > w + 60) || (b.dir === -1 && b.x < -60);
        if (oob) {
          birds.splice(i, 1);
        }
      }
      ctx.restore();

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

        const vAmp = depth * 8;
        const dy = getWave(y) * vAmp;

        const srcY = sy + ((y + dy) / h) * sh;
        const srcH = (STRIP_H / h) * sh + 0.5;
        ctx.drawImage(img, sx, srcY, sw, srcH, dx, y, w, STRIP_H + 0.5);
      }

      // Visible ripple lines across the water surface
      ctx.save();
      ctx.lineCap = "round";

      const numRipples = 16;
      for (let i = 0; i < numRipples; i++) {
        const progress = (i + 0.5) / numRipples;
        const depth = progress;
        const baseY =
          waterY + progress * waterH + Math.sin(t * 0.3 + i * 0.8) * depth * 8;

        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 3; x < w; x += 3) {
          const yOff =
            Math.sin(x * 0.005 + t * 0.35 + i * 0.9) * (2 + depth * 3) +
            Math.sin(x * 0.013 + t * 0.2 + i * 1.6) * (1 + depth * 2) +
            Math.sin(x * 0.003 + t * 0.12 + i * 0.4) * (1.5 + depth * 2.5);
          ctx.lineTo(x, baseY + yOff);
        }
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = `rgba(210,230,250,${0.02 + depth * 0.07})`;
        ctx.lineWidth = 0.5 + depth * 0.5;
        ctx.stroke();
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
            <Link to={donorPortalPath}>
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
        className="hidden absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 text-white text-xs font-body font-semibold shadow-elevated hover:bg-red-700 transition-colors"
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
