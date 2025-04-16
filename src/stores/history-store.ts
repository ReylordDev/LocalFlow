import { create } from "zustand";
import { Result } from "../lib/models/database";

interface HistoryState {
  results: Result[];
  selectedResult: Result | null;
  searchTerm: string;
  filteredResults: Result[];
  setResults: (results: Result[]) => void;
  setSelectedResult: (result: Result | null) => void;
  setSearchTerm: (term: string) => void;
  deleteResult: (resultId: string) => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  results: [],
  selectedResult: null,
  searchTerm: "",
  filteredResults: [],
  setResults: (results) =>
    set((state) => ({
      results,
      filteredResults: state.searchTerm
        ? filterResults(results, state.searchTerm)
        : results,
      selectedResult: results.length > 0 ? results[0] : null,
    })),
  setSelectedResult: (selectedResult) => set({ selectedResult }),
  setSearchTerm: (searchTerm) =>
    set((state) => ({
      searchTerm,
      filteredResults: searchTerm
        ? filterResults(state.results, searchTerm)
        : state.results,
    })),
  deleteResult: (resultId) =>
    set((state) => {
      const results = state.results.filter((r) => r.id !== resultId);
      return {
        results,
        filteredResults: state.searchTerm
          ? filterResults(results, state.searchTerm)
          : results,
        selectedResult:
          state.selectedResult?.id === resultId
            ? results[0] || null
            : state.selectedResult,
      };
    }),
}));

function filterResults(results: Result[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return results.filter((result) =>
    result.mode.use_language_model && result.ai_result
      ? result.ai_result.toLowerCase().includes(term) ||
        result.transcription.toLowerCase().includes(term)
      : result.transcription.toLowerCase().includes(term),
  );
}
