const BALLS = [];
let friction = 0.1;


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

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector (this.x+v.x, this.y+v.y)
    }

    subtract(v) {
        return new Vector (this.x-v.x, this.y-v.y)
    }

    magnitude() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    multiply(n) {
        return new Vector (n*this.x, n*this.y);
    }

    drawVector(start_x, start_y, n, colour) {
        stroke(colour)
        line(start_x, start_y, start_x + this.x*n, start_y + this.y*n)
    }

    normal() {
        return new Vector (-this.y, this.x).unit();
    }

    unit() {
        if (this.magnitude() == 0) {
            return new Vector(0,0);
        }
        return new Vector(this.x/this.magnitude(), this.y/this.magnitude());
    }t
    static dot (v1, v2) {
        return v1.x*v2.x + v1.y*v2.y;
    }
}

class Ball{
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.velocity = new Vector(0,0);
        this.acc = new Vector (0,0);
        this.acceleration = 1;
        this.movable = false
        BALLS.push(this);
    }

    display() {
        fill("yellow");
        stroke("black");
        ellipse(this.x, this.y, this.r, this.r);
        this.velocity.drawVector(550, 350, 10, "green");
        this.acc.unit().drawVector(550, 350, 50, "blue");
        this.acc.normal().drawVector(550, 350, 50, "yellow");
        noFill()
        stroke("black");
        ellipse(550, 350, 100, 100);        
    }
}

function moveBall(b){
    if (keyIsDown(LEFT_ARROW)){
        b.acc.x = -b.acceleration;
    }
    if (keyIsDown(RIGHT_ARROW)){
        b.acc.x = b.acceleration;
    }
    if (keyIsDown(UP_ARROW)){
        b.acc.y = -b.acceleration;
    }
    if (keyIsDown(DOWN_ARROW)) {
        b.acc.y = b.acceleration;
    }
    if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
        b.acc.y = 0;
    }
    if (!(keyIsDown(LEFT_ARROW)) && (!(keyIsDown(RIGHT_ARROW)))){
        b.acc.x = 0;
    }

    b.acc = b.acc.unit().multiply(b.acceleration);
    b.velocity = b.velocity.add(b.acc);
    b.velocity = b.velocity.multiply(1-friction);
    b.x += b.velocity.x;
    b.y += b.velocity.y;


}

let ball1 = new Ball (200, 300, 10);
let ball2 = new Ball (200, 200, 80);
ball2.movable = true;