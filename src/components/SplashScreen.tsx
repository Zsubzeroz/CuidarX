import { useState, useEffect } from "react";
import { clinicConfig } from "../config";

interface SplashScreenProps {
  visible: boolean;
}

export default function SplashScreen({ visible }: SplashScreenProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1));
      });
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: "#FAFAF7",
        opacity,
        transition: "opacity 0.5s ease-in-out",
        pointerEvents: opacity === 0 ? "none" : "auto",
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${0.92 + opacity * 0.08})`,
          transition: "opacity 0.6s ease-out 0.1s, transform 0.6s ease-out 0.1s",
        }}
      >
        <img
          src="/logo-fr.png"
          alt={clinicConfig.clinicName}
          style={{ maxWidth: 260, width: "100%", height: "auto" }}
          draggable={false}
        />
      </div>

      <div
        style={{
          opacity: opacity * 0.5,
          transition: "opacity 0.6s ease-out 0.35s",
          marginTop: 28,
        }}
      >
        <div
          className="h-[2px] rounded-full"
          style={{
            width: 100,
            background: "linear-gradient(90deg, transparent, #C9A227, transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.8s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: -200% 0; }
          50% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
