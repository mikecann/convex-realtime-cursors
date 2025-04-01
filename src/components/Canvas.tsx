import { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface CanvasProps {
  userId: Id<"users">;
  emoji: string;
  name: string;
}

export function Canvas({ userId, emoji, name }: CanvasProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-50">
      <div
        className="fixed flex flex-col items-center gap-1"
        style={{
          left: mousePos.x,
          top: mousePos.y,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      >
        <div className="text-4xl filter drop-shadow-md">{emoji}</div>
        <div className="bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md">
          {name}
        </div>
      </div>
    </div>
  );
}
