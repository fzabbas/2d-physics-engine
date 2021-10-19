const BALLS = [];

function setup() {
    createCanvas(640, 400);

  }
  
function draw() {
    background("beige");
    BALLS.forEach((b) => {
        b.display();
        if (b.movable) {
            moveBall(b);
        }
    })
}

class Ball{
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.movable = false
        BALLS.push(this);
    }

    display() {
        fill("yellow");
        stroke("black");
        ellipse(this.x, this.y, this.r, this.r)
    }
}

function moveBall(b){
    if (keyIsDown(LEFT_ARROW)){
        b.x--;
    }
    if (keyIsDown(RIGHT_ARROW)){
        b.x++;
    }
    if (keyIsDown(UP_ARROW)){
        b.y--;
    }
    if (keyIsDown(DOWN_ARROW)) {
        b.y++
    }
}

let ball1 = new Ball (200, 300, 10);
let ball2 = new Ball (200, 200, 80);
ball2.movable = true;