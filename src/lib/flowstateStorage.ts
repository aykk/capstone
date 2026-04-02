// localStorage keys for Flowstate (migrates from older meetingflow-* keys once)
export const AUTO_SAVE_KEY = "flowstate-canvas-autosave";
export const SAVES_KEY = "flowstate-saves";
export const PROJECT_NAME_KEY = "flowstate-project-name";

const LEGACY = {
  auto: "meetingflow-canvas-autosave",
  saves: "meetingflow-saves",
  name: "meetingflow-project-name",
} as const;

export function migrateLegacyFlowstateKeys(): void {
  if (typeof window === "undefined") return;
  try {
    if (!localStorage.getItem(AUTO_SAVE_KEY) && localStorage.getItem(LEGACY.auto)) {
      localStorage.setItem(AUTO_SAVE_KEY, localStorage.getItem(LEGACY.auto)!);
    }
    const curSaves = localStorage.getItem(SAVES_KEY);
    const legSaves = localStorage.getItem(LEGACY.saves);
    if ((!curSaves || curSaves === "[]") && legSaves && legSaves !== "[]") {
      localStorage.setItem(SAVES_KEY, legSaves);
    }
    if (!localStorage.getItem(PROJECT_NAME_KEY) && localStorage.getItem(LEGACY.name)) {
      localStorage.setItem(PROJECT_NAME_KEY, localStorage.getItem(LEGACY.name)!);
    }
  } catch {
    // ignore
  }
}
