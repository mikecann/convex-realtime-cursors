import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useQueryWithStatus } from "../utils/hooks";

const myUserIdStorageKey = "canvas_user_id";

export interface Me {
  _id: Id<"users">;
  name: string;
  emoji: string;
}

interface MeContextType {
  me: Me | undefined;
  setUserId: (id: Id<"users">) => void;
}

const MeContext = createContext<MeContextType | null>(null);

export function MeProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(
    localStorage.getItem(myUserIdStorageKey) as Id<"users"> | null,
  );

  const { data: me, error } = useQueryWithStatus(
    api.users.getUser,
    userId ? { userId } : "skip",
  );

  useEffect(() => {
    if (!error) return;
    console.error(`Error while getting user with ID '${userId}': ${error}`);
    localStorage.removeItem(myUserIdStorageKey);
    window.location.reload();
  }, [error, userId]);

  const handleSetUserId = useCallback((id: Id<"users">) => {
    localStorage.setItem(myUserIdStorageKey, id);
    setUserId(id);
  }, []);

  return (
    <MeContext.Provider value={{ me, setUserId: handleSetUserId }}>
      {children}
    </MeContext.Provider>
  );
}

export function useMe() {
  const context = useContext(MeContext);
  if (!context) throw new Error("useMe must be used within a MeProvider");
  return context;
}
