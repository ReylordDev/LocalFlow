import { useEffect, useState } from "react";
import { Transcriptions, HistoryItem } from "../lib/models";
import { Search, Trash2 } from "lucide-react";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import { formatDate } from "../lib/utils";

const characterLimit = 100;

const History = () => {
  console.log("History");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  console.log("History", history);
  console.log("Search Term", searchTerm);

  return (
    <div className="flex-col flex h-full w-full">
      <h1 className="font-bold text-5xl">History</h1>
      <div className="my-6"></div>
      <div className="flex items-center gap-4">
        <Search />
        <Input
          type="search"
          placeholder="Filter Transcriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded w-1/2 p-4"
        />
      </div>
      <Table>
        {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
        <TableHeader>
          <TableRow>
            <TableHead className="w-[230px]">Date</TableHead>
            <TableHead>Raw Transcription</TableHead>
            <TableHead>Formatted Transcription</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((item) => (
            <TableRow key={item.id} className="select-none">
              <TableCell>{formatDate(item.created_at)}</TableCell>
              <TableCell>
                {item.raw_transcription.length > characterLimit
                  ? item.raw_transcription.substring(0, characterLimit) + "..."
                  : item.raw_transcription}
              </TableCell>
              <TableCell>
                {item.formatted_transcription.length > characterLimit
                  ? item.formatted_transcription.substring(0, characterLimit) +
                    "..."
                  : item.formatted_transcription}
              </TableCell>
              <TableCell>
                <button className="text-red-500">
                  <Trash2 />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default History;
