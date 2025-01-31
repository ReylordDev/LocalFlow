import { useEffect, useState } from "react";
import { HistoryItem } from "../lib/models";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

import { formatDate } from "../lib/utils";
import { Button } from "../components/ui/button";

const characterLimit = 100;

const History = () => {
  console.log("History");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const handleRowClick = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  window.controller.onReceiveTranscriptions((transcriptions) => {
    console.log("Received transcriptions", transcriptions);
    setHistory(transcriptions);
  });

  useEffect(() => {
    console.log("History useEffect");

    window.controller.getTranscriptions();
  }, []);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this transcription?")) {
      window.controller.deleteTranscription(id);
    }
  };

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
          {history
            .filter((item) => {
              return (
                item.raw_transcription
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                item.formatted_transcription
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              );
            })
            .map((item) => (
              <TableRow
                key={item.id}
                className="select-none cursor-pointer hover:bg-gray-50"
                onClick={() => handleRowClick(item)}
              >
                <TableCell>{formatDate(item.created_at)}</TableCell>
                <TableCell>
                  {item.raw_transcription.length > characterLimit
                    ? item.raw_transcription.substring(0, characterLimit) +
                      "..."
                    : item.raw_transcription}
                </TableCell>
                <TableCell>
                  {item.formatted_transcription.length > characterLimit
                    ? item.formatted_transcription.substring(
                        0,
                        characterLimit
                      ) + "..."
                    : item.formatted_transcription}
                </TableCell>
                <TableCell>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 />
                  </button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {/* Detail Modal */}
      <Dialog
        open={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transcription Details</DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Date</h3>
                <p>{formatDate(selectedItem.created_at)}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Raw Transcription</h3>
                <p className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {selectedItem.raw_transcription}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Formatted Transcription</h3>
                <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                  {selectedItem.formatted_transcription}
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedItem(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;
