CREATE TABLE IF NOT EXISTS articles (
  id text PRIMARY KEY NOT NULL,
  body text NOT NULL,
  revision integer DEFAULT 1 NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS requests (
  id text PRIMARY KEY NOT NULL,
  body text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS question_access (
  question_id text PRIMARY KEY NOT NULL REFERENCES requests(id),
  token_hash text NOT NULL,
  created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS question_limits (
  bucket text PRIMARY KEY NOT NULL,
  count integer NOT NULL,
  updated_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS question_messages (
  id text PRIMARY KEY NOT NULL,
  question_id text NOT NULL REFERENCES requests(id),
  body text NOT NULL,
  created_at text NOT NULL
);
CREATE INDEX IF NOT EXISTS question_messages_by_question ON question_messages(question_id);
