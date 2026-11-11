// A silent loop's poster: its first frame, a JPEG beside it (gears.mp4,
// gears.jpg), made with
//   ffmpeg -i gears.mp4 -frames:v 1 -map_metadata -1 -q:v 5 gears.jpg
export const posterOf = (video: string) => video.replace(/\.\w+$/, '.jpg');
