import { useEffect, useRef, useCallback } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface OtherCursorsProps {
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

interface CursorAnimation {
  userId: Id<"users">;
  name: string;
  emoji: string;
  element: HTMLDivElement;
  movements: CursorPosition[];
  animationStartTime: number;
  isAnimating: boolean;
}

export function OtherCursors({ userId }: OtherCursorsProps) {
  // Refs for tracking state
  const containerRef = useRef<HTMLDivElement>(null);
  const lastProcessedTimestampsRef = useRef<Record<Id<"users">, number>>({});
  const animationQueuesRef = useRef<Map<Id<"users">, CursorBatch[]>>(new Map());
  const cursorAnimationsRef = useRef<Map<Id<"users">, CursorAnimation>>(
    new Map(),
  );
  const animationFrameIdRef = useRef<number | null>(null);
  const updateQueryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // For triggering re-render when timestamp mapping changes
  const forceRenderCountRef = useRef<number>(0);

  // Convex queries
  const activeUsers = useQuery(api.users.getActiveUsers);
  const recentCursorBatches = useQuery(api.cursors.getRecentCursorBatches, {
    lastProcessedTimestamps: lastProcessedTimestampsRef.current,
  });

  // Create a cursor element
  const createCursorElement = useCallback(
    (cursorEmoji: string, userName: string) => {
      const cursorElement = document.createElement("div");
      cursorElement.className = "fixed flex flex-col items-center gap-1 z-10";
      cursorElement.style.transform = "translate(-50%, -50%)";
      cursorElement.style.pointerEvents = "none";

      const emojiElement = document.createElement("div");
      emojiElement.className = "text-4xl filter drop-shadow-md";
      emojiElement.textContent = cursorEmoji;

      const nameElement = document.createElement("div");
      nameElement.className =
        "bg-slate-800 px-2 py-1 rounded-full text-sm text-white shadow-md";
      nameElement.textContent = userName;

      cursorElement.appendChild(emojiElement);
      cursorElement.appendChild(nameElement);

      return cursorElement;
    },
    [],
  );

  // Update cursor element position
  const updateCursorPosition = useCallback(
    (element: HTMLDivElement, x: number, y: number) => {
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    },
    [],
  );

  // Setup animation loop
  const setupAnimationLoop = useCallback(() => {
    if (animationFrameIdRef.current) return;

    // Define helper to start new animations
    const startNextAnimationForUser = (remoteUserId: Id<"users">) => {
      const queue = animationQueuesRef.current.get(remoteUserId);
      if (!queue || queue.length === 0) return false;

      const animation = cursorAnimationsRef.current.get(remoteUserId);
      if (animation && animation.isAnimating) return false;

      if (!activeUsers) return false;
      const user = activeUsers.find((u) => u._id === remoteUserId);
      if (!user) return false;

      const nextBatch = queue.shift()!;

      let element: HTMLDivElement;
      if (animation) {
        element = animation.element;
      } else {
        element = createCursorElement(user.emoji, user.name);
        if (containerRef.current) {
          containerRef.current.appendChild(element);
        }
      }

      cursorAnimationsRef.current.set(remoteUserId, {
        userId: remoteUserId,
        name: user.name,
        emoji: user.emoji,
        element,
        movements: nextBatch.movements,
        animationStartTime: Date.now(),
        isAnimating: true,
      });

      // Mark batch as processed by updating timestamp
      lastProcessedTimestampsRef.current[remoteUserId] =
        nextBatch.batchTimestamp;

      // Schedule a re-render to update the query params
      if (updateQueryTimeoutRef.current) {
        clearTimeout(updateQueryTimeoutRef.current);
      }
      updateQueryTimeoutRef.current = setTimeout(() => {
        forceRenderCountRef.current++;
        // Force a re-render by updating a state value
        // This is needed to update the query params
        if (containerRef.current) {
          containerRef.current.dataset.renderCount = String(
            forceRenderCountRef.current,
          );
        }
      }, 200);

      return true;
    };

    const animate = () => {
      const now = Date.now();
      let animationsActive = false;

      cursorAnimationsRef.current.forEach((animation, animUserId) => {
        if (!animation.isAnimating) {
          if (startNextAnimationForUser(animUserId)) {
            animationsActive = true;
          }
          return;
        }

        // Calculate animation progress
        const animationTimeElapsed = now - animation.animationStartTime;
        const TOTAL_ANIMATION_TIME = 1000;
        const timePerMovement =
          TOTAL_ANIMATION_TIME / animation.movements.length;

        const currentIndex = Math.min(
          Math.floor(animationTimeElapsed / timePerMovement),
          animation.movements.length - 1,
        );

        const nextIndex = Math.min(
          currentIndex + 1,
          animation.movements.length - 1,
        );

        if (currentIndex < animation.movements.length - 1) {
          animationsActive = true;

          const current = animation.movements[currentIndex];
          const next = animation.movements[nextIndex];

          // Calculate interpolation
          const progress =
            (animationTimeElapsed % timePerMovement) / timePerMovement;
          const x = current.x + (next.x - current.x) * progress;
          const y = current.y + (next.y - current.y) * progress;

          updateCursorPosition(animation.element, x, y);
        } else {
          // Animation complete
          const finalPosition =
            animation.movements[animation.movements.length - 1];
          updateCursorPosition(
            animation.element,
            finalPosition.x,
            finalPosition.y,
          );

          animation.isAnimating = false;

          // Start next animation if available
          if (startNextAnimationForUser(animUserId)) {
            animationsActive = true;
          }
        }
      });

      // Continue animation loop if needed
      if (
        animationsActive ||
        Array.from(cursorAnimationsRef.current.values()).some(
          (anim) => anim.isAnimating,
        )
      ) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameIdRef.current = null;
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [activeUsers, createCursorElement, updateCursorPosition]);

  // Process new cursor batches
  useEffect(() => {
    if (!recentCursorBatches || !activeUsers || !containerRef.current) return;

    let newBatchesAdded = false;

    recentCursorBatches.forEach((batch) => {
      // Skip our own batches
      if (batch.userId === userId) return;

      // Add batch to appropriate queue
      let queue = animationQueuesRef.current.get(batch.userId);
      if (!queue) {
        queue = [];
        animationQueuesRef.current.set(batch.userId, queue);
      }

      // Only add if it's newer than what we've seen
      const lastProcessed =
        lastProcessedTimestampsRef.current[batch.userId] || 0;
      if (batch.batchTimestamp > lastProcessed) {
        queue.push(batch);
        newBatchesAdded = true;
      }
    });

    // If new batches were added, start animations
    if (newBatchesAdded) {
      animationQueuesRef.current.forEach((_, remoteUserId) => {
        const animation = cursorAnimationsRef.current.get(remoteUserId);
        if (!animation || !animation.isAnimating) {
          // Start animation for this user if not already animating
          const user = activeUsers.find((u) => u._id === remoteUserId);
          if (!user) return;

          const queue = animationQueuesRef.current.get(remoteUserId);
          if (queue && queue.length > 0) {
            const batch = queue.shift()!;

            let element: HTMLDivElement;
            if (animation) {
              element = animation.element;
            } else {
              element = createCursorElement(user.emoji, user.name);
              containerRef.current!.appendChild(element);
            }

            cursorAnimationsRef.current.set(remoteUserId, {
              userId: remoteUserId,
              name: user.name,
              emoji: user.emoji,
              element,
              movements: batch.movements,
              animationStartTime: Date.now(),
              isAnimating: true,
            });

            // Mark as processed
            lastProcessedTimestampsRef.current[remoteUserId] =
              batch.batchTimestamp;
          }
        }
      });

      // Start animation loop
      setupAnimationLoop();
    }
  }, [
    recentCursorBatches,
    activeUsers,
    userId,
    createCursorElement,
    setupAnimationLoop,
  ]);

  // Cleanup animations on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      if (updateQueryTimeoutRef.current) {
        clearTimeout(updateQueryTimeoutRef.current);
      }

      cursorAnimationsRef.current.forEach((animation) => {
        animation.element.remove();
      });
      cursorAnimationsRef.current.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      data-render-count={forceRenderCountRef.current}
    />
  );
}
