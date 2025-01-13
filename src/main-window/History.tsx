import { useEffect, useState } from "react";
import { Transcriptions, HistoryItem } from "../lib/models";

const History = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  console.log("History");

  window.controller.onReceiveTranscriptions(
    (transcriptions: Transcriptions) => {
      console.log("Received transcriptions", transcriptions);
      setHistory(transcriptions.transcriptions);
    }
  );

  useEffect(() => {
    console.log("History useEffect");

    window.controller.getTranscriptions();
  }, []);

  return (
    <div className="bg-green-300 h-full w-full">
      <h1 className="font-bold text-3xl">History</h1>
      <table className="table-auto w-full bg-blue-300">
        <thead>
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2 min-w-48">Creation Date</th>
            <th className="px-4 py-2">Raw Transcription</th>
            <th className="px-4 py-2">Formatted Transcription</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{item.id}</td>
              <td className="border px-4 py-2">{item.created_at}</td>
              <td className="border px-4 py-2">{item.raw_transcription}</td>
              <td className="border px-4 py-2">
                {item.formatted_transcription}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default History;
