with open("src/Root.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    new_lines.append(line)
    if 'from "./ShiaHandDebate";' in line:
        new_lines.append('import {\n')
        new_lines.append('  DebateThumb1,\n')
        new_lines.append('  DebateThumb2,\n')
        new_lines.append('  DebateThumb3,\n')
        new_lines.append('  DebateThumb4,\n')
        new_lines.append('  DebateThumb5,\n')
        new_lines.append('  DebateThumb6,\n')
        new_lines.append('  DebateThumb7,\n')
        new_lines.append('  DebateThumb8,\n')
        new_lines.append('} from "./DebateThumbnails";\n')
    if '<ByRecency>' in line:
        new_lines.append('      {/* Debate Livestream Thumbnails (1920x1080) */}\n')
        for k in range(1, 9):
            new_lines.append(f'      <Composition id="DebateThumb{k}" component={{DebateThumb{k}}} durationInFrames={{30}} fps={{30}} width={{1920}} height={{1080}} />\n')

with open("src/Root.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("Patched src/Root.tsx successfully!")

