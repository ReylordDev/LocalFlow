import {
  exposeRecordingHistory,
  exposeClipboard,
  exposeFile,
  exposeDatabase,
} from "../central_preload";

exposeRecordingHistory();
exposeDatabase();
exposeClipboard();
exposeFile();
