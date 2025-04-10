import {
  exposeRecordingHistory,
  exposeClipboard,
  exposeFile,
  exposeDatabase,
  exposeSettings,
} from "../central-preload";

exposeRecordingHistory();
exposeDatabase();
exposeClipboard();
exposeFile();
exposeSettings();
