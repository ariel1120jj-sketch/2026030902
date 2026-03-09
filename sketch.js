// 專案名稱: 不規則曲線電流急急棒
// 核心機制: 使用 curveVertex 繪製軌道，並透過頂點陣列進行碰撞檢測

// 遊戲狀態常數
const STATE_WAITING = 0; // 等待開始
const STATE_PLAYING = 1; // 遊戲中
const STATE_GAMEOVER = 2; // 失敗重來
const STATE_WIN = 3;      // 成功抵達

let gameState = STATE_WAITING;
let pathPoints = []; // 變數管理: 儲存曲線的頂點座標 (PVectors)
let trackRadius = 40; // 軌道半寬 (安全區域的一半)
let startBtnRadius = 30; // 起始按鈕半徑

function setup() {
  // 畫布設定: 響應式畫布
  createCanvas(windowWidth, windowHeight);
  // 初始化遊戲路徑
  generatePath();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generatePath();
  gameState = STATE_WAITING;
}

// 軌道生成邏輯
function generatePath() {
  pathPoints = [];
  
  // 設定: 由左至右的不規則路徑
  let xStep = 20; // 點的密度，越小越精細但效能消耗越高
  let noiseOffset = random(1000); // 隨機噪聲種子
  
  // curveVertex 繪圖特性: 
  // 必須重複第一個點和最後一個點作為控制點，曲線才會經過起點與終點。
  
  // 1. 加入起始點 (畫面左側垂直置中)
  let startY = height / 2;
  // 重複加入以作為起始控制點
  pathPoints.push(createVector(0, startY));
  pathPoints.push(createVector(0, startY));

  // 2. 生成中間路徑點
  for (let x = 0; x <= width; x += xStep) {
    let y;
    // 在起始區域 (左側 100px) 保持直線，避免一開始就發生碰撞
    if (x < 100) {
      y = height / 2;
    } else {
      // 使用 noise() 產生平滑的隨機起伏
      let n = noise(x * 0.005 + noiseOffset);
      // 將噪聲值 (0~1) 映射到畫布高度範圍 (留出上下邊界)
      y = map(n, 0, 1, 100, height - 100);
    }
    pathPoints.push(createVector(x, y));
  }

  // 3. 加入終點控制點
  let lastP = pathPoints[pathPoints.length - 1];
  pathPoints.push(lastP);
}

function draw() {
  background(20); // 深色背景，突顯電力感

  // 繪製遊戲元素
  drawTrack();
  drawZones();
  
  // 處理遊戲狀態與互動
  handleGameState();
}

function drawTrack() {
  noFill();
  strokeWeight(3);
  // 視覺效果: 電力感顏色 (螢光藍)
  stroke(0, 255, 255);

  // 繪製『上邊界』
  beginShape();
  for (let p of pathPoints) {
    // 頂點計算: 中心點 Y - 半徑
    curveVertex(p.x, p.y - trackRadius);
  }
  endShape();

  // 繪製『下邊界』
  beginShape();
  for (let p of pathPoints) {
    // 頂點計算: 中心點 Y + 半徑
    curveVertex(p.x, p.y + trackRadius);
  }
  endShape();
}

function drawZones() {
  // 起始圓圈
  noStroke();
  fill(0, 255, 0); // 綠色
  circle(startBtnRadius, height / 2, startBtnRadius * 2);
  
  // 終點區域
  fill(255, 255, 0); // 黃色
  rect(width - 50, 0, 50, height);
  
  // 文字標示
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("START", startBtnRadius, height / 2);
  fill(0);
  text("GOAL", width - 25, height / 2);
}

function handleGameState() {
  if (gameState === STATE_WAITING) {
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text("點擊綠色圓圈開始遊戲", width / 2, height - 50);
    
  } else if (gameState === STATE_PLAYING) {
    // 繪製玩家 (滑鼠位置)
    fill(255, 0, 0);
    noStroke();
    circle(mouseX, mouseY, 12);
    
    // 碰撞判定
    checkCollision();
    
    // 勝利條件: 到達最右側
    if (mouseX >= width - 50) {
      gameState = STATE_WIN;
    }
    
  } else if (gameState === STATE_GAMEOVER) {
    // 失敗提示: 紅色閃爍背景
    background(255, 0, 0, 150);
    fill(255);
    textSize(60);
    textAlign(CENTER, CENTER);
    text("GAME OVER", width / 2, height / 2);
    textSize(24);
    text("點擊任意處回到起點", width / 2, height / 2 + 60);
    
  } else if (gameState === STATE_WIN) {
    // 勝利提示
    fill(0, 255, 0);
    textSize(60);
    textAlign(CENTER, CENTER);
    text("SUCCESS!", width / 2, height / 2);
    textSize(24);
    text("點擊任意處重新開始", width / 2, height / 2 + 60);
  }
}

function checkCollision() {
  // 碰撞判定邏輯:
  // 計算滑鼠位置到所有路徑中心點的最短距離
  // 如果最短距離大於軌道半徑，表示滑鼠碰到了邊界或超出了安全區域
  
  let closestDist = Infinity;
  
  for (let p of pathPoints) {
    let d = dist(mouseX, mouseY, p.x, p.y);
    if (d < closestDist) {
      closestDist = d;
    }
  }
  
  // 容許值設定: 減去 5px 作為線條寬度的緩衝
  if (closestDist > trackRadius - 5) {
    gameState = STATE_GAMEOVER;
  }
}

function mousePressed() {
  if (gameState === STATE_WAITING) {
    // 互動邏輯: 點擊起始圓圈進入遊戲
    let d = dist(mouseX, mouseY, startBtnRadius, height / 2);
    if (d < startBtnRadius) {
      gameState = STATE_PLAYING;
    }
  } else if (gameState === STATE_GAMEOVER || gameState === STATE_WIN) {
    // 失敗或勝利後，點擊重置
    generatePath();
    gameState = STATE_WAITING;
  }
}
