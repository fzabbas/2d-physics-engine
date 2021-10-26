const BODIES = [];
const COLLISIONS = [];

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
        return v1.x*v2.x + v1.y*v2.y;
    }

    static cross (v1, v2) {
        return v1.x*v2.y - v1.y*v2.x;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
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

    rotMx22(angle) {
        this.data[0][0] = Math.cos(angle);
        this.data[0][1] = -Math.sin(angle);
        this.data[1][0] = Math.sin(angle);
        this.data[1][1] = Math.cos(angle);
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

    draw(color) {
        // stroke("black");
        if (color === ""){
            stroke("black");
            noFill()
        } else {
            fill(color)
        }
        line(this.vertex[0].x, this.vertex[0].y, this.vertex[1].x, this.vertex[1].y);
    }
}
class Circle {
    constructor(x, y, r) {
        this.vertex = [];
        this.pos = new Vector(x,y);
        this.r = r;
    }

    draw(color){
        if (color === ""){
            stroke("black");
            noFill();
        } else {
            noStroke();
            fill(color);
        }
        ellipse(this.pos.x, this.pos.y, 2*this.r, 2*this.r);
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

    draw(color) {
        if (color === ""){
            stroke("black");
            noFill();
        } else {
            noStroke();
            fill(color);
        }
        beginShape();
        vertex(this.vertex[0].x, this.vertex[0].y);
        vertex(this.vertex[1].x, this.vertex[1].y);
        vertex(this.vertex[2].x, this.vertex[2].y);
        vertex(this.vertex[3].x, this.vertex[3].y);
        vertex(this.vertex[0].x, this.vertex[0].y);
        endShape()
    }

    getVertices(angle) {
        this.rotMat.rotMx22(angle);
        this.dir = this.rotMat.multiplyVec(this.refDir)
        this.vertex[0] = this.pos.add(this.dir.multiply(-this.length/2)).add(this.dir.normal().multiply(this.width/2));
        this.vertex[1] = this.pos.add(this.dir.multiply(-this.length/2)).add(this.dir.normal().multiply(-this.width/2));
        this.vertex[2] = this.pos.add(this.dir.multiply(this.length/2)).add(this.dir.normal().multiply(-this.width/2));
        this.vertex[3] = this.pos.add(this.dir.multiply(this.length/2)).add(this.dir.normal().multiply(this.width/2));
    }
}

class Triangle {
    constructor(x1, y1, x2, y2, x3, y3) {
        this.vertex = [];
        this.vertex[0] = new Vector (x1, y1);
        this.vertex[1] = new Vector (x2, y2);
        this.vertex[2] = new Vector (x3, y3);
        this.pos = new Vector((this.vertex[0].x + this.vertex[1].x + this.vertex[2].x)/3, (this.vertex[0].y + this.vertex[1].y + this.vertex[2].y)/3);
        this.dir = this.vertex[0].subtract(this.pos).unit();
        //is the refDir good?
        // this.refDir = this.dir;
        this.refDir = this.vertex[0].subtract(this.pos).unit();
        this.refDiam = [];
        this.refDiam[0] = this.vertex[0].subtract(this.pos);
        this.refDiam[1] = this.vertex[1].subtract(this.pos);
        this.refDiam[2] = this.vertex[2].subtract(this.pos);
        this.angle = 0;
        this.rotMat = new Matrix(2, 2);
    }

    draw(color) {
        if (color === ""){
            stroke("black");
            noFill();
        } else {
            noStroke();
            fill(color);
        }
        beginShape();
        vertex(this.vertex[0].x, this.vertex[0].y);
        vertex(this.vertex[1].x, this.vertex[1].y);
        vertex(this.vertex[2].x, this.vertex[2].y);
        vertex(this.vertex[0].x, this.vertex[0].y);
        endShape()
    }

    getVertices(angle) {
        this.rotMat.rotMx22(angle);
        this.dir = this.rotMat.multiplyVec(this.refDir);
        this.vertex[0] = this.pos.add(this.rotMat.multiplyVec(this.refDiam[0]));
        this.vertex[1] = this.pos.add(this.rotMat.multiplyVec(this.refDiam[1]));
        this.vertex[2] = this.pos.add(this.rotMat.multiplyVec(this.refDiam[2]));
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
        this.friction = 0;
        this.angFriction = 0;
        this.maxSpeed = 0;
        this.color = "";
        this.layer = 0;
        this.velocity = new Vector(0, 0);
        this.acc = new Vector(0,0);
        this.keyForce = 1;
        this.angKeyForce = 0.1;
        this.angVel = 0;
        this.angle = 0;
        this.player = false;
        BODIES.push(this);
    }
    render() {
        for (let i in this.component) {
            this.component[i].draw(this.color);
        }
    };
    reposition() {
        this.acc = this.acc.unit().multiply(this.keyForce);
        this.velocity = this.velocity.add(this.acc);
        this.velocity = this.velocity.multiply(1-this.friction);
        if (this.velocity.magnitude() > this.maxSpeed && this.maxSpeed !== 0){
            this.velocity = this.velocity.unit().multiply(this.maxSpeed);
        }
        this.angVel *= (1 - this.angFriction);
    };
    keyControl() {}; 
    remove() {
        if (BODIES.indexOf(this) !== -1) {
            BODIES.splice(BODIES.indexOf(this),1);
        }
    }
}

class Ball extends Body {
    constructor(x, y, r, m) {
        super();
        this.pos = new Vector(x, y);
        this.component = [new Circle(x, y,r)]
        this.m = m;
        if (this.m === 0) {
            this.inv_m = 0;
        } else {
            this.inv_m = 1 / this.m;
        }
    }

    keyControl(){
        if (keyIsDown(LEFT_ARROW)){
            this.acc.x = -this.keyForce;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.acc.x = this.keyForce;
        }
        if (keyIsDown(UP_ARROW)){
            this.acc.y = -this.keyForce;
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc.y = this.keyForce;
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc.y = 0;
        }
        if (!(keyIsDown(LEFT_ARROW)) && (!(keyIsDown(RIGHT_ARROW)))){
            this.acc.x = 0;
        }
    }

    setPosition(x, y, a=this.angle) {
        this.pos.set(x, y);
        this.component[0].pos = this.pos;
    };

    reposition() {
        super.reposition();
        this.setPosition(this.pos.add(this.velocity).x,this.pos.add(this.velocity).y);
    }
}

class Capsule extends Body {
    constructor(x1, y1, x2, y2, r, m) {
        super();
        this.component = [new Circle (x1, y1, r), new Circle (x2, y2, r)]
        let rec1 = this.component[1].pos.add(this.component[1].pos.subtract(this.component[0].pos).unit().normal().multiply(r));
        let rec2 = this.component[0].pos.add(this.component[1].pos.subtract(this.component[0].pos).unit().normal().multiply(r));
        this.component.unshift(new Rectangle(rec1.x, rec1.y, rec2.x, rec2.y, 2*r));
        this.pos = this.component[0].pos;
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

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.component[0].dir.multiply(-this.keyForce);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.component[0].dir.multiply(this.keyForce);
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc.set(0, 0);
        }
        if (keyIsDown(LEFT_ARROW)){
            this.angVel = -this.angKeyForce;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.angVel = this.angKeyForce;
        }
        
    };

    setPosition(x, y, a=this.angle) {
        this.pos.set(x, y);
        this.angle = a;
        this.component[0].pos = this.pos;
        this.component[0].getVertices(this.angle + this.angVel);
        this.component[1].pos = this.component[0].pos.add(this.component[0].dir.multiply(-this.component[0].length/2));
        this.component[2].pos = this.component[0].pos.add(this.component[0].dir.multiply(this.component[0].length/2));
        this.angle += this.angVel;

    };

    reposition(){
        super.reposition();
        this.setPosition(this.pos.add(this.velocity).x,this.pos.add(this.velocity).y);
    };
}

class Star extends Body {
    constructor(x1, y1, r, m) {
        super();
        this.component = []
        this.r = r;
        this.center = new Vector (x1, y1);
        let upDir = new Vector(0, -1);
        let p1 = this.center.add(upDir.multiply(r));
        let p2 = this.center.add(upDir.multiply(-r/2)).add(upDir.normal().multiply(-r*Math.sqrt(3)/2));
        let p3 = this.center.add(upDir.multiply(-r/2)).add(upDir.normal().multiply(r*Math.sqrt(3)/2));
        this.component.push(new Triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y));
        p1 = this.center.add(upDir.multiply(-r));
        p2 = this.center.add(upDir.multiply(r/2)).add(upDir.normal().multiply(-r*Math.sqrt(3)/2));
        p3 = this.center.add(upDir.multiply(r/2)).add(upDir.normal().multiply(r*Math.sqrt(3)/2));
        this.component.push(new Triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y));
        this.pos = this.component[0].pos;
        this.m = m;
        this.inertia = this.m * ((2*this.r)**2) / 12;
        if (this.m === 0) {
            this.inv_m = 0;
            this.inv_inertia = 0
        } else {
            this.inv_m = 1 / this.m;
            this.inv_inertia = 1 / this.inertia;
        }
    }

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.component[0].dir.multiply(-this.keyForce);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.component[0].dir.multiply(this.keyForce);
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc.set(0, 0);
        }
        if (keyIsDown(LEFT_ARROW)){
            this.angVel = -this.angKeyForce;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.angVel = this.angKeyForce;
        }
    };

    setPosition(x, y, a=this.angle) {
        this.pos.set(x, y);
        this.angle = a
        this.component[0].pos = this.pos;
        this.component[1].pos = this.pos;
        this.component[0].getVertices(this.angle + this.angVel);
        this.component[1].getVertices(this.angle + this.angVel);
        this.angle += this.angVel;

    };

    reposition(){
        super.reposition();
        this.setPosition(this.pos.add(this.velocity).x,this.pos.add(this.velocity).y);
    };
}

class Box extends Body {
    constructor(x1, y1, x2, y2, w, m) {
        super();
        this.component = [new Rectangle (x1, y1, x2, y2, w)]
        this.pos = this.component[0].pos;
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

    keyControl(){
        if (keyIsDown(UP_ARROW)){
            this.acc = this.component[0].dir.multiply(-this.keyForce);
        }
        if (keyIsDown(DOWN_ARROW)) {
            this.acc = this.component[0].dir.multiply(this.keyForce);
        }
        if (!(keyIsDown(UP_ARROW)) && (!(keyIsDown(DOWN_ARROW)))){
            this.acc.set(0, 0);
        }
        if (keyIsDown(LEFT_ARROW)){
            this.angVel = -this.angKeyForce;
        }
        if (keyIsDown(RIGHT_ARROW)){
            this.angVel = this.angKeyForce;
        }
    };

    setPosition(x, y, a=this.angle){
        this.pos.set(x, y);
        this.component[0].pos = this.pos;
        this.component[0].getVertices(this.angle + this.angVel);
        this.angle += this.angVel;
    }

    reposition(){
        super.reposition();
        this.setPosition(this.pos.add(this.velocity).x,this.pos.add(this.velocity).y);
    };
}

class Wall extends Body {
    constructor(x1, y1, x2, y2) {
        super();
        this.component = [new Line(x1, y1, x2, y2)];
        this.pos = new Vector((x1+x2)/2, (y1+y2)/2);
    }
}

//TODO haveent reviewed code below this

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
        if (o2.pos.subtract(o1.pos).magnitude() > 0) {
            axes.push(o2.pos.subtract(o1.pos).unit());
        } else {
            axes.push(new Vector(Math.random(), Math.random()).unit());

        }
        return axes;
    };
    if (o1 instanceof Circle) {
        axes.push(closestVertexToPoint(o2, o1.pos).subtract(o1.pos).unit());
    };
    if (o1 instanceof Line) {
        axes.push(o1.dir.normal());
    };
    if (o1  instanceof Rectangle) {
        axes.push(o1.dir.normal());
        axes.push(o1.dir);
    };
    if (o1 instanceof Triangle) {
        axes.push(o1.vertex[1].subtract(o1.vertex[0]).normal());
        axes.push(o1.vertex[2].subtract(o1.vertex[1]).normal());
        axes.push(o1.vertex[0].subtract(o1.vertex[2]).normal());
    };
    if (o2 instanceof Circle) {
        axes.push(closestVertexToPoint(o1, o2.pos).subtract(o2.pos).unit());
    };
    if (o2 instanceof Line) {
        axes.push(o2.dir.normal());
    };
    if (o2  instanceof Rectangle) {
        axes.push(o2.dir.normal());
        axes.push(o2.dir);
    };
    if (o2 instanceof Triangle) {
        axes.push(o2.vertex[1].subtract(o2.vertex[0]).normal());
        axes.push(o2.vertex[2].subtract(o2.vertex[1]).normal());
        axes.push(o2.vertex[0].subtract(o2.vertex[2]).normal());
    };
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
    };
    if (obj instanceof Triangle) {
        return 3;
    };
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
        this.o1.pos = this.o1.pos.add(penResolution.multiply(this.o1.inv_m));
        this.o2.pos = this.o2.pos.add(penResolution.multiply(-this.o2.inv_m));
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

function collide (o1, o2) {
    let bestSat = {
        pen: null,
        axis: null,
        vertex: null
    }
    for (let o1comp = 0; o1comp < o1.component.length; o1comp++) {
        for (let o2comp=0; o2comp < o2.component.length; o2comp++) {
            if (sat(o1.component[o1comp], o2.component[o2comp]).pen > bestSat.pen) {
                bestSat = sat(o1.component[o1comp], o2.component[o2comp]);
            }
        }
    }
    if (bestSat.pen !== null) {
        return bestSat;
    } else {
        return false;
    }
};

function userInteraction(){
    BODIES.forEach((b) => {
        if (b.player) {
            b.keyControl();
        }
    })
}

function gameLogic(){};

function physicsLoop() {
    // background("beige");
    COLLISIONS.length = 0;

    BODIES.forEach((b) => {
        b.render();
        b.reposition();
    })

    BODIES.forEach((b, index) => {
        for (let bodyPair = index+1; bodyPair < BODIES.length; bodyPair++) {
            if ((BODIES[index].layer === BODIES[bodyPair].layer || BODIES[index].layer === 0 || BODIES[bodyPair].layer === 0)&& collide(BODIES[index], BODIES[bodyPair])){
                let bestSat = collide(BODIES[index], BODIES[bodyPair]);
                COLLISIONS.push(new CollData(BODIES[index], BODIES[bodyPair], bestSat.axis, bestSat.pen, bestSat.vertex));
            }
        }
    })
    COLLISIONS.forEach((c) => {
        c.penRes();
        c.collRes()
    });
}

function renderLoop(){
    background("beige");

    BODIES.forEach((b) => {
        b.render();
    })
}

function draw(){
    userInteraction();
    gameLogic();
    physicsLoop();
    renderLoop();
}

let width = 640;
let height = 400;
let edge1 = new Wall (0, 0, width, 0);
let edge2 = new Wall (0, 0, 0, height);
let edge3 = new Wall (0, height, width, height );
let edge4 = new Wall (width, 0, width, height);

