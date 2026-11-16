import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const jobs = [
  {
    id: "Wars-Kalaf-R",
    out: "C:/Users/mshms/Videos/جاهز/دروس/ما هو الورس وما علاقته بعلاج الكلف وتجميل الوجه #محمد_بن_شمس_الدين.mp4",
    title: "ما هو الورس وعلاج الكلف"
  },
  {
    id: "Tawaf-Nisa-R",
    out: "C:/Users/mshms/Videos/جاهز/دروس/طواف الرجل على نسائه بغسل واحد وحكم العدل بينهن #محمد_بن_شمس_الدين.mp4",
    title: "طواف الرجل على نسائه"
  },
  {
    id: "Wudu-Awd-R",
    out: "C:/Users/mshms/Videos/جاهز/دروس/حكم الوضوء عند العود للجماع وهل يشمل المرأة #محمد_بن_شمس_الدين.mp4",
    title: "الوضوء عند العود للجماع"
  },
  {
    id: "Khala-Salah-R",
    out: "C:/Users/mshms/Videos/جاهز/دروس/إذا أقيمت الصلاة وحضرك الخلاء هل تقدمه وتقطع صلاتك #محمد_بن_شمس_الدين.mp4",
    title: "تقديم الخلاء على صلاة الجماعة"
  },
  {
    id: "Mawti-Aqsam-R",
    out: "C:/Users/mshms/Videos/جاهز/دروس/الأقسام الأربعة لما يداس عليه في الطريق من النجاسة والقذر #محمد_بن_شمس_الدين.mp4",
    title: "الأقسام الأربعة لما يوطأ في الطريق"
  }
];

function runJob(job, index, total) {
  return new Promise((resolve, reject) => {
    console.log(`\n========================================`);
    console.log(`[${index + 1}/${total}] STARTING RENDER: ${job.id}`);
    console.log(`Title: ${job.title}`);
    console.log(`Destination: ${job.out}`);
    console.log(`========================================\n`);

    const child = spawn(
      "node",
      ["tools/render_final.mjs", job.id, job.out, job.title],
      { stdio: "inherit" }
    );

    child.on("close", (code) => {
      if (code === 0) {
        try {
          const stats = fs.statSync(job.out);
          console.log(`\n>>> SUCCESS: ${job.id} rendered (${(stats.size / 1024 / 1024).toFixed(1)} MB) <<<\n`);
        } catch {
          console.log(`\n>>> SUCCESS: ${job.id} finished <<<\n`);
        }
        resolve();
      } else {
        console.error(`\n>>> FAILED: ${job.id} exited with code ${code} <<<\n`);
        reject(new Error(`Render failed for ${job.id} with exit code ${code}`));
      }
    });
  });
}

async function main() {
  console.log(`Starting sequential render of ${jobs.length} lesson clips on NVIDIA GPU...`);
  const t0 = Date.now();
  for (let i = 0; i < jobs.length; i++) {
    await runJob(jobs[i], i, jobs.length);
  }
  const totalMins = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`\nALL ${jobs.length} CLIPS RENDERED SUCCESSFULLY IN ${totalMins} MINUTES!`);
}

main().catch((err) => {
  console.error("Batch render fatal error:", err);
  process.exit(1);
});
