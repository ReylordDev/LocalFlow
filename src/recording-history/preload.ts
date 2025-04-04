import {
  exposeRecordingHistory,
  exposeClipboard,
  exposeFile,
  exposeDatabase,
  exposeSettings,
} from "../central_preload";

exposeRecordingHistory();
exposeDatabase();
exposeClipboard();
exposeFile();
exposeSettings();
