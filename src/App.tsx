import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { UserSetup } from "./components/UserSetup";
import { Canvas } from "./components/Canvas";
import { Id } from "../convex/_generated/dataModel";

export default function App() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const user = useQuery(api.users.getUser, userId ? { userId } : "skip");

  const handleUserSetupComplete = (newUserId: Id<"users">) => {
    setUserId(newUserId);
  };

  if (!userId || !user) {
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  return <Canvas userId={userId} emoji={user.emoji} name={user.name} />;
}
