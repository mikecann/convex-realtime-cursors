import { useState, useEffect, useCallback } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useQueryWithStatus } from "../App";

const myUserIdStorageKey = "canvas_user_id";

export const useMe = () => {
  const [userId, setUserId] = useState<Id<"users"> | null>(
    localStorage.getItem(myUserIdStorageKey) as Id<"users"> | null,
  );

  const { data: user, error } = useQueryWithStatus(
    api.users.getUser,
    userId ? { userId } : "skip",
  );

  useEffect(() => {
    if (!error) return;
    console.error(`error while getting user, resetting`, error);
    localStorage.removeItem(myUserIdStorageKey);
    window.location.reload();
  }, [error]);

  return useCallback(
    () => ({
      user,
      setUserId: (id: Id<"users">) => {
        // Store the new userId in localStorage
        localStorage.setItem(myUserIdStorageKey, id);
        setUserId(id);
      },
    }),
    [userId, user],
  );
};
