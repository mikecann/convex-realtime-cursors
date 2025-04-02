import { UserSetup } from "./components/UserSetup";
import { Canvas } from "./components/Canvas";
import { Settings } from "./components/Settings";
import { useMe } from "./contexts/MeContext";

export default function App() {
  const { me } = useMe();
  if (!me) return <UserSetup />;
  return (
    <>
      <Canvas  />
      <Settings />
    </>
  );
}
