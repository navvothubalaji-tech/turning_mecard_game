import React, { useRef, useState, useEffect } from 'react';
import { ArrowUp, Sparkles, Hand, MessageSquare } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onJump: () => void;
  onInteract: () => void;
  hasNearbyInteraction: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onJump,
  onInteract,
  hasNearbyInteraction,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateKnob(e.touches[0]);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    updateKnob(e.touches[0]);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const updateKnob = (touch: React.Touch) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;

    setKnobPos({ x, y });
    onMove(x / maxRadius, y / maxRadius);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 select-none flex justify-between items-end p-6 md:hidden">
      {/* Left Virtual Joystick */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="pointer-events-auto relative w-28 h-28 rounded-full bg-slate-950/60 border-2 border-cyan-500/40 flex items-center justify-center touch-none shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 border-2 border-white/40 shadow-md transition-transform"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Right Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {hasNearbyInteraction && (
          <button
            onTouchStart={onInteract}
            className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shadow-lg border-2 border-amber-300 active:scale-90 transition cursor-pointer"
          >
            <MessageSquare className="w-6 h-6" />
          </button>
        )}

        <button
          onTouchStart={onJump}
          className="w-14 h-14 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center shadow-lg border-2 border-cyan-400 active:scale-90 transition cursor-pointer"
        >
          <ArrowUp className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
