# GEMINI.md

Guidance for Antigravity and other Gemini-based agents. The project rules live in `CLAUDE.md` and are shared by every agent, so they are included here rather than copied. Edit `CLAUDE.md`, not this file, when a project rule changes.

@[CLAUDE.md](CLAUDE.md)

## Notes for Antigravity

- **Course iterations** follow "Build in iterations" in `docs/building-a-course.md`. Each round gets its own fresh subagent, scoped to one module, told to look for problems instead of confirming the work. Its report goes on the course's `course-iteration` GitHub issue (`gh issue list --label course-iteration`), and its commits say `Part of #N`.
- **Round 4 (plain language) uses the humanizer skill.** Antigravity loads it from `~/.gemini/config/skills/humanizer`, a symlink to the copy Claude Code installed (`~/.claude/plugins/cache/humanizer/humanizer/<version>/SKILL.md`). Use it in file mode: change prose only. Leave code, math, inline code, link targets and component props as they are. Its no-dash rule applies to lesson prose.
- **Source material** for a course lives in `_sources/<course-slug>/`, which is gitignored. Never commit it, and never name an institution or teacher in a lesson.
- **Code samples:** `python3 scripts/check-code-samples.py <files>` needs numpy, pandas and scipy. If the system Python doesn't have them, use a virtualenv and don't install packages globally. Octave runs the MATLAB samples.
- **Push directly:** This repository is public; push commits directly to the remote as tasks and iterations complete.
