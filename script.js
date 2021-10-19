// console.log("JS works")

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');



function drawBall(x, y, r){
    ctx.beginPath();
    ctx.arc(x,y,r, 0, 2*Math.PI);
    ctx.strokeStyle ="black";
    ctx.stroke();
    ctx.fillStyle = "red";
    ctx.fill();
}

drawBall(100, 100, 20);
drawBall(200,100,30)

