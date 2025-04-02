import { MyCursor } from "./MyCursor";
import { OtherCursors } from "./OtherCursors";
import { useMe } from "../contexts/MeContext";

export function Canvas() {
  const { me } = useMe();
  if (!me) return null;
  return (
    <div className="fixed inset-0 bg-slate-50">
      <MyCursor me={me} />
      <OtherCursors myUserId={me._id} />
    </div>
  );
}
