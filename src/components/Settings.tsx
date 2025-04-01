import { useSettings } from "../contexts/SettingsContext";

export function Settings() {
  const { settings, updateSettings } = useSettings();

  return (
    <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg space-y-4 w-64">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Sampling Interval ({settings.samplingInterval}ms)
        </label>
        <input
          type="range"
          min="5"
          max="100"
          value={settings.samplingInterval}
          onChange={(e) =>
            updateSettings({ samplingInterval: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Batch Interval ({settings.batchInterval}ms)
        </label>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={settings.batchInterval}
          onChange={(e) =>
            updateSettings({ batchInterval: parseInt(e.target.value) })
          }
          className="w-full"
        />
      </div>
    </div>
  );
}
