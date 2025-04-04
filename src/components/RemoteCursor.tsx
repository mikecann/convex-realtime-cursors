import { useEffect, useRef, useState } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAnimationFrame } from "../utils/hooks";
import "./RemoteCursor.css";

interface RemoteCursorProps {
  userId: Id<"users">;
}

export function RemoteCursor({ userId }: RemoteCursorProps) {
  // Refs for tracking state
  const containerRef = useRef<HTMLDivElement>(null);
  const batchQueueRef = useRef<Doc<"cursorBatches">[]>([]);
  const currentBatchRef = useRef<Doc<"cursorBatches"> | null>(null);
  const batchStartTimeRef = useRef<number>(0);
  const [isClicking, setIsClicking] = useState(false);

  const user = useQuery(api.users.getUser, { userId });
  const cursorBatch = useQuery(api.cursorBatches.find, { userId });

  // Add new batch to the queue when it arrives
  useEffect(() => {
    if (!cursorBatch) return;
    console.log(`${user?.name} batch updated`, cursorBatch);
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
    // So we need to check if any of the actions are due to be played
    const elapsed = Date.now() - batchStartTimeRef.current;
    const currentBatch = currentBatchRef.current;

    // Process actions that are due
    while (currentBatch.actions.length > 0) {
      // Check if its time to action on this yet (we assume the batch is sorted by time)
      // We also cap the time to 1 second to avoid any wierdness from the user around time
      const action = currentBatch.actions[0];
      if (Math.min(action.timeSinceBatchStart, 1000) > elapsed) break;

      // Remove this action from the array as it has now been played
      currentBatch.actions.shift();

      // Update the cursor position with the latest action
      containerRef.current.style.left = `${action.x}px`;
      containerRef.current.style.top = `${action.y}px`;

      // If this is a click, trigger the animations
      if (action.kind === "click" && !isClicking) {
        setIsClicking(true);
        // Remove animation classes after they complete
        setTimeout(() => {
          setIsClicking(false);
        }, 350); // Match the animation duration
      }
    }

    // If we have no actions left, we are done with this batch
    if (currentBatch.actions.length === 0) {
      currentBatchRef.current = null;
    }
  }, []);

  if (!user) return null;

  return (
    <div ref={containerRef} className="cursor-container">
      <div
        className={`cursor-emoji ${isClicking ? "cursor-click cursor-flash" : ""}`}
      >
        {user.emoji}
      </div>
      <div className={`cursor-name ${isClicking ? "cursor-flash" : ""}`}>
        {user.name}
      </div>
    </div>
  );
}
