import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RemoteCursor } from "./RemoteCursor";

interface OtherCursorsProps {
  userId: Id<"users">;
}

export function OtherCursors({ userId }: OtherCursorsProps) {
  // Get list of active users
  const activeUsers = useQuery(api.users.getActiveUsers);

  if (!activeUsers) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {activeUsers
        .filter((user) => user._id !== userId) // Exclude current user
        .map((user) => (
          <RemoteCursor key={user._id} userId={user._id} />
        ))}
    </div>
  );
}
