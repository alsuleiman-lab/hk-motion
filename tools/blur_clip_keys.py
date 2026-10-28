"""Manual-keyframe face blur for a video. Usage: python tools/blur_clip_keys.py in.mp4 keys.json out.mp4
keys.json: [[ [t,x,y,w,h], ... ], ...]  one list of keyframes per blurred interval (pixels of the source, boxes interpolated linearly, blur only between first and last t)."""
import sys, json, subprocess, cv2, numpy as np
src, keysf, dst = sys.argv[1:4]
groups = json.load(open(keysf))
cap = cv2.VideoCapture(src); fps = cap.get(5); W = int(cap.get(3)); H = int(cap.get(4))
p = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","bgr24","-s",f"{W}x{H}","-r",str(fps),"-i","-","-i",src,"-map","0:v","-map","1:a?","-c:v","libx264","-crf","17","-preset","fast","-pix_fmt","yuv420p","-c:a","copy",dst],stdin=subprocess.PIPE)
i = 0
while True:
    ok, f = cap.read()
    if not ok: break
    t = i / fps
    for g in groups:
        if g[0][0] <= t <= g[-1][0]:
            ts = [k[0] for k in g]
            x, y, w, h = [float(np.interp(t, ts, [k[j] for k in g])) for j in (1,2,3,4)]
            x -= 0.45*w; w *= 1.9; y -= 0.15*h; h *= 2.1
            x0, y0, x1, y1 = max(0,int(x)), max(0,int(y)), min(W,int(x+w)), min(H,int(y+h))
            if x1 > x0 and y1 > y0:
                roi = f[y0:y1, x0:x1]
                roi_src = roi
                roi = cv2.GaussianBlur(roi, (0,0), 15)   # blur strength 15 (user 2026-10-18), then the heavy down/up-scale below
                bl = cv2.GaussianBlur(cv2.resize(roi,(max(4,roi.shape[1]//14),max(4,roi.shape[0]//14))),(0,0),2)
                bl = cv2.resize(bl,(roi.shape[1],roi.shape[0]),interpolation=cv2.INTER_LINEAR)
                m = np.zeros(roi.shape[:2], np.float32)
                cv2.ellipse(m,(roi.shape[1]//2,roi.shape[0]//2),(roi.shape[1]//2,roi.shape[0]//2),0,0,360,1,-1)
                m = cv2.GaussianBlur(m,(0,0),max(3,roi.shape[1]//14))[...,None]
                f[y0:y1, x0:x1] = (bl*m + roi_src*(1-m)).astype(np.uint8)
    p.stdin.write(f.tobytes()); i += 1
p.stdin.close(); p.wait(); print("frames", i)
