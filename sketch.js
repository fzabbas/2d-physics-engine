const BALLS = [];
const WALLS = []; 

let friction = 0.05;
// let elasticity = 1;


function setup() {
    createCanvas(640, 400);


  }

function draw() {
    background("beige");
    BALLS.forEach((b, index) => {
        b.drawBall();
        if (b.movable) {
            moveBall(b);
        }

        WALLS.forEach((w) => {
            if(coll_det_bw(BALLS[index], w)) {
                pen_res_bw(BALLS[index], w);
                coll_res_bw(BALLS[index], w);
            }
        });
        
        for (let i = index+1; i < BALLS.length; i++) {
            if (coll_det_bb(BALLS[index], BALLS[i])) {
            text("collision", 30, 30)
            pen_res_bb(BALLS[index], BALLS[i]);
            coll_res_bb(BALLS[index], BALLS[i]);
            }
        }

        b.reposition();
    });

    WALLS.forEach((w) => {
        w.drawWall();
    });
    let edge1 = new Wall (0, 0, width, 0);
    let edge2 = new Wall (0, 0, 0, height);
    let edge3 = new Wall (0, height, width, height );
    let edge4 = new Wall (width, 0, width, height);
}

function round(number, precision) {
    let factor = 10**precision;
    return (Math.round(number * factor)) / factor;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
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
    constructor(x, y, r, m) {
        this.pos = new Vector (x, y);
        this.r = r;
        this.m = m;
        if (this.m === 0) {
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
        this.elasticity = 1;
        this.velocity = new Vector(0,0);
        this.acc = new Vector (0,0);
        this.acceleration = 1;
        this.movable = false
        BALLS.push(this);
    }

    drawBall() {
        fill("yellow");
        stroke("black");
        ellipse (this.pos.x, this.pos.y, this.r*2, this.r*2);
        this.velocity.drawVector(this.x, this.y, 100, "green");
        stroke("black");
        fill("black");
        text(str("m: " + this.m), this.pos.x-10, this.pos.y-5);
        text(str("e: " + this.elasticity), this.pos.x-10, this.pos.y+5);       
    }

    reposition() {
        this.acc = this.acc.unit().multiply(this.acceleration);
        this.velocity = this.velocity.add(this.acc);
        this.velocity = this.velocity.multiply(1-friction);
        this.pos = this.pos.add(this.velocity);
    }
}

class Wall {
    constructor(x1, y1, x2, y2) {
        this.start = new Vector (x1, y1);
        this.end = new Vector (x2, y2);
        WALLS.push(this);
    }

    drawWall() {
        stroke("black");
        line(this.start.x, this.start.y, this.end.x, this.end.y);
    }

    wallUnit() {
        return this.end.subtract(this.start).unit();
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
}

function coll_det_bb(b1, b2) {
    if (b1.r + b2.r >= b2.pos.subtract(b1.pos).magnitude()) {
        return true;
    } else {
        return false;
    }
}

function coll_det_bw(b1, w1) {
    let ballToClosest = closestPointBW(b1,w1).subtract(b1.pos);
    if (ballToClosest.magnitude() <= b1.r) {
        return true;
    }
}

function pen_res_bb(b1, b2) {
    let dist = b1.pos.subtract(b2.pos);
    let pen_depth = b1.r + b2.r - dist.magnitude();
    let pen_res = dist.unit().multiply(pen_depth/(b1.inv_m + b2.inv_m));
    b1.pos = b1.pos.add(pen_res.multiply(b1.inv_m));
    b2.pos = b2.pos.add(pen_res.multiply(-b2.inv_m));
}

function pen_res_bw(b1, w1) {
    let penVec = b1.pos.subtract(closestPointBW(b1, w1));
    b1.pos = b1.pos.add(penVec.unit().multiply(b1.r-penVec.magnitude()));

}

function coll_res_bb(b1, b2) {
    let normal = b1.pos.subtract(b2.pos).unit();
    let relVel = b1.velocity.subtract(b2.velocity);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(b1.elasticity, b2.elasticity);
    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (b1.inv_m + b2.inv_m);
    let impulseVec = normal.multiply(impulse);

    b1.velocity = b1.velocity.add(impulseVec.multiply(b1.inv_m));
    b2.velocity = b2.velocity.add(impulseVec.multiply(-b2.inv_m));
}

function coll_res_bw(b1, w1) {
    let normal = b1.pos.subtract(closestPointBW(b1, w1)).unit();
    let sepVel = Vector.dot(b1.velocity, normal);
    let new_sepVel = -sepVel * b1.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    b1.velocity = b1.velocity.add(normal.multiply(-vsep_diff));
}

function closestPointBW(b1, w1) {
    let ballToWallStart = w1.start.subtract(b1.pos);
    if (Vector.dot(w1.wallUnit(), ballToWallStart) > 0) {
        return w1.start;
    } 

    let wallEndToBall = b1.pos.subtract(w1.end)
    if (Vector.dot(w1.wallUnit(), wallEndToBall) > 0) {
        return w1.end;
    }

    let closestDist = Vector.dot(w1.wallUnit(), ballToWallStart);
    let closestVec = w1.wallUnit().multiply(closestDist);
    return w1.start.subtract(closestVec);
}

for (let i = 0; i < 10; i++) {
    let newBall = new Ball (randInt(100, 500), randInt(50, 400), randInt(20,50), randInt(0,10));
    newBall.elasticity = randInt(0,10)/10;
}

// let ball1 = new Ball (200, 300, 15, 2);
// let ball2 = new Ball (200, 200, 20, 0);
let wall1 = new Wall (200, 200, 400, 300);
let wall2 = new Wall (300, 200, 400, 200); 
// let edge1 = new Wall (0, 0, 100, height)
// let ball3 = new Ball (250, 320, 30);
// let ball4 = new Ball (300, 200, 20);
// let ball5 = new Ball (300, 200, 40);
// let ball6 = new Ball (350, 220, 30);
BALLS[0].movable = true;
// ball2.elasticity = 0.3