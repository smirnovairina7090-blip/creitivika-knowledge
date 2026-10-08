CREATE TABLE articles (
	id text PRIMARY KEY NOT NULL,
	body text NOT NULL,
	revision integer DEFAULT 1 NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE requests (
	id text PRIMARY KEY NOT NULL,
	body text NOT NULL,
	version integer DEFAULT 1 NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE question_access (
	question_id text PRIMARY KEY NOT NULL,
	token_hash text NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (question_id) REFERENCES requests(id) ON UPDATE no action ON DELETE no action
);

CREATE TABLE question_limits (
	bucket text PRIMARY KEY NOT NULL,
	count integer NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE question_messages (
	id text PRIMARY KEY NOT NULL,
	question_id text NOT NULL,
	body text NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (question_id) REFERENCES requests(id) ON UPDATE no action ON DELETE no action
);

CREATE INDEX question_messages_by_question ON question_messages (question_id);