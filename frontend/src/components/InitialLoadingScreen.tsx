import { useEffect, useState } from "react";
import { Anchor } from "lucide-react";

interface InitialLoadingScreenProps {
  onComplete: () => void;
}

const ANIMATION_DURATION_MS = 1800;
const FADE_DURATION_MS = 500;

const InitialLoadingScreen = ({ onComplete }: InitialLoadingScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, ANIMATION_DURATION_MS);

    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, ANIMATION_DURATION_MS + FADE_DURATION_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`loading-screen${isExiting ? " loading-screen--exit" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Hope Harbor"
    >
      <div className="loading-screen__glow" aria-hidden="true" />
      <div className="loading-screen__content">
        <Anchor className="loading-screen__anchor" aria-hidden="true" />
      </div>
    </div>
  );
};

export default InitialLoadingScreen;
