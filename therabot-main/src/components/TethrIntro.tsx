
import { useEffect, useState } from "react";

type TethrIntroProps = {
  onComplete: () => void;
};

export default function TethrIntro({ onComplete }: TethrIntroProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setExiting(true), 2200);
    const completeTimer = window.setTimeout(onComplete, 2900);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`tethr-intro ${exiting ? "tethr-intro--exit" : ""}`}>
      <div className="tethr-intro__content">
        <div className="tethr-intro__wordmark">
          <span className="tethr-intro__glow" aria-hidden="true">
            TETHR
          </span>
          <span className="tethr-intro__text">TETHR</span>
        </div>
        <p className="tethr-intro__tagline">A SPACE TO RECONNECT.</p>
      </div>
    </div>
  );
}
