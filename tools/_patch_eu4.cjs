const fs = require("fs");
let l = fs.readFileSync("src/EuLandscape.tsx", "utf8");

// length: the landscape ends with a protests montage so the whole video is exactly 8:30
l = l.replace("export const EU_L_FRAMES = Math.ceil(DUR * EU_FPS);", `const TOTAL = 510;                       // 8:30 (user request)
const FIN = TOTAL - DUR;                  // seconds of the closing protests montage
export const EU_L_FRAMES = Math.ceil(TOTAL * EU_FPS);`);

l = l.replace("import { AbsoluteFill, Img, OffthreadVideo,", "import { AbsoluteFill, Audio, Img, OffthreadVideo,");

// finale component
l = l.replace("export const EuLandscape: React.FC = () => {", `/** panel that rises into place */
const Rise: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const s = useSp(at, 14, 150);
  return <AbsoluteFill style={{ opacity: Math.min(1, s * 2), transform: \`translateY(\${(1 - s) * 90}px)\` }}>{children}</AbsoluteFill>;
};
const Label: React.FC<{ at: number; x: number; y: number; w: number; text: string; flag: FlagCode }> = ({ at, x, y, w, text, flag }) => (
  <Banner at={at} x={x} y={y} w={w} text={text} flag={flag} size={34} />
);

/** closing montage of the protest footage, slowed down and shown together (no music: the clips' own sound, very low) */
const Finale: React.FC = () => {
  const A = DUR, M2 = DUR + 21;
  return (
    <>
      <Sc a={A} b={M2 - 0.05} slide={0}>
        <Rise at={A + 0.1}><BClip n={2} at={A + 0.1} dur={21} speed={0.5} x={90} y={60} w={540} h={960} /><Label at={A + 0.5} x={110} y={80} w={300} text="إيطاليا" flag="it" /></Rise>
        <Rise at={A + 0.7}><BClip n={6} at={A + 0.7} dur={21} speed={0.5} x={690} y={60} w={540} h={960} /><Label at={A + 1.1} x={710} y={80} w={380} text="ليون" flag="fr" /></Rise>
        <Rise at={A + 1.3}><BClip n={5} at={A + 1.3} dur={21} from={11} speed={0.5} x={1290} y={60} w={540} h={960} /><Label at={A + 1.7} x={1310} y={80} w={330} text="بلجيكا" flag="be" /></Rise>
      </Sc>
      <Sc a={M2} b={DUR + FIN + 1} slide={0}>
        <Rise at={M2 + 0.1}><BClip n={1} at={M2 + 0.1} dur={FIN - 21} speed={0.7} x={60} y={130} w={1100} h={619} /><Label at={M2 + 0.5} x={80} y={150} w={300} text="باريس" flag="fr" /></Rise>
        <Rise at={M2 + 0.6}><BClip n={6} at={M2 + 0.6} dur={FIN - 21} speed={0.5} from={0} x={1220} y={90} w={270} h={480} /></Rise>
        <Rise at={M2 + 1.1}><BClip n={2} at={M2 + 1.1} dur={FIN - 21} speed={0.5} from={0} x={1520} y={90} w={270} h={480} /></Rise>
        <Banner at={M2 + 1.5} x={60} y={800} w={1100} text="فرنسا · إيطاليا · بلجيكا" size={56} />
        <Subscribe at={DUR + FIN - 7} x={1500} y={640} dur={99} />
      </Sc>
      <Sequence from={Math.round(A * EU_FPS)} durationInFrames={Math.round(21 * EU_FPS)}><Audio src={staticFile("eu/broll/c6.mp4")} volume={0.1} /></Sequence>
      <Sequence from={Math.round(M2 * EU_FPS)} durationInFrames={Math.round((FIN - 21) * EU_FPS)}><Audio src={staticFile("eu/broll/c1.mp4")} volume={0.1} /></Sequence>
    </>
  );
};

export const EuLandscape: React.FC = () => {`);

// show the finale (inside Gfx, after the conclusion scene); the end subscribe of the speaker part is moved into the finale
l = l.replace(`<Subscribe at={DUR - 3.8} x={1560} y={640} />`, ``);
l = l.replace(`<NameTag at={80} x={330} y={960} />`, `<Finale />\n          <NameTag at={80} x={330} y={960} />`);
fs.writeFileSync("src/EuLandscape.tsx", l);
console.log(l.includes("<Finale />"), l.includes("const FIN"), l.includes("Subscribe at={DUR - 3.8}"));
