# Segment Cut — Detailed Rules

This file supplements `segment-cut/SKILL.md`.

## Studio frames after a bumper (user decision, 2026-11-18)

- Studio frame numbers after the bumper are 150 frames (5 s × 30 fps) later than cut-timeline frames. For a user-specified frame after the bumper, subtract 150, then divide by 30. Before the bumper, divide by 30 directly. Bumper position comes from the spec (`spec.bumper`; see `identity`).
- Automatic frame conversion is not implemented in the segment-cut tool. Until implemented, perform the conversion manually and tell the user the resulting second.

## Cut values (user decision, 2026-11-18)

Maximum gap and edge margins live only in `data/cut_rules.json`; do not duplicate values here.

## Preserve the user's requested order (2026-10-30, reaffirmed 2026-11-18)

When the user lists spans to keep (“keep from X to Y, then from A to B”), concatenate them in the order spoken by the user, not in their chronological order in the source.
