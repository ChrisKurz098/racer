
let keysPressed = [];
let carDistance = 0;
let speed = 0;
let currentCurve = 0;
let trackCurve = 0;
let playerCurve = 0;
let lap = 1;
let carX = 0;
let carY = 0;
let carD = 0; //direction -1 0 1
const img = new Image();
img.src = './img/up.png';

let ctx = 0;
let w = 0;
let h = 0;
let mid = 50
let imageData = 0;
let seconds = 0;
let dk = 0; //day\night effect
var startTime = Date.now();
var frame = 0;
// set track sections [curvatrue, dist]
const trackArray = [
    [0, 5000],
    [0, 20000],
    [1, 20000],
    [0, 20000],
    [-1, 20000],
    [0.5, 20000],
    [1.5, 10000],
    [0, 60000],
];
//get total length of track
let trackLength = 0;
for (let i = 0; i < trackArray.length; i++) {
    trackLength += trackArray[i][1];
}

function run() {
    const canvas = document.getElementById('game-window');
    if (canvas.getContext) {
        ctx = canvas.getContext('2d', { alpha: false });
        w = canvas.width;
        h = canvas.height;
        mid = h / 2;
        imageData = ctx.createImageData(w, h)
        window.requestAnimationFrame(loop)
    }
}

function loop() {
    setInterval(() => {

        var time = Date.now();
        frame++;
        //frame rate counter and timer
        if (time - startTime > 1000) {
            console.clear();
            seconds++;

            console.log('FPS:', (frame / ((time - startTime) / 1000)).toFixed(1));
            startTime = time;
            frame = 0;
        }
        //--------------------------//
        //   Pre-draw calculations  //
        //--------------------------//
        if (keysPressed.includes('w')) {
            speed += 0.25;
        } else {
            speed -= 0.17;
        }
        if (keysPressed.includes('s')) {
            speed -= 1;
        }
        carD = 0;
        if (keysPressed.includes('a') && speed > 0) {
            carD = -1;
            playerCurve -= (.015);
        }
        if (keysPressed.includes('d') && speed > 0) {
            carD = 1;
            playerCurve += (.015);
        }

        switch(carD) {
            case 0:
            img.src = './img/up.png';
            break;
            case 1:
            img.src = './img/right.png';
            break;
           case -1:
            img.src = './img/left.png';
            break;
        }
        //----------------------------------------------//
        //if you are outside the track, force slow down //
        //----------------------------------------------//
        if (Math.abs(playerCurve - trackCurve) >= 0.55) speed -= .1 * speed;

        //set speed limits
        if (speed < 0) speed = 0;
        if (speed > 140) speed = 140;
        //keep track of how far car has traveled
        carDistance += speed;
        //-----------------------------------------//
        //keep track of where we are on the track
        //----------------------------------------//
        let offSet = 0;
        let trackSection = 0;
        //find the current track section based off the car distance
        //will result in trackSection-1 being the desired index
        while (trackSection < trackArray.length && offSet <= carDistance) {
            offSet += trackArray[trackSection][1];
            trackSection++;
        }
        if (trackSection === trackArray.length && carDistance > offSet) {
            carDistance = 0;
            lap++;
        }
        //find the target track curve after finding trackSection index
        const targetCurve = trackArray[trackSection - 1][0];
        const curveDiff = (targetCurve - currentCurve) * (speed / 14000);
        currentCurve += curveDiff;

        //change this float to adjust how hard the car is pushed in the opposite direction of the curve
        trackCurve += currentCurve * (.00022 * (speed));

        //car positions
        const carPosH = playerCurve - trackCurve;
        carW = 36;
        carM = carW / 2
        carX = (w / 2) + ((w * carPosH) / 2) - carM + 1;
        carY = h - 20;


        //--------------------------//
        //      Begin Draw          //
        //--------------------------//
        for (y = mid; y < h; y++) {

            // make track calculations
            dk = (seconds < 160) ? seconds : 160;//to darken color over time
            const gY = y * 2;//to create a gradient color
            const perspective = (y - mid) / (mid);

            const midPoint = 0.5 + currentCurve * Math.pow(1 - perspective, 3);
            let roadWidth = 0.1 + perspective * 0.8;
            const clipWidth = roadWidth * 0.15;

            //create a color variable
            let color = [255, 0, 0];
            const startLine = Math.pow(1 - perspective, 2) + ((trackLength - carDistance) * .02);
            //get half of road width. makes calculations easier for symetrical track
            roadWidth *= 0.5;
            const leftGrass = (midPoint - roadWidth - clipWidth) * w;
            const leftClip = (midPoint - roadWidth) * w;
            const rightGrass = (midPoint + roadWidth + clipWidth) * w;
            const rightClip = (midPoint + roadWidth) * w;

            for (let x = 0; x < w; x++) {
                //--------------------------//
                ///Draw  Top (hills and sky)//
                //--------------------------//
                const hillHeight = Math.floor(Math.abs(Math.sin(x * 0.01 + trackCurve) * 16.0));
                const pixelindexTop = (((y - (mid)) * w + x) * 4);//Find RGBA pixel index for imageData
                let colorB = (y > (h) - hillHeight) ? [55 - y * perspective - (dk / 5), 155 - y * perspective - (dk / 5), 55 - y * perspective - (dk / 10)] : [100 + (y * 2) - dk, 100 - dk, 255 - dk];
                //hill border color
                if (y === (h) - hillHeight) colorB =
                    [ 245 - dk / 1.6,  130 - dk , 230 - dk/1.3 ];
                    //[-80 + gY*2 * perspective + dk / 4,  -50 + gY * perspective - dk / 6, -80 + gY*2 * perspective + dk / 4];
                //-------Set Pixel Data-------//
                imageData.data[pixelindexTop] = colorB[0];     // Red
                imageData.data[pixelindexTop + 1] = colorB[1]; // Green
                imageData.data[pixelindexTop + 2] = colorB[2];  // Blue
                imageData.data[pixelindexTop + 3] = 255;   // Alpha


                //--------------------------//
                //       Draw Bottom        //
                //--------------------------//
                const pixelindex = (y * w + x) * 4; //find RGBA pixel index for imageData

                //create head lights
                let circleBound = Math.sqrt(Math.pow(x - (carX + (carD * 11) + carM - 1), 2) + Math.pow(y - carY, 2));
                if (y > carY - 6 + (Math.abs(carD) * 4)) circleBound = circleBound * perspective + 15.5 - (Math.abs(carD * 3));

                const l = (dk > 60 && y < carY + 3 && 31 - (Math.abs(carD)) > circleBound) ? dk : 0;

                // Grass color
                const grassColor = (Math.sin(20 * Math.pow(1 - perspective, 3) + carDistance * .008) > 0) ?
                    [0, 10 + gY - dk + l, 0] : [0, 50 + gY - dk + l, 0];

                // clip color
                const clipColor = (Math.sin(40 * Math.pow(1 - perspective, 2) + carDistance * .02) > 0) ?
                    [100 + gY - dk + l, 0, 0] : [100 + gY - dk + l, 100 + gY - dk + l, 100 + gY - dk + l];

                //----Road Color----//
                if (x >= leftClip && x < rightClip) color = (y < 100 - startLine + (20 * perspective) && y > 100 - startLine)
                    ? [255, 255, 255] : [(gY - dk + l), (gY - dk + l), (gY - dk + l)];

                //----Determine if pixel is not road----//
                //----Set color based on this data-----//
                if (x >= 0 && x < leftGrass) color = grassColor;
                if (x >= leftGrass && x < leftClip) color = clipColor;
                if (x >= rightClip && x < rightGrass) color = clipColor;
                if (x >= rightGrass && x < w) color = grassColor;

                //--------Set Pixel Data---------//
                imageData.data[pixelindex] = color[0]      // Red
                imageData.data[pixelindex + 1] = color[1]  // Green
                imageData.data[pixelindex + 2] = color[2]   // Blue
                imageData.data[pixelindex + 3] = 255;   // Alpha

            }
        }
        //--------------------------//
        //   Render Entire Image    //
        //--------------------------//
        ctx.putImageData(imageData, 0, 0);
        //
        //--------------------------//
        //        Draw Car          //
        //--------------------------//
        carX = Math.round(carX);
        carY = Math.round(carY);
        ctx.drawImage(img, carX, carY - 12)
        //end loop
        //loop();
        //window.requestAnimationFrame(loop);

    }, 16.667)

}

/////////////Key inputs///////////////////
const logKeyDown = (e) => {
    if (!keysPressed.includes(e.key)) keysPressed = [...keysPressed, e.key.toLowerCase()];
    //console.log(keysPressed)
};

const logKeyUp = (e) => {
    const newKeys = keysPressed.filter((key) => key !== e.key.toLowerCase());
    if (newKeys !== keysPressed) keysPressed = newKeys;
    //console.log(keysPressed)
};

document.addEventListener("keyup", logKeyUp);
document.addEventListener("keydown", logKeyDown);

run();