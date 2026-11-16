---
name: papermotion
description: Use the local Papermotion source for cut-paper cartoon design, articulated bone rigs, physical interactions, and frame-safe integration with the Remotion workspace. Use for Papermotion work or a chosen cut-paper style, rather than replacing every cartoon renderer.
---

# Papermotion in this workspace

Follow `PREFERENCES.md`, `MONTAGE_BRIEF.md`, and `cartoon-animation` for project decisions, speech timing, drawing constraints, resources, render authorization, and export. This skill adapts the downloaded engine; it does not replace that workflow.

## Source and scope

The upstream source and original bundled skill are at `S:/AI_Tools/Papermotion`, commit `edcf592906fa3ad93b11dedb6f6d618cd4bb8e9e`, under MIT. Keep its license with reused code.

Read `S:/AI_Tools/Papermotion/README.md` and its original `.claude/skills/papermotion/SKILL.md` when using the engine. Treat their defaults as engine conventions. Our no-eyes rule, source requirements, audio, approval, and resource limits still apply.

For workflow and frame-order differences, read [the local integration reference](../cartoon-animation/references/papermotion-integration.md) first.

## Choose the useful layer

- For paper appearance: unified silhouettes/sheets, clipped interior markings, coherent shadow and rim light, and restrained parallax.
- For acting: parented bones, gait tied to travel, real hand/object and foot/ground contacts, and secondary motion that settles.
- For physical scenes: fixed-step simulation with seeded randomness and events/probes that prove what happened.

For anatomy, read upstream `references/characters.md`; for visual direction, `references/art-direction.md`; for scene beats, `references/scenes.md`; and for inspection, `references/inspection.md`. These paths are relative to `S:/AI_Tools/Papermotion/.claude/skills/papermotion/`. Read `references/pitfalls.md` before debugging an engine scene. Load relevant references rather than all of them for every task.

## Frame order and integration

Papermotion is stateful and moves forward in fixed steps. Never share an advancing world across arbitrary Remotion frame requests. Prefer sequentially baked frames/poses or analytic pure functions; verify the selected approach preserves contact, frame count, and speech timing.

Keep the renderer and motion inspection within the existing one-render workflow. Upstream render scripts default to CPU encoding and multiple browser pages; adapt them before execution. Use existing Chromium when compatible, NVIDIA for approved final exports, low priority, bounded threads, S for work/cache, and the approved final export directory.

The source has been downloaded; dependencies and example renders are not claimed to be tested. Prepare and validate runtime dependencies when a concrete engine task needs them. Keep any dependency changes confined to `S:/AI_Tools/Papermotion`, not the Remotion project's package files.
