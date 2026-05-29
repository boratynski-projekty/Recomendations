// Ręcznie spisane typy bazy. Można zregenerować przez:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          slug: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          display_name: string;
          avatar_url?: string | null;
        };
        Update: Partial<{
          slug: string;
          display_name: string;
          avatar_url: string | null;
        }>;
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          slug: string;
          title: string;
          description?: string | null;
        };
        Update: Partial<{
          slug: string;
          title: string;
          description: string | null;
        }>;
        Relationships: [];
      };
      requests: {
        Row: {
          id: string;
          list_id: string;
          created_by: string;
          artist: string;
          title: string;
          youtube_url: string;
          youtube_id: string;
          comment: string | null;
          completed_at: string | null;
          completion_url: string | null;
          created_at: string;
        };
        Insert: {
          list_id: string;
          created_by: string;
          artist: string;
          title: string;
          youtube_url: string;
          youtube_id: string;
          comment?: string | null;
        };
        Update: Partial<{
          artist: string;
          title: string;
          youtube_url: string;
          youtube_id: string;
          comment: string | null;
          completed_at: string | null;
          completion_url: string | null;
        }>;
        Relationships: [];
      };
      votes: {
        Row: {
          request_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: { request_id: string; user_id: string };
        Update: Partial<{ request_id: string; user_id: string }>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          request_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: { request_id: string; user_id: string; body: string };
        Update: Partial<{ body: string }>;
        Relationships: [];
      };
    };
    Views: {
      requests_with_counts: {
        Row: {
          id: string;
          list_id: string;
          created_by: string;
          artist: string;
          title: string;
          youtube_url: string;
          youtube_id: string;
          comment: string | null;
          completed_at: string | null;
          completion_url: string | null;
          created_at: string;
          vote_count: number;
          comment_count: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
