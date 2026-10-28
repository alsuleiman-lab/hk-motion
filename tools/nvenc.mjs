// ffmpegOverride لـ renderMedia: يستبدل libx264 (معالج) بـ h264_nvenc (كرت RTX) و-crf بما يقابله (-cq).
// مُختبَر 2026-10-18: ينتج h264 سليماً. الاستعمال: renderMedia({ ..., ffmpegOverride: nvencOverride })
export const nvencOverride = ({ args }) => {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "libx264") out.push("h264_nvenc");
    else if (args[i] === "-crf") { out.push("-cq", args[i + 1], "-rc", "vbr", "-b:v", "0"); i++; }
    else out.push(args[i]);
  }
  if (!out.includes("-threads")) {
    out.push("-threads", "4");
  }
  return out;
};
