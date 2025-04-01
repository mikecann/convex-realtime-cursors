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

  const user = useQuery(api.users.getUser, { userId });
  const cursorBatch = useQuery(api.cursors.getCursorBatch, { userId });

  useEffect(() => {
    if (!cursorBatch) return;
    console.log(`batch changed`, user?.name, cursorBatch);
  }, [cursorBatch?.batchTimestamp]);

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
