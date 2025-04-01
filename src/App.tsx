import { useState, useEffect } from "react";
import { useQueries, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserSetup } from "./components/UserSetup";
import { Canvas } from "./components/Canvas";
import { Id } from "../convex/_generated/dataModel";
import { makeUseQueryWithStatus } from "convex-helpers/react";
import { SettingsProvider } from "./contexts/SettingsContext";
import { Settings } from "./components/Settings";

export const useQueryWithStatus = makeUseQueryWithStatus(useQueries);

const STORAGE_KEY = "canvas_user_id";

export default function App() {
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    // Try to get userId from localStorage during intialization
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (stored as Id<"users">) : null;
  });

  const { data: user, error } = useQueryWithStatus(
    api.users.getUser,
    userId ? { userId } : "skip",
  );

  useEffect(() => {
    if (!error) return;
    console.error(`error while getting user, resetting`, error);
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, [error]);

  if (!userId) {
    return (
      <UserSetup
        onComplete={(newUserId: Id<"users">) => {
          // Store the new userId in localStorage
          localStorage.setItem(STORAGE_KEY, newUserId);
          setUserId(newUserId);
        }}
      />
    );
  }

  if (!user) return <div>Loading...</div>;

  return (
    <SettingsProvider>
      <Canvas userId={userId} emoji={user.emoji} name={user.name} />
      <Settings />
    </SettingsProvider>
  );
}
