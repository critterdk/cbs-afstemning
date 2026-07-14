// Fallback fixture data shown in local dev when NEXT_PUBLIC_SUPABASE_URL isn't set.
export type Nomination = {
  id: string;
  nominee_name: string;
  reasoning: string;
  created_at: string;
  vote_count: number;
};

export const mockNominations: Nomination[] = [
  {
    id: "mock-1",
    nominee_name: "Anna Jensen",
    reasoning: "Startede en cykelklub for nye danskere i lokalområdet.",
    created_at: new Date().toISOString(),
    vote_count: 12,
  },
  {
    id: "mock-2",
    nominee_name: "Peter Nielsen",
    reasoning: "Frivillig cykelmekaniker der reparerer cykler gratis for skoleelever.",
    created_at: new Date().toISOString(),
    vote_count: 8,
  },
  {
    id: "mock-3",
    nominee_name: "Sofie Larsen",
    reasoning: "Kæmper for bedre cykelstier i sin kommune.",
    created_at: new Date().toISOString(),
    vote_count: 5,
  },
];
