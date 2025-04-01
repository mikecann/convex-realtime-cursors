import { useEffect, useState, useCallback, useRef } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface CanvasProps {
  userId: Id<"users">;
  emoji: string;
  name: string;
}

interface CursorPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface CursorAnimation {
  userId: Id<"users">;
  name: string;
  emoji: string;
  currentPosition: CursorPosition;
  movements: CursorPosition[];
  animationStartTime: number;
}

export function Canvas({ userId, emoji, name }: CanvasProps) {
  const [localCursorPos, setLocalCursorPos] = useState<CursorPosition>({
    x: 0,
    y: 0,
    timestamp: Date.now(),
  });

  console.log("tick");

  // For tracking cursor movements in a batch
  const cursorMovementBatch = useRef<CursorPosition[]>([]);

  // Last time we fetched cursor batches
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  // Active cursor animations
  const [cursorAnimations, setCursorAnimations] = useState<CursorAnimation[]>(
    [],
  );

  // Convex mutations and queries
  const storeCursorBatch = useMutation(api.cursors.storeCursorBatch);
  const recentCursorBatches = useQuery(api.cursors.getRecentCursorBatches, {
    sinceTimestamp: lastFetchTime - 500, // Overlap slightly to catch any missed batches
  });
  const activeUsers = useQuery(api.users.getActiveUsers);

  // Process new cursor batches
  useEffect(() => {
    if (!recentCursorBatches || !activeUsers) return;

    const now = Date.now();

    // Create animations for new cursor batches
    const newAnimations = recentCursorBatches
      .filter((batch) => batch.userId !== userId) // Skip our own batches
      .map((batch) => {
        // Find user info
        const user = activeUsers.find((u) => u._id === batch.userId);
        if (!user) return null;

        // Last position or starting animation point
        const currentPosition = batch.movements[0];

        return {
          userId: batch.userId,
          name: user.name,
          emoji: user.emoji,
          currentPosition,
          movements: batch.movements,
          animationStartTime: now,
        };
      })
      .filter(Boolean) as CursorAnimation[];

    if (newAnimations.length > 0) {
      setCursorAnimations((prev) => [...prev, ...newAnimations]);
    }

    setLastFetchTime(now);
  }, [recentCursorBatches, activeUsers, userId]);

  // Animation frame for replaying cursor movements
  useEffect(() => {
    if (cursorAnimations.length === 0) return;

    let animationFrameId: number;

    const animateCursors = () => {
      const now = Date.now();
      let animationsStillRunning = false;

      setCursorAnimations((prev) =>
        prev
          .map((animation) => {
            // Calculate time within the animation
            const animationTimeElapsed = now - animation.animationStartTime;

            // Find the position in the movement array
            // Assuming 1000ms total animation time stretched across all movements
            const TOTAL_ANIMATION_TIME = 1000;
            const timePerMovement =
              TOTAL_ANIMATION_TIME / animation.movements.length;

            const currentMovementIndex = Math.min(
              Math.floor(animationTimeElapsed / timePerMovement),
              animation.movements.length - 1,
            );

            const nextMovementIndex = Math.min(
              currentMovementIndex + 1,
              animation.movements.length - 1,
            );

            if (currentMovementIndex < animation.movements.length - 1) {
              animationsStillRunning = true;

              const current = animation.movements[currentMovementIndex];
              const next = animation.movements[nextMovementIndex];

              // Calculate progress between the current and next position
              const movementProgress =
                (animationTimeElapsed % timePerMovement) / timePerMovement;

              // Interpolate between positions
              const interpolatedX =
                current.x + (next.x - current.x) * movementProgress;
              const interpolatedY =
                current.y + (next.y - current.y) * movementProgress;

              return {
                ...animation,
                currentPosition: {
                  x: interpolatedX,
                  y: interpolatedY,
                  timestamp: now,
                },
              };
            }

            // Animation complete, return the final position
            return {
              ...animation,
              currentPosition:
                animation.movements[animation.movements.length - 1],
            };
          })
          .filter((anim) => {
            // If the animation is more than 3 seconds old and finished, remove it
            const isOld = now - anim.animationStartTime > 3000;
            const isFinished =
              anim.currentPosition ===
              anim.movements[anim.movements.length - 1];
            return !(isOld && isFinished);
          }),
      );

      // Continue the animation loop if there are still running animations
      if (animationsStillRunning) {
        animationFrameId = requestAnimationFrame(animateCursors);
      }
    };

    animationFrameId = requestAnimationFrame(animateCursors);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [cursorAnimations]);

  // Track local cursor position and add to batch
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };

      setLocalCursorPos(newPosition);
      cursorMovementBatch.current.push(newPosition);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Send batched cursor movements every second
  useEffect(() => {
    const sendBatchInterval = setInterval(() => {
      if (cursorMovementBatch.current.length > 0) {
        // Send the batch to the server
        storeCursorBatch({
          userId,
          movements: cursorMovementBatch.current,
        });

        // Clear the batch
        cursorMovementBatch.current = [];
      }
    }, 1000);

    return () => clearInterval(sendBatchInterval);
  }, [storeCursorBatch, userId]);

  const renderCursor = useCallback(
    (x: number, y: number, emoji: string, name: string) => (
      <div
        className="fixed flex flex-col items-center gap-1"
        style={{
          left: x,
          top: y,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      >
        <div className="text-4xl filter drop-shadow-md">{emoji}</div>
        <div className="bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md">
          {name}
        </div>
      </div>
    ),
    [],
  );

  return (
    <div className="fixed inset-0 bg-slate-50">
      {/* Local cursor */}
      {renderCursor(localCursorPos.x, localCursorPos.y, emoji, name)}

      {/* Remote cursors - animated */}
      {cursorAnimations.map((animation) => (
        <div key={`${animation.userId}-${animation.animationStartTime}`}>
          {renderCursor(
            animation.currentPosition.x,
            animation.currentPosition.y,
            animation.emoji,
            animation.name,
          )}
        </div>
      ))}
    </div>
  );
}
