let randomObj = [];


for (let addBody = 0; addBody < 10; addBody++) {
    let x0 = randInt(100, width-100);
    let y0 = randInt(100, height-100);
    let x1 = x0 + randInt(-50, 50);
    let y1 = y0 + randInt(-50, 50);
    let r = randInt(10, 30);
    let m = randInt(0, 10);
    
    if (addBody%4 === 0) {
        let capsObj = new Capsule (x0, y0, x1, y1, r, m);
        capsObj.setPosition(100, 100);
        capsObj.color = "lightgreen"
        // capsObj.layer = 1;
        randomObj.push(capsObj);
    }
    if (addBody%4 === 1) {
        let boxObj = new Box (x0, y0, x1, y1, r, m);
        boxObj.setPosition(200, 200);
        boxObj.color = "blue"
        // boxObj.layer = 2;
        randomObj.push(boxObj);

    }
    if (addBody%4 === 2) {
        let ballObj = new Ball(x0, y0, r, m);
        ballObj.setPosition(300, 300);
        ballObj.color = "red"
        // ballObj.layer = 3;
        randomObj.push(ballObj);

    }
    if (addBody%4 === 3) {
        let starObj = new Star(x0, y0, r+20, m);
        starObj.setPosition(400, 300);
        starObj.color = "orange"
        // starObj.layer = 4;
        randomObj.push(starObj);
    }
}
function addBody(body) {
    let x0 = randInt(100, width-100);
    let y0 = randInt(100, height-100);
    let x1 = x0 + randInt(-50, 50);
    let y1 = y0 + randInt(-50, 50);
    let r = randInt(10, 30);
    let m = randInt(0, 10);
    if (body =="box") {
        console.log("this function is being called")
        let boxObj = new Box (x0, y0, x1, y1, r, m);
        boxObj.setPosition(200, 200);
        boxObj.color = "blue"
        // boxObj.layer = 2;
        randomObj.push(boxObj);
    }
    if (body == "capsule") {
        console.log("tcapsule should be made")

        let capsObj = new Capsule (x0, y0, x1, y1, r, m);
        capsObj.setPosition(100, 100);
        capsObj.color = "lightgreen"
        // capsObj.layer = 1;
        randomObj.push(capsObj);
    }
    if (body == "ball") {
        let ballObj = new Ball(x0, y0, r, m);
        ballObj.setPosition(300, 300);
        ballObj.color = "red"
        // ballObj.layer = 3;
        randomObj.push(ballObj);

    }
    if (body == "star") {
        let starObj = new Star(x0, y0, r+20, m);
        starObj.setPosition(400, 300);
        starObj.color = "orange"
        // starObj.layer = 4;
        randomObj.push(starObj);
    }
}


for (let i in randomObj) {
    if (randomObj[i].m !== 0) {
        randomObj[i].velocity.set(Math.random()*4-2, Math.random()*4-2)
    }
}

let playerBall = new Ball (320, 240, 10,3);
playerBall.player = true
playerBall.color = "black"
playerBall.maxSpeed = 3;

function gameLogic() {
    // for (let i in randomObj){
    //     if (collide(randomObj[i], playerBall)) {
    //         // playerBall.remove();
    //         randomObj[i].remove();
    //         randomObj.splice(i,1);
    //     }
    // }
}