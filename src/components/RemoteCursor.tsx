import { useEffect, useRef } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAnimationFrame } from "../utils/hooks";

interface RemoteCursorProps {
  userId: Id<"users">;
}

export function RemoteCursor({ userId }: RemoteCursorProps) {
  // Refs for tracking state
  const containerRef = useRef<HTMLDivElement>(null);
  const batchQueueRef = useRef<Doc<"cursorBatches">[]>([]);
  const currentBatchRef = useRef<Doc<"cursorBatches"> | null>(null);
  const batchStartTimeRef = useRef<number>(0);

  const user = useQuery(api.users.getUser, { userId });
  const cursorBatch = useQuery(api.cursors.getCursorBatch, { userId });

  // Add new batch to the queue when it arrives
  useEffect(() => {
    if (!cursorBatch) return;
    batchQueueRef.current.push(cursorBatch);
  }, [cursorBatch]);

  // Animation loop playing back the cursor movements from the queue
  useAnimationFrame(() => {
    if (!containerRef.current) return;

    // If we aren't working on a batch
    if (currentBatchRef.current === null) {
      // And there is nothing in the queue, we don't need to do anything
      if (batchQueueRef.current.length === 0) return;

      // Otherwise, get the first batch from the queue
      currentBatchRef.current = batchQueueRef.current.shift()!;

      // And record when we start it
      batchStartTimeRef.current = Date.now();
    }

    // Otherwise, we are working on a batch
    // So we need to check if any of the movements are due to be played
    const elapsed = Date.now() - batchStartTimeRef.current;
    const currentBatch = currentBatchRef.current;

    // Process movements that are due
    while (currentBatch.movements.length > 0) {
      // Check if its time to action on this yet
      const movement = currentBatch.movements[0];
      if (Math.min(movement.timeSinceBatchStart, 1000) > elapsed) break;

      // Remove this movement from the array
      currentBatch.movements.shift();

      // Update the cursor position with the latest movement
      containerRef.current.style.left = `${movement.x}px`;
      containerRef.current.style.top = `${movement.y}px`;
    }

    // If we have no movements left, we are done with this batch
    if (currentBatch.movements.length === 0) currentBatchRef.current = null;
  }, []);

  if (!user) return null;

  return (
    <div
      ref={containerRef}
      className="fixed left-0 top-0 flex flex-col items-center gap-1 z-10 pointer-events-none"
      style={{ transform: "translate(-50%, -50%)" }}
    >
      <div className="text-4xl filter drop-shadow-md">{user.emoji}</div>
      <div className="bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md">
        {user.name}
      </div>
    </div>
  );
}
