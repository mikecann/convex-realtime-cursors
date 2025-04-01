import { useEffect, useRef, useCallback, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAnimationFrame } from "../utils/hooks";

interface RemoteCursorProps {
  userId: Id<"users">;
}

interface CursorPosition {
  x: number;
  y: number;
  timeSinceBatchStart: number;
}

interface CursorBatch {
  _id: Id<"cursorBatches">;
  userId: Id<"users">;
  movements: CursorPosition[];
  batchTimestamp: number;
}

export function RemoteCursor({ userId }: RemoteCursorProps) {
  // Refs for tracking state
  const containerRef = useRef<HTMLDivElement>(null);
  const movementsQueueRef = useRef<CursorPosition[]>([]);
  const batchStartTimeRef = useRef<number | null>(null);

  const user = useQuery(api.users.getUser, { userId });
  const cursorBatch = useQuery(api.cursors.getCursorBatch, { userId });

  // Add new movements to the queue when a new batch arrives
  useEffect(() => {
    if (!cursorBatch) return;

    // Store the batch start time and add new movements to the queue
    batchStartTimeRef.current = Date.now();
    movementsQueueRef.current = [
      ...movementsQueueRef.current,
      ...cursorBatch.movements,
    ].sort((a, b) => a.timeSinceBatchStart - b.timeSinceBatchStart);

    console.log(`batch changed`, user?.name, cursorBatch);
  }, [cursorBatch, user?.name]);

  // Animation loop using our custom hook
  useAnimationFrame(() => {
    if (!batchStartTimeRef.current) return;

    const elapsedSinceBatchStart = Date.now() - batchStartTimeRef.current;

    // Process movements that are due to be played
    while (
      movementsQueueRef.current.length > 0 &&
      movementsQueueRef.current[0].timeSinceBatchStart <= elapsedSinceBatchStart
    ) {
      const movement = movementsQueueRef.current.shift();

      // Update cursor position
      if (containerRef.current && movement) {
        containerRef.current.style.left = `${movement.x}px`;
        containerRef.current.style.top = `${movement.y}px`;
      }
    }
  }, []);

  if (!user) return null;
  if (!cursorBatch) return null;

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
