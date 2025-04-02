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



export default function App() {


  if (!userId) {
    return (
      <UserSetup
        onComplete={(newUserId: Id<"users">) => {
        
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
