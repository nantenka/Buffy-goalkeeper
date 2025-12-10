// Buffy Goalkeeper — Полная рабочая логика игры


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const menu = document.getElementById('menu');
const endScreen = document.getElementById('endScreen');
const endText = document.getElementById('endText');


// картинки
const imgBall = new Image(); imgBall.src = 'ball.png';
const imgKeeper = new Image(); imgKeeper.src = 'goalkeeper.png';
const imgGoal = new Image(); imgGoal.src = 'goal.png';


// состояние
let shots = 0;
let goals = 0;
let dragging = false;
let inShot = false;


// объект мяча
const ball = { x: 450, y: 520, r: 28, startY: 520, pull: 0, vx: 0, vy: 0 };


// прицел
const target = { x: 450, y: 150 };


// вратарь
const keeper = { x: 400, y: 150, w: 100, h: 120, dx: 2 };


function resetBall() {
ball.x = 450;
ball.y = 520;
ball.vx = 0;
ball.vy = 0;
inShot = false;
}


function startGame() {
menu.style.display = 'none';
canvas.style.display = 'block';


goals = 0;
shots = 0;
resetBall();
animate();
}


startBtn.addEventListener('click', startGame);


retryBtn.addEventListener('click', () => {
endScreen.style.display = 'none';
canvas.style.display = 'block';
goals = 0;
shots = 0;
resetBall();
animate();
});


// управление мышью
canvas.addEventListener('mousedown', e => {
if (inShot) return;
}
