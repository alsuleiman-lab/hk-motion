# usage: name src ss dur cropx(0-1) eq  -- modified portrait 1080x1920 clip (lighting+crop+speed+grain, metadata stripped)
p(){ ffmpeg -hide_banner -v error -y -ss $3 -t $4 -i public/stock/ad2_$2.mp4 -an \
 -vf "crop=ih*9/16:ih:(iw-ih*9/16)*$5:0,scale=1080:1920:flags=lanczos,setpts=PTS/1.05,fps=30,eq=$6,noise=alls=4:allf=t,vignette=PI/6" \
 -map_metadata -1 -c:v libx264 -crf 19 -preset fast -g 15 -pix_fmt yuv420p public/ad2/clips/$1.mp4 && echo ok $1; }
#p alarm_v2 16346 0 4.5 0.5 "contrast=1.05:saturation=1.2:brightness=0.12:gamma=1.7"
#p sleep 729 0 4.5 0.1 "brightness=0.14:gamma=1.6:contrast=1.05:saturation=1.1"
#p cartoon 132941 0 5 0.5 "saturation=1.1"
#p clock1 15629 0 4.5 0.8 "contrast=1.05:saturation=1.1"
#p clock2 61621 0 4.5 0.5 "contrast=1.04:saturation=1.1:brightness=0.02"
#p wash_v2 34730 1 4 0.45 "contrast=1.05:saturation=1.15:brightness=0.08:gamma=1.6"
#p phone1 142641 1 4 0.5 "contrast=1.05:saturation=1.1:brightness=0.03"
#p phone2 736 1 4 0.5 "contrast=1.05:saturation=1.05"
#p sun_v2 262916 0 5 0.5 "saturation=1.1:brightness=0.1:gamma=1.35"
#p mosque 258089 0 5 0.5 "contrast=1.04:saturation=1.1"
#p sil_v2 200421 0 5 0.5 "contrast=1.02:saturation=1.15:brightness=0.1:gamma=1.35"
# --- round 2 (user: man waking/back to sleep, cuts every <=2s) ---
#p cartoon_a 132941 0 2.6 0.5 "saturation=1.1"
#p cartoon_b 132941 6 3 0.5 "saturation=1.1"
#p sleep_a 729 0 3 0.1 "brightness=0.14:gamma=1.6:contrast=1.05:saturation=1.1"
#p sleep_c 729 6 3 0.92 "brightness=0.16:gamma=1.6:contrast=1.05:saturation=1.15"
#p alarm_b 16346 3 3 0.5 "contrast=1.05:saturation=1.2:brightness=0.12:gamma=1.7"
#p clock1_b 15629 5 3 0.8 "contrast=1.05:saturation=1.1"
#p clock2_b 61621 6 3 0.5 "contrast=1.04:saturation=1.1:brightness=0.02"
#p wash_v2b 34730 7 3 0.45 "contrast=1.05:saturation=1.15:brightness=0.08:gamma=1.6"
#p mosque_b 258089 2 3 0.5 "contrast=1.04:saturation=1.1"
# --- round 3: real people (Mixkit, free licence) + each clip used ONCE ---
q(){ ffmpeg -hide_banner -v error -y -ss $3 -t $4 -i public/stock/$2.mp4 -an \
 -vf "crop=ih*9/16:ih:(iw-ih*9/16)*$5:0,scale=1080:1920:flags=lanczos,setpts=PTS/1.04,fps=30,eq=$6,noise=alls=3:allf=t,vignette=PI/7" \
 -map_metadata -1 -c:v libx264 -crf 19 -preset fast -g 15 -pix_fmt yuv420p public/ad2/clips/$1.mp4 && echo ok $1; }
q r_wake1b mk_50754 5.6 4.2 0.75 "contrast=1.05:saturation=1.1:brightness=0.03"
#q r_wake2 mk_24683 5.0 4.2 0.35 "contrast=1.04:saturation=1.1"
#q r_lie mk_50931 3.0 3.4 0.5 "contrast=1.05:saturation=1.1:brightness=0.03"
#q r_face mk_23858 4.0 3.6 0.55 "contrast=1.06:saturation=1.1:brightness=0.05"
#q r_soap mk_5321 2.0 3.6 0.5 "contrast=1.05:saturation=1.15:brightness=0.05"
#q r_hands mk_18199 3.0 3.2 0.5 "contrast=1.05:saturation=1.1:brightness=0.08:gamma=1.3"
#q r_splash mk_22092 2.0 3.2 0.5 "contrast=1.04:saturation=1.1"
#q r_pray mk_34223 1.0 4.2 0.4 "contrast=1.05:saturation=1.1:brightness=0.1:gamma=1.3"
#q r_sky ad2_18390 1.0 3.5 0.5 "contrast=1.04:saturation=1.1:brightness=0.06"
