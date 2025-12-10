// Buffy Goalkeeper — optimized for PC & mobile, using ball1.png

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const menu = document.getElementById('menu');
const endScreen = document.getElementById('endScreen');
const endText = document.getElementById('endText');

// Images
const IMG_PATH = 'images/';
const imgBall = new Image(); imgBall.src = IMG_PATH + 'ball1.png';
const imgKeeper = new Image(); imgKeeper.src = IMG_PATH + 'goalkeeper.png';
const imgGoal = new Image(); imgGoal.src = IMG_PATH + 'goal.png';

// Canvas size (adaptive)
function resizeCanvas(){
  canvas.width = window.innerWidth < 900 ? window.innerWidth : 900;
  canvas.height = window.innerHeight < 600 ? window.innerHeight : 600;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Constants
const GOAL_LEFT = canvas.width*0.28;
const GOAL_RIGHT = canvas.width*0.72;
const GOAL_LINE_Y = canvas.height*0.2;

// Game state
let shots = 0, goals = 0, dragging = false, inShot = false, playing = false;

// Ball
const ball = { x: canvas.width/2, y: canvas.height-80, r:28, startY:canvas.height-80, pull:0, vx:0, vy:0 };
const target = { x:canvas.width/2, y:GOAL_LINE_Y+10 };

// Keeper
const keeper = { x:canvas.width*0.45, y:GOAL_LINE_Y+40, w:110, h:140, speed:2.2 };

// Utils
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)) }
function distance(x1,y1,x2,y2){ return Math.hypot(x1-x2,y1-y2) }
function resetBall(){ ball.x=canvas.width/2; ball.y=ball.startY; ball.vx=0; ball.vy=0; ball.pull=0; inShot=false; target.x=canvas.width/2 }

// Start game
function startGame(){
  menu.style.display='none';
  endScreen.style.display='none';
  shots=0; goals=0; playing=true;
  resetBall();
  keeper.x=canvas.width*0.45;
  requestAnimationFrame(loop);
}
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

// Input
function getPos(e){
  const r = canvas.getBoundingClientRect();
  if(e.touches) return { x:e.touches[0].clientX-r.left, y:e.touches[0].clientY-r.top };
  else return { x:e.clientX-r.left, y:e.clientY-r.top };
}

function startDrag(e){
  if(!playing || inShot) return;
  const p = getPos(e);
  if(distance(p.x,p.y, ball.x, ball.y)<=ball.r+6) dragging=true;
}
function dragMove(e){
  if(!dragging) return;
  const p = getPos(e);
  ball.pull = clamp(p.y - ball.startY,0,220);
  target.x = clamp(p.x, GOAL_LEFT+10, GOAL_RIGHT-10);
}
function endDrag(){ if(!dragging) return; dragging=false; shoot(); }

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', dragMove);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); startDrag(e) }, {passive:false});
canvas.addEventListener('touchmove', e=>{ e.preventDefault(); dragMove(e) }, {passive:false});
canvas.addEventListener('touchend', e=>{ e.preventDefault(); endDrag() }, {passive:false});

// Shoot
function shoot(){
  if(inShot) return;
  inShot=true; shots++;
  const power = clamp(ball.pull/8+6,6,34);
  ball.vy=-power;
  ball.vx=(target.x-ball.x)*0.018*(power/12);
  keeper.speed=Math.random()<0.18?1.6:3.0;
}

// Keeper
function updateKeeper(){
  if(inShot){
    const diff = target.x - (keeper.x+keeper.w/2);
    const move = clamp(diff*0.02,-keeper.speed,keeper.speed);
    keeper.x+=move;
  } else keeper.x+=Math.sin(Date.now()/800)*0.6;
  keeper.x=clamp(keeper.x,GOAL_LEFT-40,GOAL_RIGHT-keeper.w+40);
}

// Collision
function circleRectCollision(cx,cy,r,rx,ry,rw,rh){
  const nx=clamp(cx,rx,rx+rw), ny=clamp(cy,ry,ry+rh);
  return distance(cx,cy,nx,ny)<=r;
}

// Physics
function updatePhysics(){
  if(inShot){
    ball.x+=ball.vx; ball.y+=ball.vy; ball.vy+=0.45;
    if(circleRectCollision(ball.x,ball.y,ball.r,keeper.x,keeper.y-keeper.h/2,keeper.w,keeper.h)){
      ball.vy=Math.abs(ball.vy)*0.4+2; ball.vx*=-0.4;
      setTimeout(()=>{ resetBall(); },220);
      inShot=false;
    }
    if(ball.y<GOAL_LINE_Y && ball.x>GOAL_LEFT && ball.x<GOAL_RIGHT){
      goals++; setTimeout(()=>{ resetBall() },240); inShot=false;
    }
    if(ball.y>canvas.height+60||ball.x<-80||ball.x>canvas.width+80){
      inShot=false; setTimeout(resetBall,80);
    }
  } else { ball.x=canvas.width/2; ball.y=ball.startY; }
}

// Draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const g=ctx.createLinearGradient(0,0,0,canvas.height);
  g.addColorStop(0,'#1a7b36'); g.addColorStop(1,'#14662d'); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height);

  if(imgGoal.complete) ctx.drawImage(imgGoal, GOAL_LEFT, 20, GOAL_RIGHT-GOAL_LEFT, 120);
  else { ctx.fillStyle='#fff'; ctx.fillRect(GOAL_LEFT,50,GOAL_RIGHT-GOAL_LEFT,6); }

  ctx.drawImage(imgKeeper, keeper.x, keeper.y-keeper.h/2, keeper.w, keeper.h);

  if(!inShot && dragging){
    const drawY=ball.startY+ball.pull;
    ctx.strokeStyle='rgba(255,255,0,0.9)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(ball.x,drawY); ctx.lineTo(target.x,target.y); ctx.stroke();
    const pw=clamp(ball.pull/220,0,1);
    ctx.fillStyle='rgba(255,255,0,0.18)'; ctx.fillRect(30,canvas.height-60,160*pw,10);
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.strokeRect(30,canvas.height-60,160,10);
    ctx.drawImage(imgBall, ball.x-ball.r, drawY-ball.r, ball.r*2, ball.r*2);
  } else ctx.drawImage(imgBall, ball.x-ball.r, ball.y-ball.r, ball.r*2, ball.r*2);

  ctx.fillStyle='rgba(255,0,255,0.18)'; ctx.beginPath(); ctx.arc(target.x,target.y,14,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='20px Inter, Arial';
  ctx.fillText(`Shots: ${shots}/5`,18,28); ctx.fillText(`Goals: ${goals}`,18,54);
}

// Loop
function loop(){
  if(!playing) return;
  updateKeeper(); updatePhysics(); draw();
  if(shots>=5 && !inShot) setTimeout(()=>{ playing=false; endScreen.style.display='flex'; endText.textContent=goals>=3?'YOU WON':'GAME OVER'; },220);
  else requestAnimationFrame(loop);
}

resetBall(); draw();
