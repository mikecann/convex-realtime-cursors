import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface MyCursorProps {
  userId: Id<"users">;
  emoji: string;
  name: string;
}

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

export function MyCursor({ userId, emoji, name }: MyCursorProps) {
  // Refs for DOM and cursor state
  const cursorRef = useRef<HTMLDivElement>(null);
  const movementBatchRef = useRef<CursorPosition[]>([]);

  // Convex mutation
  const storeCursorBatch = useMutation(api.cursors.storeCursorBatch);

  // Create cursor DOM element and track movements
  useEffect(() => {
    if (!cursorRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };

      // Update cursor position
      cursorRef.current!.style.left = `${e.clientX}px`;
      cursorRef.current!.style.top = `${e.clientY}px`;

      // Add to movement batch
      movementBatchRef.current.push(newPosition);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Send batched cursor movements every second
  useEffect(() => {
    const sendBatchInterval = setInterval(() => {
      if (movementBatchRef.current.length > 0) {
        // Send the batch to the server
        storeCursorBatch({
          userId,
          movements: movementBatchRef.current,
        });

        // Clear the batch
        movementBatchRef.current = [];
      }
    }, 1000);

    return () => clearInterval(sendBatchInterval);
  }, [storeCursorBatch, userId]);

  return (
    <div
      ref={cursorRef}
      className="fixed flex flex-col items-center gap-1 pointer-events-none z-10"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="text-4xl filter drop-shadow-md">{emoji}</div>
      <div className="bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md">
        {name}
      </div>
    </div>
  );
}
