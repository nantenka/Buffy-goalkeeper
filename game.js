// Buffy Goalkeeper — game.js
// Положи ball.png и goalkeeper.png рядом с этими файлами.


const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const menu = document.getElementById('menu');
const endScreen = document.getElementById('endScreen');
const endText = document.getElementById('endText');


// картинки (пользователь загружает свои файлы с такими именами)
const imgBall = new Image(); imgBall.src = 'ball.png';
const imgKeeper = new Image(); imgKeeper.src = 'goalkeeper.png';


// состояние игры
let shots = 0;
let goals = 0;
let dragging = false;
let inShot = false;


// мяч
const ball = { x: 450, y: 520, r: 24, startY: 520, pull: 0 };
// цель прицела
const target = { x: 450, y: 150 };


// вратарь
const keeper = { x: 400, y: 150, w: 100, h: 120, dx: 2.2 };
function endGame(){ canvas.style.display='none'; endScreen.style.display='flex'; endText.innerText = goals >= 3 ? 'YOU WON' : 'GAME OVER'; }
