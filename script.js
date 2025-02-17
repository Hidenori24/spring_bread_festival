// 要素の取得
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');

// Webカメラにアクセス
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  })
  .catch(err => {
    console.error("Webカメラにアクセスできません: ", err);
  });

// 画像処理関数：各フレームごとに赤系シールを検出し、点数に換算
function processFrame() {
  // 動画をキャンバスへ描画
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = imageData.data;
  
  let redPixelCount = 0;
  // 各ピクセルをチェック
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // ここでは、赤が強く、緑・青が低い場合をシールとみなす
    if (r > 150 && g < 100 && b < 100) {
      redPixelCount++;
      // デバッグ用：該当ピクセルを白くする場合は以下のコメントアウトを外す
      // data[i] = 255;
      // data[i + 1] = 255;
      // data[i + 2] = 255;
    }
  }
  
  // デバッグ用に画像をキャンバスに反映させる場合は以下のコメントアウトを外す
  // ctx.putImageData(imageData, 0, 0);

  // シンプルな blob 判定：しきい値を元に検出件数を算出
  const blobThreshold = 500; // 1シールあたりの目安となるピクセル数
  const detectedBlobs = Math.floor(redPixelCount / blobThreshold);

  // 点数表示を更新
  scoreDiv.textContent = 'Score: ' + detectedBlobs;

  // 次のフレームで再処理
  requestAnimationFrame(processFrame);
}

// 動画再生が始まったら処理開始
video.addEventListener('playing', () => {
  requestAnimationFrame(processFrame);
});
