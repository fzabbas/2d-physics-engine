const BALLS = [];
const WALLS = []; 
const CAPS = [];

let friction = 0.05;

function setup() {
    createCanvas(640, 400);
}

function round(number, precision) {
    let factor = 10**precision;
    return (Math.round(number * factor)) / factor;
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max-min+1)) + min;
}

function rotMx(angle) {
    let mx = new Matrix(2,2);
    mx.data[0][0] = Math.cos(angle);
    mx.data[0][1] = -Math.sin(angle);
    mx.data[1][0] = Math.sin(angle);
    mx.data[1][1] = Math.cos(angle);
    return mx;
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
    }
    static dot (v1, v2) {
        // console.log(v1)
        return v1.x*v2.x + v1.y*v2.y;
    }

    static cross (v1, v2) {
        return v1.x*v2.y - v1.y*v2.x;
    }
}

class Matrix {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.data = [];

        for (let i = 0; i<this.rows; i++) {
            this.data[i] = [];
            for (let j=0; j<this.cols; j++) {
                this.data[i][j] = 0;
            }
        }
    }

    multiplyVec(vec) {
        let result = new Vector (0, 0);
        result.x = this.data[0][0]*vec.x + this.data[0][1]*vec.y;
        result.y = this.data[1][0]*vec.x + this.data[1][1]*vec.y;
        return result
    }
}

class Ball {
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

    keyControl(){
        if (keyIsDown(LEFT_ARROW)){
            this.acc.x = -this.acceleration;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.acc.x = this.acceleration;
        }
        if (keyIsDown(UP_ARROW)){
            this.acc.y = -this.acceleration;
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc.y = this.acceleration;
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc.y = 0;
        }
        if (!(keyIsDown(LEFT_ARROW)) && (!(keyIsDown(RIGHT_ARROW)))){
            this.acc.x = 0;
        }
    }

    reposition() {
        this.acc = this.acc.unit().multiply(this.acceleration);
        this.velocity = this.velocity.add(this.acc);
        this.velocity = this.velocity.multiply(1-friction);
        this.pos = this.pos.add(this.velocity);
    }
}

class Capsule {
    constructor(x1, y1, x2, y2, r, m) {
        this.start = new Vector (x1, y1);
        this.end = new Vector(x2, y2);
        this.r = r;
        this.elasticity = 1;
        this.length = this.end.subtract(this.start).magnitude();
        this.m = m;
        this.inertia = this.m * (this.r**2 +(this.length+2*this.r)**2) / 12;
        if (this.m === 0) {
            this.inv_m = 0;
            this.inv_inertia = 0
        } else {
            this.inv_m = 1 / this.m;
            this.inv_inertia = 1 / this.inertia;
        }
        this.velocity = new Vector(0,0);
        this.acc = new Vector (0,0);
        this.acceleration = 1;
        this.pos = this.start.add(this.end).multiply(0.5);
        this.dir = this.end.subtract(this.start).unit();
        this.refDir = this.end.subtract(this.start).unit();
        this.refAngle = Math.acos(Vector.dot(this.refDir, new Vector(1, 0)));
        this.angVel = 0;
        this.angle = 0;
        if (Vector.cross(this.refDir, new Vector (1, 0)) > 0) {
            this.refAngle *= -1;
        }
        this.player = false;
        CAPS.push(this);
    }

    drawCaps(){
        // stroke("black");
        noStroke();
        fill("lightgreen");
        // noFill();
        let cur_angle = this.refAngle + this.angle
        arc(this.start.x, this.start.y, this.r*2, this.r*2, cur_angle+HALF_PI, cur_angle+3**HALF_PI, PIE);
        arc(this.end.x, this.end.y, this.r*2, this.r*2, cur_angle-HALF_PI, cur_angle+HALF_PI, PIE);
        beginShape();
        vertex(this.start.x + this.r * Math.cos(cur_angle+HALF_PI), this.start.y + this.r * Math.sin(cur_angle+HALF_PI));
        vertex(this.start.x + this.r * Math.cos((cur_angle+3*HALF_PI)), this.start.y + this.r * Math.sin(cur_angle+3*HALF_PI));
        vertex(this.end.x + this.r * Math.cos(cur_angle-HALF_PI), this.end.y + this.r * Math.sin(cur_angle-HALF_PI));
        vertex(this.end.x + this.r * Math.cos(cur_angle+HALF_PI), this.end.y + this.r * Math.sin(cur_angle+HALF_PI));
        endShape(CLOSE); 
        stroke("black");
        line(this.start.x, this.start.y, this.end.x, this.end.y);     
    };

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.dir.multiply(-this.acceleration);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.dir.multiply(this.acceleration);
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc = new Vector (0, 0);
        }
        if (keyIsDown(LEFT_ARROW)){
            this.angVel = -0.1;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.angVel = 0.1;
        }
        
    };
    reposition(){
        this.acc = this.acc.unit().multiply(this.acceleration);
        this.velocity = this.velocity.add(this.acc);
        this.velocity = this.velocity.multiply(1-friction);
        this.pos = this.pos.add(this.velocity);
        this.angle += this.angVel;
        this.angVel *= 0.99;
        let rotMat = rotMx(this.angle);
        this.dir = rotMat.multiplyVec(this.refDir);
        this.start = this.pos.add(this.dir.multiply(-this.length/2));
        this.end = this.pos.add(this.dir.multiply(this.length/2));
        
    };
}

class Wall {
    constructor(x1, y1, x2, y2) {
        this.start = new Vector (x1, y1);
        this.end = new Vector (x2, y2);
        this.center = this.start.add(this.end).multiply(0.5);
        this.length = this.end.subtract(this.start).magnitude();
        this.dir = this.end.subtract(this.start).unit();
        this.refStart = new Vector (x1, y1);
        this.refEnd = new Vector (x2, y2);
        this.refUnit = this.end.subtract(this.start).unit();
        this.angVel = 0;
        this.angle = 0;
        WALLS.push(this);
    }

    drawWall() {
        let rotMat = rotMx(this.angle);
        let newDir = rotMat.multiplyVec(this.refUnit);
        this.start = this.center.add(newDir.multiply(-this.length/2));
        this.end = this.center.add(newDir.multiply(this.length/2));
        stroke("black");
        line(this.start.x, this.start.y, this.end.x, this.end.y);
    }

    keyControl() {
        if (keyIsDown(LEFT_ARROW)){
            this.angVel = -0.5;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.angVel = 0.5;
        }
    }

    reposition () {
        this.angle += this.angVel;
        this.angVel *= 0.96;
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
    let ballToClosest = closestPointOnLS(b1.pos,w1).subtract(b1.pos);
    if (ballToClosest.magnitude() <= b1.r) {
        return true;
    }
}

function coll_det_cc(c1,c2){
    if (c1.r + c2.r >= closestPointBetweenLS(c1, c2)[0].subtract(closestPointBetweenLS(c1, c2)[1]).magnitude()) {
        return true;
    } else {
        return false;
    }
};

function pen_res_bb(b1, b2) {
    let dist = b1.pos.subtract(b2.pos);
    let pen_depth = b1.r + b2.r - dist.magnitude();
    let pen_res = dist.unit().multiply(pen_depth/(b1.inv_m + b2.inv_m));
    b1.pos = b1.pos.add(pen_res.multiply(b1.inv_m));
    b2.pos = b2.pos.add(pen_res.multiply(-b2.inv_m));
}

function pen_res_bw(b1, w1) {
    let penVec = b1.pos.subtract(closestPointOnLS(b1.pos, w1));
    b1.pos = b1.pos.add(penVec.unit().multiply(b1.r-penVec.magnitude()));
}

function pen_res_cc(c1, c2){
    let dist = closestPointBetweenLS(c1, c2)[0].subtract(closestPointBetweenLS(c1, c2)[1]);
    let pen_depth = c1.r + c2.r - dist.magnitude();
    let pen_res = dist.unit().multiply(pen_depth/(c1.inv_m + c2.inv_m));
    c1.pos = c1.pos.add(pen_res.multiply(c1.inv_m));
    c2.pos = c2.pos.add(pen_res.multiply(-c2.inv_m));
};

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
    let normal = b1.pos.subtract(closestPointOnLS(b1.pos, w1)).unit();
    let sepVel = Vector.dot(b1.velocity, normal);
    let new_sepVel = -sepVel * b1.elasticity;
    let vsep_diff = sepVel - new_sepVel;
    
    b1.velocity = b1.velocity.add(normal.multiply(-vsep_diff));
}

function coll_res_cc(c1, c2){
    let normal = closestPointBetweenLS(c1, c2)[0].subtract(closestPointBetweenLS(c1, c2)[1]).unit();

    // closing velocity
    let collArm1 = closestPointBetweenLS(c1, c2)[0].subtract(c1.pos).add(normal.multiply(c1.r));
    let rotVel1 = new Vector(-c1.angVel * collArm1.y, c1.angVel * collArm1.x);
    let closVel1 = c1.velocity.add(rotVel1);
    let collArm2 = closestPointBetweenLS(c1, c2)[1].subtract(c2.pos).add(normal.multiply(-c2.r));
    let rotVel2 = new Vector(-c2.angVel * collArm2.y, c2.angVel * collArm2.x);
    let closVel2 = c2.velocity.add(rotVel2);

    // impulse augmentation
    let impAug1 = Vector.cross(collArm1, normal);
    impAug1 = impAug1 * c1.inv_inertia * impAug1;
    let impAug2 = Vector.cross(collArm2, normal);
    impAug2 = impAug2 * c1.inv_inertia * impAug2;

    let relVel = closVel1.subtract(closVel2);
    // let relVel = c1.velocity.subtract(c2.velocity);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(c1.elasticity, c2.elasticity);
    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (c1.inv_m + c2.inv_m + impAug1 + impAug2);    
    // let impulse = vsep_diff / (c1.inv_m + c2.inv_m);
    let impulseVec = normal.multiply(impulse);

    // changing Velocities
    c1.velocity = c1.velocity.add(impulseVec.multiply(c1.inv_m));
    c2.velocity = c2.velocity.add(impulseVec.multiply(-c2.inv_m));

    c1.angVel += c1.inv_inertia * Vector.cross(collArm1, impulseVec)
    c2.angVel -= c2.inv_inertia * Vector.cross(collArm2, impulseVec)

};

function closestPointOnLS(p, w1) {
    let ballToWallStart = w1.start.subtract(p);
    if (Vector.dot(w1.dir, ballToWallStart) > 0) {
        return w1.start;
    } 

    let wallEndToBall = p.subtract(w1.end)
    if (Vector.dot(w1.dir, wallEndToBall) > 0) {
        return w1.end;
    }

    let closestDist = Vector.dot(w1.dir, ballToWallStart);
    let closestVec = w1.dir.multiply(closestDist);
    return w1.start.subtract(closestVec);
}

function closestPointBetweenLS(c1, c2) {
    let shortestDist = closestPointOnLS(c1.start, c2).subtract(c1.start).magnitude();
    let closestPoints = [c1.start, closestPointOnLS(c1.start, c2)];
    if (closestPointOnLS(c1.end, c2).subtract(c1.end).magnitude() < shortestDist){
        shortestDist = closestPointOnLS(c1.end, c2).subtract(c1.end).magnitude();
        closestPoints = [c1.end, closestPointOnLS(c1.end, c2)]
    }
    if (closestPointOnLS(c2.start, c1).subtract(c2.start).magnitude() < shortestDist){
        shortestDist = closestPointOnLS(c2.start, c1).subtract(c2.start).magnitude();
        closestPoints = [c2.start, closestPointOnLS(c2.start, c1)]
    }
    if (closestPointOnLS(c2.end, c1).subtract(c2.end).magnitude() < shortestDist){
        shortestDist = closestPointOnLS(c2.end, c1).subtract(c2.end).magnitude();
        closestPoints = [c2.end, closestPointOnLS(c2.end, c1)]
    }
    stroke("red");
    line(closestPoints[0].x, closestPoints[0].y, closestPoints[1].x, closestPoints[1].y);
    ellipse(closestPoints[0].x, closestPoints[0].y, c1.r*2, c1.r*2);
    ellipse(closestPoints[1].x, closestPoints[1].y, c2.r*2, c2.r*2);
    return closestPoints;
}


function draw() {
    background("beige");
    BALLS.forEach((b, index) => {
        b.drawBall();
        if (b.movable) {
            b.keyControl();
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
        w.keyControl();
        w.reposition();
    });

    CAPS.forEach((c, index) => {
        c.drawCaps();
        if (c.player) {
            c.keyControl();
        }
        for (let i = index+1; i < CAPS.length; i++) {

            if (coll_det_cc(CAPS[index], CAPS[i])) {
                text("collision", 30, 30)
                pen_res_cc(CAPS[index], CAPS[i]);
                coll_res_cc(CAPS[index], CAPS[i]);
            }
        }
        c.reposition();
    });

    // let edge1 = new Wall (0, 0, width, 0);
    // let edge2 = new Wall (0, 0, 0, height);
    // let edge3 = new Wall (0, height, width, height );
    // let edge4 = new Wall (width, 0, width, height);
}

// for (let i = 0; i < 10; i++) {
//     let newBall = new Ball (randInt(100, 500), randInt(50, 400), randInt(20,50), randInt(0,10));
//     newBall.elasticity = randInt(0,10)/10;
// }

// let ball1 = new Ball (200, 300, 15, 2);
// let ball2 = new Ball (200, 200, 20, 0);
// let wall1 = new Wall (200, 200, 400, 300);
let cap1 = new Capsule (200, 300, 400, 200, 30, 2);
let cap2 = new Capsule (150, 50, 150, 300, 30, 3);

// let wall2 = new Wall (300, 200, 400, 200); 
// let edge1 = new Wall (0, 0, 100, height)
// let ball3 = new Ball (250, 320, 30);
// let ball4 = new Ball (300, 200, 20);
// let ball5 = new Ball (300, 200, 40);
// let ball6 = new Ball (350, 220, 30);
// BALLS[0].movable = true;
cap1.player = true;
// ball2.elasticity = 0.3