import { Id } from "../../convex/_generated/dataModel";
import { MyCursor } from "./MyCursor";
import { OtherCursors } from "./OtherCursors";

interface CanvasProps {
  userId: Id<"users">;
  emoji: string;
  name: string;
}

export function Canvas({ userId, emoji, name }: CanvasProps) {
  return (
    <div className="fixed inset-0 bg-slate-50">
      <MyCursor userId={userId} emoji={emoji} name={name} />
      <OtherCursors userId={userId} />
    </div>
  );
}
