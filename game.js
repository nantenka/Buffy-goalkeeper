// Buffy Goalkeeper — game.js
// Требуется папка images/ с: ball.png, goalkeeper.png, goal.png

// Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const menu = document.getElementById('menu');
const endScreen = document.getElementById('endScreen');
const endText = document.getElementById('endText');

// Images
const IMG_PATH = 'images/';
const imgBall = new Image(); imgBall.src = IMG_PATH + 'ball.png';
const imgKeeper = new Image(); imgKeeper.src = IMG_PATH + 'goalkeeper.png';
const imgGoal = new Image(); imgGoal.src = IMG_PATH + 'goal.png';

// Canvas logical size (fixed)
const W = canvas.width = 900;
const H = canvas.height = 600;

// Goal area (on canvas)
const GOAL_LEFT = 250;
const GOAL_RIGHT = 650;
const GOAL_LINE_Y = 120; // y threshold to consider "in the goal"

// Game state
let shots = 0;
let goals = 0;
let inShot = false;
let dragging = false;
let playing = false;

// Ball state
const ball = {
  x: W / 2,
  y: 520,
  r: 28,
  startY: 520,
  pull: 0,
  vx: 0,
  vy: 0
};

// Target (where player aims). target.y is fixed near goal area.
const target = { x: W / 2, y: GOAL_LINE_Y + 8 };

// Keeper state (rectangle centered at keeper.x)
const keeper = {
  x: 420,
  y: 160,
  w: 110,
  h: 140,
  speed: 2.2,
  state: 'idle' // idle or dive
};

// Utility
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function distance(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2); }

// Reset ball to starting position
function resetBall(){
  ball.x = W/2;
  ball.y = ball.startY;
  ball.vx = 0;
  ball.vy = 0;
  ball.pull = 0;
  inShot = false;
  target.x = W/2;
}

// Start game
function startGame(){
  menu.style.display = 'none';
  endScreen.style.display = 'none';
  playing = true;
  shots = 0;
  goals = 0;
  resetBall();
  keeper.x = 420;
  requestAnimationFrame(loop);
}
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

// Input: mouse/touch handling for dragging the ball (press ball, pull down)
function getCanvasPos(e){
  const r = canvas.getBoundingClientRect();
  if(e.touches) {
    return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
  } else {
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
}

canvas.addEventListener('mousedown', function(e){
  if(!playing || inShot) return;
  const p = getCanvasPos(e);
  if(distance(p.x,p.y, ball.x, ball.y) <= ball.r + 6){
    dragging = true;
  }
});
canvas.addEventListener('mousemove', function(e){
  if(!dragging) return;
  const p = getCanvasPos(e);
  // pull measured as how far cursor is above startY (we want downward pull, but user pulls down => my > startY)
  ball.pull = clamp(p.y - ball.startY, 0, 220); // bigger pull -> more power
  // horizontal aim follows cursor x but limited to goal span +/- margin
  target.x = clamp(p.x, GOAL_LEFT + 10, GOAL_RIGHT - 10);
});
canvas.addEventListener('mouseup', function(){
  if(!dragging) return;
  dragging = false;
  shoot();
});

// touch
canvas.addEventListener('touchstart', function(e){ e.preventDefault(); if(!playing || inShot) return; const p = getCanvasPos(e); if(distance(p.x,p.y, ball.x, ball.y) <= ball.r + 10){ dragging = true; } }, {passive:false});
canvas.addEventListener('touchmove', function(e){ e.preventDefault(); if(!dragging) return; const p = getCanvasPos(e); ball.pull = clamp(p.y - ball.startY, 0, 220); target.x = clamp(p.x, GOAL_LEFT+10, GOAL_RIGHT-10); }, {passive:false});
canvas.addEventListener('touchend', function(){ if(!dragging) return; dragging = false; shoot(); }, {passive:false});

// Shoot logic
function shoot(){
  if(inShot) return;
  inShot = true;
  shots++;

  // power mapping: small pull -> low, large pull -> high
  const power = clamp(ball.pull / 8 + 6, 6, 34); // tweak values
  // initial velocities
  ball.vy = -power; // negative = up
  // horizontal component based on distance to target
  ball.vx = (target.x - ball.x) * 0.018 * (power / 12); // tuned multiplier

  // Keeper reaction: set intention to move toward predicted intercept; also randomize quick-dive chance
  keeper.state = 'anticipate';
  // Slight randomness so player has chance to beat keeper
  if(Math.random() < 0.18) {
    // keeper "guesses wrong" -> slower speed
    keeper.speed = 1.6;
  } else {
    keeper.speed = 3.0;
  }
}

// Keeper movement & basic AI
function updateKeeper(){
  // If a shot is happening, keeper tries to move toward target.x (the aim)
  if(inShot){
    const targetCenter = target.x;
    const diff = targetCenter - (keeper.x + keeper.w/2);
    const move = clamp(diff * 0.02, -keeper.speed, keeper.speed);
    keeper.x += move;
    // small chance to lunge (simulate dive) if close enough and random
    if(Math.abs(diff) < 80 && Math.random() < 0.008) {
      keeper.state = 'dive';
      keeper.x += (diff > 0 ? 1 : -1) * 20;
    }
  } else {
    // idle patrol left-right slowly between limits so keeper moves
    keeper.x += Math.sin(Date.now()/800) * 0.6;
  }
  // clamp keeper within reasonable area over the goal
  keeper.x = clamp(keeper.x, GOAL_LEFT - 40, GOAL_RIGHT - keeper.w + 40);
}

// Simple circle-rect collision (ball vs keeper)
function circleRectCollision(cx, cy, r, rx, ry, rw, rh){
  // nearest point
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  return distance(cx, cy, nx, ny) <= r;
}

// Update physics each frame
function updatePhysics(){
  if(inShot){
    // apply velocities and gravity
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vy += 0.45; // gravity

    // check collision with keeper
    const krx = keeper.x;
    const kry = keeper.y;
    if(circleRectCollision(ball.x, ball.y, ball.r, krx, kry - keeper.h/2, keeper.w, keeper.h)){
      // save: reflect ball downward and give small horizontal bounce
      ball.vy = Math.abs(ball.vy) * 0.4 + 2;
      ball.vx *= -0.4;
      // mark shot ended after slight bounce: wait until ball drops below certain line
      // we will treat this as miss (not a goal). Reset after short timeout
      setTimeout(() => {
        resetBall();
        // if 5 shots already used, endGame will be invoked in loop after check
      }, 220);
      inShot = false; // allow next shot after reset
    }

    // check for goal: ball passes above GOAL_LINE_Y and within goal x-range
    if(ball.y < GOAL_LINE_Y && ball.x > GOAL_LEFT && ball.x < GOAL_RIGHT){
      // Goal scored
      goals++;
      // animate ball flying into net (continue moving for visual) then reset
      setTimeout(() => {
        resetBall();
      }, 240);
      inShot = false;
    }

    // if ball falls under ground (miss) -> reset
    if(ball.y > H + 60 || ball.x < -80 || ball.x > W + 80){
      inShot = false;
      setTimeout(resetBall, 80);
    }
  } else {
    // When not in shot, keep ball at rest on start position
    ball.x = W/2;
    ball.y = ball.startY;
  }
}

// Draw everything
function draw(){
  // background field (green) + penalty area markings
  ctx.clearRect(0,0,W,H);
  // subtle gradient field
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#1a7b36');
  g.addColorStop(1, '#14662d');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // draw goal posts (use image if loaded)
  if(imgGoal.complete){
    // draw goal image centered over GOAL area
    const gw = GOAL_RIGHT - GOAL_LEFT;
    ctx.drawImage(imgGoal, GOAL_LEFT, 20, gw, 120);
  } else {
    // fallback simple post
    ctx.fillStyle = '#fff';
    ctx.fillRect(GOAL_LEFT, 50, GOAL_RIGHT - GOAL_LEFT, 6);
  }

  // draw keeper (image centered on keeper box)
  const kdrawX = keeper.x;
  const kdrawY = keeper.y - keeper.h / 2;
  if(imgKeeper.complete){
    ctx.drawImage(imgKeeper, kdrawX, kdrawY, keeper.w, keeper.h);
  } else {
    ctx.fillStyle = '#0033aa';
    ctx.fillRect(kdrawX, kdrawY, keeper.w, keeper.h);
  }

  // draw ball (if dragging, show pulled position/line)
  if(!inShot && dragging){
    // show pulled ball visually: move down by pull
    const drawY = ball.startY + ball.pull;
    // draw line from ball to target
    ctx.strokeStyle = 'rgba(255,255,0,0.9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ball.x, drawY);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();

    // draw power bar near ball
    const pw = clamp(ball.pull / 220, 0, 1);
    ctx.fillStyle = 'rgba(255,255,0,0.18)';
    ctx.fillRect(30, H - 60, 160 * pw, 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(30, H - 60, 160, 10);

    if(imgBall.complete){
      ctx.drawImage(imgBall, ball.x - ball.r, drawY - ball.r, ball.r * 2, ball.r * 2);
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ball.x, drawY, ball.r, 0, Math.PI*2); ctx.fill();
    }
  } else {
    // normal ball drawing (either in flight or resting)
    if(imgBall.complete){
      ctx.drawImage(imgBall, ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    }
  }

  // draw target marker
  ctx.fillStyle = 'rgba(255,0,255,0.18)';
  ctx.beginPath();
  ctx.arc(target.x, target.y, 14, 0, Math.PI*2);
  ctx.fill();

  // UI text
  ctx.fillStyle = '#fff';
  ctx.font = '20px Inter, Arial';
  ctx.fillText(`Shots: ${shots}/5`, 18, 28);
  ctx.fillText(`Goals: ${goals}`, 18, 54);
}

// Game loop
function loop(){
  if(!playing) return;
  updateKeeper();
  updatePhysics();
  draw();

  // if shots reached limit, finish the game (shots increment occurs at shoot)
  if(shots >= 5 && !inShot){
    // tiny delay to let last animation finish
    setTimeout(() => {
      playing = false;
      showEndScreen();
    }, 220);
    return;
  }

  requestAnimationFrame(loop);
}

// Show end screen
function showEndScreen(){
  endText.textContent = goals >= 3 ? 'YOU WON' : 'GAME OVER';
  endScreen.style.display = 'flex';
  // show menu again only when retry pressed via start/retry handlers
}

// Initialize (draw first frame on menu so canvas appears)
resetBall();
draw();
