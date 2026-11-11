# Operating Systems: exam iteration rounds

Scope: the **midterm and final exam questions** only. Lectures (`src/content/operating-systems/`, the lecture text) are not changed in this phase. Each round is committed on its own, ticks its box here, and adds its report below. The commit message for each round includes `Part of this issue`.

Parts: **Part 1, Midterm questions** · **Part 2, Final exam questions**. Every lesson ends with `## Practice from past exams`, split into those two parts.

Chapter-to-lesson map used for placement:

| Chapter | Lessons |
| --- | --- |
| Ch 1 Introduction | `what-an-os-does`, `os-architecture-and-operations` |
| Ch 2 OS Structures | `services-and-system-calls`, `os-design-and-structure` |
| Ch 3 Processes | `processes`, `interprocess-communication` |
| Threads (lab, not a lecture chapter here) | `lab-java-threads` |
| Ch 5 Process Synchronization | `critical-section-problem`, `semaphores-and-classic-problems` |
| Ch 6 CPU Scheduling | `cpu-scheduling-basics`, `round-robin-and-beyond` |
| Ch 8 Main Memory | `memory-allocation`, `paging` |
| Ch 9 Virtual Memory | `virtual-memory`, `page-replacement-and-thrashing` |

Quizzes (`5- Exams/1- Quizzes`) and the assignment are not in scope for this phase.

## Rounds

- [x] 1. Skeleton (whole course): exam inventory, chapter mapping, placement headings in every lesson
- [ ] 2. Source fidelity (exam questions transcribed verbatim, answer keys checked)
  - [x] Part 1, midterms (all 17 lessons; commit `f262403`). Still open: the 2022 midterm key (scan) and the 2014 and 2018 keys' other items, which are checked against our answers
  - [~] Part 2, finals: first pass done (commit `c0b7eb2`). Done: 2015 and 2019 spring true/false (same statements), 2019 spring and fall written questions, 2019 fall true/false, 2016 and 2015 written questions, 2020 true/false and MCQ 67 to 75, 2017 Q7. Still open: 2020 MCQ 21 to 62 and the 2020 round-robin items 63 to 66 (no printed option matches our schedule); the 2017 true/false items and 2017 Q2 to Q6, Q8 (OCR text is too noisy to copy exact wording); the 2018, 2023, 2024 and undated finals (not yet read); the 2022 midterm key (scan, not yet read)
- [ ] 3. Depth (coverage gaps and multi-concept questions identified)
- [ ] 4. Plain language (explanations added, kept separate from the original questions)
- [ ] 5. Visualizations (step-by-step tables and timelines where they help)
- [ ] 6. Practice (solutions with steps, every calculation rechecked)
- [ ] 7. Connections (cross-chapter questions linked both ways)
- [ ] 8. Student read-through (fresh-session review of placement and wording)
- [ ] 9. Real readers (needs students who have studied the OS course; not started)

## Exam inventory

Status: **text** = text layer read directly; **scan** = rendered to images and read visually; **key** = answer sheet found.

### Midterms (Part 1)

| Exam | Questions | Source status | Answer key |
| --- | --- | --- | --- |
| 2014 | Q1 T/F (12), Q2, Q3, Q4 (scheduling) | text | key (text) |
| 2015 | Q1 T/F (10; items 6 and 8, and 7 and 9, repeat wording), Q2, Q3, Q4, Q5 | text | key (text) |
| 2017 | Q1 T/F (10), Q2, Q3, Q4 | text (a stray Q5 fragment at the top of the PDF repeats the 2015 Q5 and is not counted) | key (text) |
| 2018 | Q1 T/F (10), Q2, Q3, Q4, Q5 (the Q3 and Q4 text at the top of the PDF belongs to 2017) | text | key (text) |
| 2018 second version | Q1 T/F (10), Q2, Q3, Q4, Q5 | text | none found |
| 2019 | Q1 T/F (10), Q2, Q3, Q4 | text | key (text) |
| 2019 second version | Q1 storage hierarchy, Q2 T/F (6), Q3, Q4, Q5 to Q8 | text (the Q5 Peterson text at the top repeats the 2018 second version) | key (text) |
| 2021 | Q1 MCQ (14), Q2, Q3, Q4 | text | key (text) |
| 2022 | Q1 T/F (8), Q2 (4 blanks), Q3, Q4, Q5 (4 parts) | text | key (scan, not yet read) |

### Finals (Part 2)

| Exam | Questions | Source status | Answer key |
| --- | --- | --- | --- |
| 2015 | Q1 T/F (20), Q2, Q3, Q4 table, Q5, Q6, Q7, Q8 | scan (read) | key (scan, not yet read) |
| 2016 | Q1 T/F (20), Q2, Q3 (SYSGEN and storage ranking), Q4 (state diagram), Q5, Q6, Q7, Q8 | scan (read, partly) | key (scan, not yet read) |
| 2017 | | scan (not yet read) | key (scan, not yet read) |
| 2018 | (with answers printed) | scan (not yet read) | printed on the paper |
| 2019 spring | Q1 T/F (20), Q2 (4 pairs), Q3, Q4, Q5, Q6 table, Q7 partitions, Q8 page replacement | text, answers printed | printed |
| 2019 fall | Q1 T/F (16), Q2, Q3, Q4, Q5, Q6 scheduling, Q7, Q8 | text, answers partly printed | partly printed |
| 2020 | Q1 T/F (20), items 21 to 75 (bubble sheet MCQ), Q4, Q5 | text for the question list, key for T/F and Q4/Q5 | MCQ answers not printed |
| 2023 | | scan (not yet read) | none found yet |
| 2024 | | scan (not yet read) | key (scan, not yet read) |
| No date (two papers) | | scan (not yet read) | none found yet |

Quiz 1 (Linux) is outside this phase.

## Reports

Newest last.

### Round 1, skeleton

Inventoried every midterm and final in `OS/.../5- Exams`, read each one's text (or rendered it to images with the Windows PDF API where there was no text layer), and mapped every question to a chapter and lesson (table above).

**Found in the source, not fixed in the lectures (exam-side only):**
- Several PDFs carry stray pages from other exams: the 2017 midterm opens with a copy of the 2015 Q5 text, the 2018 midterm opens with 2017's Q3 and Q4, and the 2019 second-version PDF repeats the 2018 second-version Q5. Each paper is counted only by its own questions.
- The 2015 midterm repeats two T/F statements (items 6 and 8; 7 and 9). They are kept as printed.
- The 2014 answer key's SJF turnaround values disagree with a recalculation (to be checked in round 2).

**Not done yet:** the remaining finals (2017, 2018, the 2023 and 2024 finals, and the two undated finals) and the 2022 midterm key are scanned and not yet transcribed. The 2020 MCQ answers are not printed, so they will be worked out and marked as ours.

**Not checked:** the existing lessons have no practice sections yet; placement headings are added in round 1 below.

### Round 2, source fidelity (midterms and finals, first pass)

Commits: `f262403` (midterms), `c0b7eb2` (finals).

**Changed:** every midterm true/false, multiple-choice and written question is in its chapter's lesson with its exam label and year. Repeated statements are listed once with every year. The finals' true/false items, the scheduling, page-replacement, partition, address-bit and tree questions are in place.

**Checked with scripts:** the 2014 and 2019 spring and fall scheduling tables, the page-replacement counts for every string (2015, 2016, 2019 spring and fall, 2020), the 2019 spring round-robin row, the 2020 partition and bit answers.

**Source errors and disagreements:**
- 2014 midterm, round robin: the printed Gantt chart and per-process values don't match the stated rules. The average (13.5) is right. Our values: P1 22, P2 3, P3 21, P4 8.
- 2014 midterm, SJF: the printed values are each one unit too high. Ours: P1 8, P2 11, P3 16, P4 5, average 10.0.
- 2020 final, items 63 to 66 (round robin): our schedule gives values that match none of the printed options, so they are not answered.
- 2015 midterm: items 6 and 8, and 7 and 9, repeat the same statements.
- 2018 midterm, true/false item 9: the printed key says false; we read it as true and say so.
- 2015 and 2019 spring finals print the same true/false statements. The 2015 scan is read from the page images.

**Found but not fixed:** the 2019 spring Q2 "system calls and system programs" pair has no separate final answer (it is covered by the midterm answers).

**Not checked:** the 2022 midterm key (scan) and the 2018, 2023, 2024 and undated finals (scans not yet read); 2017 final true/false (OCR too noisy); 2020 MCQ 21 to 62; the 2016 final's true/false list (not read). Round 9 (real readers) has not started.
