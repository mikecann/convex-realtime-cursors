import { useEffect, useRef, useCallback } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface RemoteCursorProps {
  userId: Id<"users">;
}

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
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
  const lastProcessedTimestampRef = useRef<number>(0);
  const animationQueueRef = useRef<CursorBatch[]>([]);
  const isAnimatingRef = useRef(false);
  const animationFrameIdRef = useRef<number | null>(null);

  // Get user info and cursor batches
  const user = useQuery(api.users.getUser, { userId });
  const recentCursorBatches = useQuery(api.cursors.getRecentCursorBatches, {
    lastProcessedTimestamps: { [userId]: lastProcessedTimestampRef.current },
  });

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimatingRef.current || !containerRef.current) return;

    const now = Date.now();
    const batch = animationQueueRef.current[0];
    if (!batch) {
      isAnimatingRef.current = false;
      animationFrameIdRef.current = null;
      return;
    }

    // Calculate animation progress
    const TOTAL_ANIMATION_TIME = 1000;
    const timePerMovement = TOTAL_ANIMATION_TIME / batch.movements.length;
    const animationStartTime = now - (now % TOTAL_ANIMATION_TIME);
    const animationTimeElapsed = now - animationStartTime;

    const currentIndex = Math.min(
      Math.floor(animationTimeElapsed / timePerMovement),
      batch.movements.length - 1,
    );

    const nextIndex = Math.min(currentIndex + 1, batch.movements.length - 1);

    if (currentIndex < batch.movements.length - 1) {
      const current = batch.movements[currentIndex];
      const next = batch.movements[nextIndex];

      // Calculate interpolation
      const progress =
        (animationTimeElapsed % timePerMovement) / timePerMovement;
      const x = current.x + (next.x - current.x) * progress;
      const y = current.y + (next.y - current.y) * progress;

      containerRef.current.style.transform = `translate(${x}px, ${y}px)`;

      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      const finalPosition = batch.movements[batch.movements.length - 1];
      containerRef.current.style.transform = `translate(${finalPosition.x}px, ${finalPosition.y}px)`;

      // Remove completed batch and update timestamp
      animationQueueRef.current.shift();
      lastProcessedTimestampRef.current = batch.batchTimestamp;

      // Start next batch if available
      if (animationQueueRef.current.length > 0) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
        animationFrameIdRef.current = null;
      }
    }
  }, []);

  // Process new cursor batches
  useEffect(() => {
    if (!recentCursorBatches || !user) return;

    recentCursorBatches.forEach((batch) => {
      if (batch.batchTimestamp > lastProcessedTimestampRef.current) {
        animationQueueRef.current.push(batch);
      }
    });

    // Start animation if not already running
    if (!isAnimatingRef.current && animationQueueRef.current.length > 0) {
      isAnimatingRef.current = true;
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
  }, [recentCursorBatches, user, animate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
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
