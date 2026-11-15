-- A link someone made to study a course with another person. Only the
-- token's hash is kept, as for sessions. Accepting deletes it, so it works once.
CREATE TABLE companion_invites (
  token_hash TEXT PRIMARY KEY,
  inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) WITHOUT ROWID;

CREATE INDEX companion_invites_by_inviter ON companion_invites (inviter_id);

-- Two people studying one course together. Each pair is stored once, with
-- user_a < user_b, so either side can be looked up and removed.
CREATE TABLE companions (
  user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_a, user_b, course),
  CHECK (user_a < user_b)
) WITHOUT ROWID;

CREATE INDEX companions_by_b ON companions (user_b, course);
