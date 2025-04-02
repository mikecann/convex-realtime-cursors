import { Id } from "../../convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { RemoteCursor } from "./RemoteCursor";

interface OtherCursorsProps {
  myUserId: Id<"users">;
}

export function OtherCursors({ myUserId }: OtherCursorsProps) {
  // Get list of active users
  const activeUsers = useQuery(api.users.getActiveUsers);
  if (!activeUsers) return null;

  return (
    <div className="fixed inset-0 pointer-events-none">
      {activeUsers
        .filter((user) => user._id !== myUserId) // Exclude me
        .map((user) => (
          <RemoteCursor key={user._id} userId={user._id} />
        ))}
    </div>
  );
}
