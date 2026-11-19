export interface Settings {
  requireResolution: boolean;
  minWidthAndHeight: number;
  /** Name downloaded files "<title> <nn>.<ext>" instead of generated ids. */
  useTitleNaming: boolean;
  /** Put files under a folder inside the zip instead of at its root. */
  zipInFolder: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  requireResolution: false,
  minWidthAndHeight: 512,
  useTitleNaming: true,
  // The zip has always been flat (files at its root), so keep that as the default.
  zipInFolder: false,
};

export const loadSettings = async (): Promise<Settings> => {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  await chrome.storage.sync.set(settings);
};
