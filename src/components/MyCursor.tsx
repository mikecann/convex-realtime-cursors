import { useEffect, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSettings } from "../contexts/SettingsContext";
import { Me } from "../contexts/MeContext";

type CursorAction = {
  x: number;
  y: number;
  timeSinceBatchStart: number;
  kind: "movement" | "click";
};

export function MyCursor({ me }: { me: Me }) {
  const { settings } = useSettings();

  // Refs for DOM and cursor state
  const cursorRef = useRef<HTMLDivElement>(null);
  const actionBatchRef = useRef<CursorAction[]>([]);
  const batchStartTime = useRef<number>(Date.now());
  const lastSampleTime = useRef<number>(0);

  // Convex mutation
  const storeCursorBatch = useMutation(api.cursorBatches.store);

  // Create cursor DOM element and track movements and clicks
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
      actionBatchRef.current.push({
        kind: "movement",
        x: e.clientX,
        y: e.clientY,
        timeSinceBatchStart: now - batchStartTime.current,
      });
    };

    const handleClick = (e: MouseEvent) => {
      // Add click to batch immediately without sampling
      actionBatchRef.current.push({
        kind: "click",
        x: e.clientX,
        y: e.clientY,
        timeSinceBatchStart: Date.now() - batchStartTime.current,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
    };
  }, [settings.samplingInterval]);

  // Send batched cursor actions based on batch interval
  useEffect(() => {
    const sendBatchInterval = setInterval(() => {
      // Always reset the batch start time each tick
      batchStartTime.current = Date.now();

      // If nothing in the batch we dont need to send anything
      if (actionBatchRef.current.length == 0) return;

      // Send the batch to the server
      console.log("Sending batch", actionBatchRef.current);
      storeCursorBatch({
        userId: me._id,
        actions: actionBatchRef.current,
      }).catch((e) => console.error(e));

      // Clear the batch
      actionBatchRef.current = [];
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
