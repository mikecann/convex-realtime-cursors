import { useEffect, useRef, useCallback, useState } from "react";
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

  const user = useQuery(api.users.getUser, { userId });
  const cursorBatch = useQuery(api.cursors.getCursorBatch, { userId });

  // Add new batch to the queue when it arrives
  useEffect(() => {
    if (!cursorBatch) return;
    batchQueueRef.current.push(cursorBatch);
    console.log(`batch changed`, user?.name, cursorBatch);
  }, [cursorBatch, user?.name]);

  // Animation loop using our custom hook
  useAnimationFrame(() => {
    if (!containerRef.current) return;

    let currentBatch: Doc<"cursorBatches"> | null = null;
    let batchStartTime = Date.now();

    // If we arent working on a batch
    if (currentBatch == null) {
      // And there is nothing in the queue, we dont need to do anything
      if (batchQueueRef.current.length === 0) return;

      // Otherwise, get the first batch from the queue
      currentBatch = batchQueueRef.current.shift()!;

      // And record when we start it
      batchStartTime = Date.now();
    }

    // Otherwise, we are working on a batch
    // So we need to check if any of the movements are due to be played
    const elapsed = Date.now() - batchStartTime;
    const movements = currentBatch.movements;

    while (movements.length > 0) {
      const movement = movements.shift();
      if (!movement) continue;
      if (movement.timeSinceBatchStart > elapsed) break;
      // Update the cursor position
      containerRef.current.style.left = `${movement.x}px`;
      containerRef.current.style.top = `${movement.y}px`;
    }

    // If we have no movements left, we are done with this batch
    if (movements.length === 0) currentBatch = null;
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
