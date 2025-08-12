#!/bin/bash

# Create test broll videos with different colored gradients
cd "/Users/rjayerbe/Web Development Local/yt-auto"

echo "🎬 Creating test broll videos..."

# Array of video IDs from symlinks
videos=(
  "3754902:gradient=blue:purple"
  "5054428:gradient=red:orange"
  "5989753:gradient=green:teal"
  "6406028:gradient=purple:pink"
  "6781972:gradient=yellow:orange"
  "6929084:gradient=cyan:blue"
  "6931246:gradient=magenta:purple"
  "7679837:gradient=orange:red"
  "7699006:gradient=teal:green"
  "8128500:gradient=pink:purple"
  "8322040:gradient=blue:cyan"
  "8322053:gradient=purple:blue"
  "8322054:gradient=green:yellow"
  "8458492:gradient=red:pink"
  "8468476:gradient=orange:yellow"
  "8870288:gradient=cyan:teal"
)

for video_info in "${videos[@]}"; do
  IFS=':' read -r id type colors <<< "$video_info"
  IFS=':' read -r color1 color2 <<< "$colors"
  
  output_file="output/broll/broll-${id}.mp4"
  
  echo "Creating broll-${id}.mp4 with ${color1} to ${color2} gradient..."
  
  # Create a gradient video with some motion
  ffmpeg -f lavfi -i "gradients=size=1080x1920:duration=10:c0=${color1}:c1=${color2}:x0=0:y0=0:x1=0:y1=1920" \
    -vf "format=yuv420p,rotate='2*PI*t/10':c=none:ow=1080:oh=1920" \
    -c:v libx264 -preset ultrafast -t 10 \
    "${output_file}" -y 2>/dev/null || \
  # Fallback to simple color if gradient fails
  ffmpeg -f lavfi -i "color=c=${color1}:s=1080x1920:d=10" \
    -vf "format=yuv420p,hue=s=sin(2*PI*t/10):h=360*t/10" \
    -c:v libx264 -preset ultrafast -t 10 \
    "${output_file}" -y 2>/dev/null || \
  # Final fallback to basic colored video
  ffmpeg -f lavfi -i "color=c=${color1}:s=1080x1920:d=10" \
    -c:v libx264 -pix_fmt yuv420p \
    "${output_file}" -y 2>/dev/null
done

echo "✅ Test broll videos created successfully!"