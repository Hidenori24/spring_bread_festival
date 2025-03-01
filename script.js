// 要素の取得
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');

// Webカメラにアクセス（背面カメラを指定）
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" } // ← 背面カメラ
}).then(stream => {
  video.srcObject = stream;
  video.play();
}).catch(err => {
  console.error("Webカメラにアクセスできません: ", err);
});

// HSV変換関数
function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, v];
}

// ピンク色判定（HSVベース）
function isPinkColor(r, g, b) {
  let [h, s, v] = rgbToHsv(r, g, b);
  return (h > 270 && h < 330) && (s > 0.3) && (v > 0.4);
}

// フレーム処理関数
function processFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  let detectedStickers = [];

  // 画像全体を5px間隔でスキャン（計算負荷を軽減）
  for (let y = 0; y < canvas.height; y += 5) {
    for (let x = 0; x < canvas.width; x += 5) {
      let i = (y * canvas.width + x) * 4;
      let r = data[i], g = data[i + 1], b = data[i + 2];

      if (isPinkColor(r, g, b)) {
        detectedStickers.push({ x, y });
      }
    }
  }

  // シールをグループ化し、矩形（外接四角形）を求める
  let groupedStickers = groupNearbyStickers(detectedStickers);

  // 矩形を描画（青色の枠）
  drawBoundingBoxes(ctx, groupedStickers);

  // 点数を表示
  scoreDiv.textContent = `Score: ${groupedStickers.length}`;

  requestAnimationFrame(processFrame);
}

// 近くのシールをグループ化し、矩形を取得
function groupNearbyStickers(detectedStickers, threshold = 15) {
  let groups = [];
  let visited = new Set();

  detectedStickers.forEach(sticker => {
    let key = `${sticker.x},${sticker.y}`;
    if (visited.has(key)) return;

    let group = [sticker];
    visited.add(key);

    detectedStickers.forEach(other => {
      let otherKey = `${other.x},${other.y}`;
      if (!visited.has(otherKey) &&
        Math.abs(sticker.x - other.x) < threshold &&
        Math.abs(sticker.y - other.y) < threshold) {
        group.push(other);
        visited.add(otherKey);
      }
    });

    // グループの最小矩形を求める
    let minX = Math.min(...group.map(s => s.x));
    let minY = Math.min(...group.map(s => s.y));
    let maxX = Math.max(...group.map(s => s.x));
    let maxY = Math.max(...group.map(s => s.y));

    groups.push({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      count: group.length
    });
  });

  return groups;
}

// 矩形描画（青色の枠）
function drawBoundingBoxes(ctx, stickers) {
  ctx.strokeStyle = "blue";  // 矩形の色
  ctx.lineWidth = 2;
  ctx.font = "16px Arial";
  ctx.fillStyle = "white";

  stickers.forEach(sticker => {
    let { x, y, width, height, count } = sticker;
    ctx.strokeRect(x, y, width, height);  // 青色の枠を描画
    ctx.fillText(`${count}点`, x + width / 2, y - 5); // 中心に近くのシール数を表示
  });
}

// 動画が再生されたら開始
video.addEventListener('playing', () => {
  requestAnimationFrame(processFrame);
});