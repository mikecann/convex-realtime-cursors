import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useMe } from "../contexts/MeContext";

const EMOJIS = ["😊", "🐱", "🦊", "🐰", "🐼", "🐨", "🦁", "🐯", "🐸", "🦄"];

export function UserSetup({}: {}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const createUser = useMutation(api.users.createUser);
  const { setUserId } = useMe();

  const shuffleEmoji = () => {
    const currentIndex = EMOJIS.indexOf(emoji);
    const nextIndex = (currentIndex + 1) % EMOJIS.length;
    setEmoji(EMOJIS[nextIndex]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const { userId } = await createUser({ name: name.trim(), emoji });
    setUserId(userId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Join Canvas
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Cursor
            </label>
            <div className="flex items-center gap-4">
              <div className="text-4xl bg-gray-50 p-4 rounded-lg">{emoji}</div>
              <button
                type="button"
                onClick={shuffleEmoji}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
              >
                Shuffle
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
