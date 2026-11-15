-- A public profile someone chose to turn on. Turning it off keeps the row,
-- so the handle stays theirs. `hidden` is set by hand after a report and
-- keeps the profile out of view even when it is turned on.
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  public INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) WITHOUT ROWID;

-- One report per person per profile. `handle` is the handle when reported,
-- since it can change afterwards.
CREATE TABLE profile_reports (
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (reporter_id, profile_user_id)
) WITHOUT ROWID;
