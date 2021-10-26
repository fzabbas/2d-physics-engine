const BODIES = [];
const COLLISIONS = [];

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

function testCircle(x, y, color="black"){
    stroke(color);
    ellipse(x, y, 10, 10);
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
        } else {
            return new Vector(this.x/this.magnitude(), this.y/this.magnitude());
        }
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

class Line {
    constructor(x0, y0, x1, y1) {
        this.vertex = [];
        this.vertex[0] = new Vector (x0, y0);
        this.vertex[1] = new Vector (x1, y1);
        this.dir = this.vertex[1].subtract(this.vertex[0]).unit();
        this.magnitude = this.vertex[1].subtract(this.vertex[0]).magnitude();
        this.pos = new Vector((this.vertex[0].x+this.vertex[1].x)/2, (this.vertex[0].y+this.vertex[1].y)/2);
    }

    draw() {
        stroke("black");
        line(this.vertex[0].x, this.vertex[0].y, this.vertex[1].x, this.vertex[1].y);
    }
}
class Circle {
    constructor(x, y, r) {
        this.vertex = [];
        this.pos = new Vector(x,y);
        this.r = r;
    }

    draw(){
        stroke("red")
        noFill();
        ellipse(this.pos.x, this.pos.y, 2*this.r, 2*this.r);
        // fill("red");
    }
}

class Rectangle {
    constructor(x1, y1, x2, y2, w) {
        this.vertex = [];
        this.vertex[0] = new Vector (x1, y1);
        this.vertex[1] = new Vector (x2, y2);
        this.dir = this.vertex[1].subtract(this.vertex[0]).unit();
        this.refDir = this.vertex[1].subtract(this.vertex[0]).unit();
        this.length = this.vertex[1].subtract(this.vertex[0]).magnitude();
        this.width = w;
        this.vertex[2] = this.vertex[1].add(this.dir.normal().multiply(this.width));
        this.vertex[3] = this.vertex[2].add(this.dir.normal().multiply(-this.length));
        this.pos = this.vertex[0].add(this.dir.multiply(this.length/2)).add(this.dir.normal().multiply(this.width/2));
        this.angle = 0;
        this.rotMat = new Matrix(2,2);
    }

    draw() {
        stroke("black")
        noFill();
        beginShape();
        vertex(this.vertex[0].x, this.vertex[0].y);
        vertex(this.vertex[1].x, this.vertex[1].y);
        vertex(this.vertex[2].x, this.vertex[2].y);
        vertex(this.vertex[3].x, this.vertex[3].y);
        vertex(this.vertex[0].x, this.vertex[0].y);
        endShape()
    }

    getVertices() {
        this.rotMat = rotMx(this.angle);
        this.dir = this.rotMat.multiplyVec(this.refDir)
        this.vertex[0] = this.pos.add(this.dir.multiply(-this.length/2)).add(this.dir.normal().multiply(this.width/2));
        this.vertex[1] = this.pos.add(this.dir.multiply(-this.length/2)).add(this.dir.normal().multiply(-this.width/2));
        this.vertex[2] = this.pos.add(this.dir.multiply(this.length/2)).add(this.dir.normal().multiply(-this.width/2));
        this.vertex[3] = this.pos.add(this.dir.multiply(this.length/2)).add(this.dir.normal().multiply(this.width/2));
    }
}

class Body {
    constructor (x, y) {
        this.comp = [];
        this.pos = new Vector (x, y);
        this.m = 0; 
        this.inv_m = 0;
        this.inertia = 0;
        this.inv_inertia = 0;
        this.elasticity = 1;
        this.velocity = new Vector(0, 0);
        this.acc = new Vector(0,0);
        this.acceleration = 1;
        this.angVel = 0;
        this.player = false;
        BODIES.push(this);
    }
    draw() {};
    display() {};
    reposition() {};
    keyControl() {}; 
}

class Ball extends Body {
    constructor(x, y, r, m) {
        super();
        this.component = [new Circle(x, y,r)]
        this.m = m;
        if (this.m === 0) {
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
    }

    draw() {
        this.component[0].draw();
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
        this.component[0].pos = this.component[0].pos.add(this.velocity);
    }
}

class Capsule extends Body {
    constructor(x1, y1, x2, y2, r, m) {
        super();
        this.component = [new Circle (x1, y1, r), new Circle (x2, y2, r)]
        let rec1 = this.component[1].pos.add(this.component[1].pos.subtract(this.component[0].pos).unit().normal().multiply(r));
        let rec2 = this.component[0].pos.add(this.component[1].pos.subtract(this.component[0].pos).unit().normal().multiply(r));
        this.component.unshift(new Rectangle(rec1.x, rec1.y, rec2.x, rec2.y, 2*r));
        this.m = m;
        this.inertia = this.m * ((2*this.component[0].width)**2 +(this.component[0].length + 2*this.component[0].width)**2) / 12;
        if (this.m === 0) {
            this.inv_m = 0;
            this.inv_inertia = 0
        } else {
            this.inv_m = 1 / this.m;
            this.inv_inertia = 1 / this.inertia;
        }
    }

    draw(){
        this.component[0].draw();
        this.component[1].draw();
        this.component[2].draw();
    };

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.component[0].dir.multiply(-this.acceleration);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.component[0].dir.multiply(this.acceleration);
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
        this.component[0].pos = this.component[0].pos.add(this.velocity);
        this.angVel *= 1;
        this.component[0].angle += this.angVel;
        this.component[0].getVertices();
        this.component[1].pos = this.component[0].pos.add(this.component[0].dir.multiply(-this.component[0].length/2));
        this.component[2].pos = this.component[0].pos.add(this.component[0].dir.multiply(this.component[0].length/2));
    };
}

class Box extends Body {
    constructor(x1, y1, x2, y2, w, m) {
        super();
        this.component = [new Rectangle (x1, y1, x2, y2, w)]
        this.m = m;
        //TODO is inertia formula wrong?
        this.inertia = this.m * (this.component[0].width**2 +this.component[0].length**2) / 12;
        if (this.m === 0) {
            this.inv_m = 0;
            this.inv_inertia = 0
        } else {
            this.inv_m = 1 / this.m;
            this.inv_inertia = 1 / this.inertia;
        }
    }

    draw(){
        this.component[0].draw();
    };

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.component[0].dir.multiply(-this.acceleration);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.component[0].dir.multiply(this.acceleration);
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
        this.component[0].pos = this.component[0].pos.add(this.velocity);
        this.angVel *= 0.1;
        this.component[0].angle += this.angVel;
        this.component[0].getVertices();
    };
}

class Wall extends Body {
    constructor(x1, y1, x2, y2) {
        super();
        this.component = [new Line(x1, y1, x2, y2)];
    }
    draw() {
        this.component[0].draw();
    }
}

//TODO haveent reviewed code below this

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
    //TODO should this be c2?
    let relVel = closVel1.subtract(closVel2);
    let sepVel = Vector.dot(relVel, normal);
    let new_sepVel = -sepVel * Math.min(c1.elasticity, c2.elasticity);
    let vsep_diff = new_sepVel - sepVel;
    let impulse = vsep_diff / (c1.inv_m + c2.inv_m + impAug1 + impAug2);    
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
        closestPoints = [closestPointOnLS(c2.start, c1), c2.start]
    }
    if (closestPointOnLS(c2.end, c1).subtract(c2.end).magnitude() < shortestDist){
        shortestDist = closestPointOnLS(c2.end, c1).subtract(c2.end).magnitude();
        closestPoints = [closestPointOnLS(c2.end, c1), c2.end]
    }
    stroke("red");
    line(closestPoints[0].x, closestPoints[0].y, closestPoints[1].x, closestPoints[1].y);
    ellipse(closestPoints[0].x, closestPoints[0].y, c1.r*2, c1.r*2);
    ellipse(closestPoints[1].x, closestPoints[1].y, c2.r*2, c2.r*2);
    return closestPoints;
}

function findAxes(o1, o2){
    let axes = [];
    if (o1 instanceof Circle && o2 instanceof Circle) {
        axes.push(o2.pos.subtract(o1.pos).unit());
        return axes;
    }
    if (o1 instanceof Circle) {
        axes.push(closestVertexToPoint(o2, o1.pos).subtract(o1.pos).unit());
        axes.push(o2.dir.normal());
        if (o2  instanceof Rectangle) {
            axes.push(o2.dir);
        }
        return axes;
    }
    if (o2 instanceof Circle) {
        axes.push(o1.dir.normal());
        if (o1  instanceof Rectangle) {
            axes.push(o1.dir);
        }
        axes.push(closestVertexToPoint(o1, o2.pos).subtract(o2.pos).unit());
        return axes;
    }
    axes.push(o1.dir.normal());
    if (o1 instanceof Rectangle) {
        axes.push(o1.dir);
    }
    axes.push(o2.dir.normal());
    if (o2 instanceof Rectangle){
        axes.push(o2.dir);
    }
    return axes;
};

function closestVertexToPoint (obj, p){
    let closestVertex;
    let minDist = null;
    for (let i=0; i<obj.vertex.length; i++){
        if (p.subtract(obj.vertex[i]).magnitude < minDist || minDist === null) {
            closestVertex = obj.vertex[i];
            minDist = p.subtract(obj.vertex[i]).magnitude();
        }
    }
    return closestVertex;
};

function getShapeAxes(obj){
    if (obj instanceof Circle || obj instanceof Line) {
        return 1;
    } 
    if (obj instanceof Rectangle) {
        return 2;
    }

};

function setBallVerticesAlongAxis(obj, axis) {
    if (obj instanceof Circle) {
        obj.vertex[0] = obj.pos.add(axis.unit().multiply(-obj.r));
        obj.vertex[1] = obj.pos.add(axis.unit().multiply(obj.r));
    }
}

function sat(o1, o2) {
    let minOverlap = null;
    let smallestAxis;
    let vertexObj;
    let axes = findAxes(o1, o2);
    let firstShapeAxes = getShapeAxes(o1);


    let proj1, proj2 = 0;

    for (let i=0; i<axes.length; i++) {
        proj1 = projShapeOntoAxis(axes[i], o1);
        proj2 = projShapeOntoAxis(axes[i], o2);
        let overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
        if (overlap < 0) {
            return false;
        };

        if ((proj1.max > proj2.max && proj1.min < proj2.min) || (proj1.max < proj2.max && proj1.min > proj2.min)) {
            let mins = Math.abs(proj1.min - proj2.min);
            let maxs = Math.abs(proj1.max - proj2.max);
            if (mins <  maxs) {
                overlap += mins;
            } else {
                overlap += maxs;
                axes[i] = axes[i].multiply(-1);
            }
        }
        if (overlap < minOverlap || minOverlap === null) {
            minOverlap = overlap;
            smallestAxis = axes[i];
            
            if (i<firstShapeAxes){
                vertexObj = o2;
                if (proj1.max > proj2.max) {
                    smallestAxis = axes[i].multiply(-1);
                }
            } else {
                vertexObj = o1;
                if (proj1.max < proj2.max) {
                    smallestAxis = axes[i].multiply(-1);
                }
            }

        }
    }

    let contactVertex = projShapeOntoAxis(smallestAxis, vertexObj).colVertex;
    smallestAxis.drawVector(contactVertex.x, contactVertex.y, minOverlap, "blue");

    if (vertexObj === o2) {
        smallestAxis = smallestAxis.multiply(-1);
    }


    return {
        pen: minOverlap,
        axis: smallestAxis,
        vertex: contactVertex

    };
};

function projShapeOntoAxis(axis, obj){
    setBallVerticesAlongAxis(obj, axis);
    let min = Vector.dot(axis, obj.vertex[0]);
    let max = min;
    let colVertex = obj. vertex[0];
    for (let i=0; i<obj.vertex.length; i++){
        let p = Vector.dot(axis, obj.vertex[i]);
        if (p<min) {
            min = p;
            colVertex = obj.vertex[i]
        }
        if (p>max) {
            max = p;
        }
    }
    return {
        min: min,
        max: max,
        colVertex: colVertex
    }
};

class CollData {
    constructor(o1, o2, normal, pen, cp) {
        this.o1 = o1;
        this.o2 = o2;
        this.normal = normal;
        this.pen = pen;
        this.cp = cp;
    }

    penRes(){
        let penResolution = this.normal.multiply(this.pen / (this.o1.inv_m + this.o2.inv_m));
        this.o1.component[0].pos = this.o1.component[0].pos.add(penResolution.multiply(this.o1.inv_m));
        this.o2.component[0].pos = this.o2.component[0].pos.add(penResolution.multiply(-this.o2.inv_m));
    };

    collRes() {
        // closing velocity
        let collArm1 = this.cp.subtract(this.o1.component[0].pos);
        let rotVel1 = new Vector(-this.o1.angVel * collArm1.y, this.o1.angVel * collArm1.x);
        let closVel1 = this.o1.velocity.add(rotVel1);
        let collArm2 = this.cp.subtract(this.o2.component[0].pos);
        let rotVel2 = new Vector(-this.o2.angVel * collArm2.y, this.o2.angVel * collArm2.x);
        let closVel2 = this.o2.velocity.add(rotVel2);

        // impulse augmentation
        let impAug1 = Vector.cross(collArm1, this.normal);
        impAug1 = impAug1 * this.o1.inv_inertia * impAug1;
        let impAug2 = Vector.cross(collArm2, this.normal);
        impAug2 = impAug2 * this.o2.inv_inertia * impAug2;
        
        let relVel = closVel1.subtract(closVel2);
        let sepVel = Vector.dot(relVel, this.normal);
        let new_sepVel = -sepVel * Math.min(this.o1.elasticity, this.o2.elasticity);
        let vsep_diff = new_sepVel - sepVel;
        let impulse = vsep_diff / (this.o1.inv_m + this.o2.inv_m + impAug1 + impAug2);    
        let impulseVec = this.normal.multiply(impulse);

        // changing Velocities
        this.o1.velocity = this.o1.velocity.add(impulseVec.multiply(this.o1.inv_m));
        this.o2.velocity = this.o2.velocity.add(impulseVec.multiply(-this.o2.inv_m));
        this.o1.angVel += this.o1.inv_inertia * Vector.cross(collArm1, impulseVec)
        this.o2.angVel -= this.o2.inv_inertia * Vector.cross(collArm2, impulseVec)
    };
}

function draw() {
    background("beige");
    COLLISIONS.length = 0;


    BODIES.forEach((b) => {
        b.draw();
        b.display();
        if (b.player) {
            b.keyControl();
        }
        b.reposition();
    })

    BODIES.forEach((b, index) => {
        for (let bodyPair = index+1; bodyPair < BODIES.length; bodyPair++) {
            let bestSat = {
                pen: null,
                axis: null,
                vertex: null
            }
            for (let o1comp = 0; o1comp < BODIES[index].component.length; o1comp++) {
                for (let o2comp=0; o2comp < BODIES[bodyPair].component.length; o2comp++) {
                    if (sat(BODIES[index].component[o1comp], BODIES[bodyPair].component[o2comp]).pen > bestSat.pen) {
                        bestSat = sat(BODIES[index].component[o1comp], BODIES[bodyPair].component[o2comp]);
                        text("collision", 30, 30)
                    }
                }
            }
            if (bestSat.pen !== null) {
                COLLISIONS.push(new CollData(BODIES[index], BODIES[bodyPair], bestSat.axis, bestSat.pen, bestSat.vertex));
            }
        }
    })

    COLLISIONS.forEach((c) => {
        c.penRes();
        c.collRes()
    });
}


let width = 640;
let height = 400;
let edge1 = new Wall (0, 0, width, 0);
let edge2 = new Wall (0, 0, 0, height);
let edge3 = new Wall (0, height, width, height );
let edge4 = new Wall (width, 0, width, height);

let wall1 = new Wall(300, 400, 300, 200);

for (let addBody = 0; addBody < 10; addBody++) {
    let x0 = randInt(100, width-100);
    let y0 = randInt(100, height-100);
    let x1 = x0 + randInt(-50, 50);
    let y1 = y0 + randInt(-50, 50);
    let r = randInt(10, 30);
    let m = randInt(0, 10);
    if (addBody%3 === 0) {
        let capsObj = new Capsule (x0, y0, x1, y1, r, m);
    }
    if (addBody%3 === 1) {
        let boxObj = new Box (x0, y0, x1, y1, r, m);
    }
    if (addBody%3 === 2) {
        let ballObj = new Ball(x0, y0, r, m);
    }
}

let playerBall = new Ball (320, 240, 5,5);
playerBall.player = true
