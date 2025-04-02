import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSettings } from "../contexts/SettingsContext";
import { Me, useMe } from "../contexts/MeContext";

interface CursorPosition {
  x: number;
  y: number;
  timeSinceBatchStart: number;
}

export function MyCursor({ me }: { me: Me }) {
  const { settings } = useSettings();

  // Refs for DOM and cursor state
  const cursorRef = useRef<HTMLDivElement>(null);
  const movementBatchRef = useRef<CursorPosition[]>([]);
  const batchStartTime = useRef<number>(Date.now());
  const lastSampleTime = useRef<number>(0);

  // Convex mutation
  const storeCursorBatch = useMutation(api.cursorBatches.store);

  // Create cursor DOM element and track movements
  useEffect(() => {
    if (!cursorRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Always update the cursor position
      cursorRef.current!.style.left = `${e.clientX}px`;
      cursorRef.current!.style.top = `${e.clientY}px`;

      const now = Date.now();

      // If the last sample was too recent, don't add this one to the batch
      if (now - lastSampleTime.current < settings.samplingInterval) return;

      // Update last sample time
      lastSampleTime.current = now;

      // Add to movement batch
      movementBatchRef.current.push({
        x: e.clientX,
        y: e.clientY,
        timeSinceBatchStart: now - batchStartTime.current,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [settings.samplingInterval]);

  // Send batched cursor movements based on batch interval
  useEffect(() => {
    const sendBatchInterval = setInterval(() => {
      // Always reset the batch start time each tick
      batchStartTime.current = Date.now();

      // If nothing in the batch we dont need to send anything
      if (movementBatchRef.current.length == 0) return;

      // Send the batch to the server
      console.log("Sending batch", movementBatchRef.current);
      storeCursorBatch({
        userId: me._id,
        movements: movementBatchRef.current,
      }).catch((e) => console.error(e));

      // Clear the batch
      movementBatchRef.current = [];
    }, settings.batchInterval);

    return () => clearInterval(sendBatchInterval);
  }, [storeCursorBatch, me._id, settings.batchInterval]);

  return (
    <div
      ref={cursorRef}
      className="fixed flex flex-col items-center gap-1 pointer-events-none z-10"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="text-4xl filter drop-shadow-md">{me.emoji}</div>
      <div className="bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md">
        {me.name}
      </div>
    </div>
  );
}
