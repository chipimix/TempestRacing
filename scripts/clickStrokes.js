const ioHook = require('iohook');
const d3 = require('d3');

// time at which the stats of the recording will be displayed
const timeOfActualization = 1000;

const kmtimestep = 1;
const fatiguetimestep = 10;
const kmslices = 60/kmtimestep;

const slices = 1000/timeOfActualization;
const kmupdate = kmtimestep*slices;
const fatUpdate = fatiguetimestep*slices;

var startTime;
var endTime;
var eventTime;

var lastClickTime;
var lastKeyTime;
var lastMoveTime;

let manyClickInt;
let manyClickDown;
let manyKeyInt;
let manyKeyDown;
let manyMouseInt;

var numKeyStrokes = 0;
var numClicks = 0;
var numMouseMoves = 0;

var actionsPerMinute = 0;
var mouseMovesPerMinute = 0;

let moveIntervals;
let keyIntervals;
let keyDownTimes;
let clickDownTimes;
let clickIntervals;

let allKeyEvents;
let allClickEvents;
let allMoveEvents;

let mouseDownTime;
let clickDown;
let keyDownTime;
let keyDown;

let apm;
let mouseMoves;
let csvName;

ioHook.on('mousedown', event => {
    clickDown = Date.now();
});

ioHook.on('mouseup', event => {
    //only if start button was pressed
    eventTime = Date.now();
    numClicks++;
    numMouseMoves+=0.5;

    mouseDownTime = eventTime - clickDown;

    let cint = eventTime - lastClickTime;
    if (cint < 5000 && mouseDownTime < 2000) {
        manyClickInt.push(cint);
        manyClickDown.push(mouseDownTime);
        allClickEvents.push([eventTime-startTime, mouseDownTime, eventTime - lastClickTime]);
    }

    lastClickTime = eventTime;

    // fs.appendFile(csvName, [eventTime-startTime, "click", event.button, event.x, event.y].toString() + "\n", function (err){
    //     if(err) throw err;
    // });
});

ioHook.on('keydown', event => {
    keyDown = Date.now();

});

ioHook.on('keyup', event => {

    eventTime = Date.now();
    numKeyStrokes++;

    keyDownTime = eventTime - keyDown;

    let kint = eventTime - lastKeyTime;
    if (kint < 5000 && keyDownTime < 2000) {
        manyKeyInt.push(kint);
        manyKeyDown.push(keyDownTime);
        allKeyEvents.push([eventTime-startTime, keyDownTime, eventTime - lastKeyTime]);
    }

    lastKeyTime = eventTime;
    // fs.appendFile(csvName, [eventTime-startTime, "key", event.rawcode, -1, -1].toString() + "\n", function (err){
    //     if(err) throw err;
    // });
});


ioHook.on('mousemove', event => {

    let eventTime = Date.now();
    if (eventTime - lastMoveTime >= 275){
        numMouseMoves+=1.5;

        let mint = eventTime - lastMoveTime;
        if (mint < 5000) {
            manyMouseInt.push(mint);
            allMoveEvents.push([eventTime-startTime, eventTime - lastMoveTime]);
        }

        lastMoveTime = eventTime;
        // fs.appendFile(csvName, [eventTime-startTime, "move", -1, event.x, event.y].toString() + "\n", function (err){
        //     if(err) throw err;
        // })
    }
});

var timeRecording;
function startRecording(){

    numKeyStrokes = 0;
    numClicks = 0;
    numMouseMoves = 0;

    allActions = [];
    allRealMoves = [];

    allKeyIntervals = [];
    allKeyDownTimes = [];
    allClickIntervals = [];
    allClickDownTimes = [];
    allMoveIntervals = [];

    manyClickInt = [];
    manyClickDown = [];
    manyKeyInt = [];
    manyKeyDown = [];
    manyMouseInt = [];

    allKeyEvents = [];
    allClickEvents = [];
    allMoveEvents = [];

    totalActions = 0;
    totalMoves = 0;

    apm = Array(Math.ceil(kmtimestep/2)-1).fill(0);
    mouseMoves = Array(Math.ceil(kmtimestep/2)-1).fill(0);

    moveIntervals = Array(Math.ceil(fatiguetimestep/2)-1).fill(new Array(fatiguetimestep).fill(0));
    keyIntervals = Array(Math.ceil(fatiguetimestep/2)-1).fill(new Array(fatiguetimestep).fill(0));
    keyDownTimes = Array(Math.ceil(fatiguetimestep/2)-1).fill(new Array(fatiguetimestep).fill(0));
    clickDownTimes = Array(Math.ceil(fatiguetimestep/2)-1).fill(new Array(fatiguetimestep).fill(0));
    clickIntervals = Array(Math.ceil(fatiguetimestep/2)-1).fill(new Array(fatiguetimestep).fill(0));

    // Register and start hook
    startTime = Date.now();

    // let date = new Date(startTime - (new Date().getTimezoneOffset() * 60000)).toISOString();
    // date = date.replace(/:/g,"_");
    // csvName = 'readings/'+ date + "_IOdata.csv";
    // fs.appendFileSync(csvName, ["time,event,code,x,y"].toString() + "\n", function (err){
    //     if(err) throw err;
    // });

    ioHook.start();

    clickDown = startTime;
    keyDown = startTime;

    lastEventTime = startTime;
    lastClickTime = startTime;
    lastKeyTime = startTime;
    lastMoveTime = startTime;
    timeRecording = setInterval(showReport, timeOfActualization);
};

let allActions;
let allRealMoves;

let allKeyIntervals;
let allKeyDownTimes;
let allClickDownTimes;
let allClickIntervals;
let allMoveIntervals;

let totalActions;
let totalMoves;
function showReport(){

    allActions.push(numClicks + numKeyStrokes);
    allRealMoves.push(numMouseMoves);

    if (allActions.length === kmupdate) {
        // console.log(allActions)
        totalActions = allActions.reduce((a, b) => a + b, 0);
        actionsPerMinute = totalActions*kmslices;
        apm.push(actionsPerMinute);
        allActions.splice(0, slices);
    }

    if (allRealMoves.length === kmupdate) {
        totalMoves = allRealMoves.reduce((a, b) => a + b, 0);
        mouseMovesPerMinute = totalMoves;
        mouseMoves.push(mouseMovesPerMinute);
        allRealMoves.splice(0, slices);
    }

    numClicks = 0;
    numKeyStrokes = 0;
    numMouseMoves = 0;

    // Intervals and DownTime for Mouse Clicks
    if (manyClickInt.length) {
        allClickIntervals.push((manyClickInt.reduce((a, b) => a + b, 0))/(manyClickInt.length));
        allClickDownTimes.push((manyClickDown.reduce((a, b) => a + b, 0))/(manyClickDown.length));
    } else {
        allClickIntervals.push(0);
        allClickDownTimes.push(0);
    }

    if (allClickIntervals.length === fatUpdate && allClickDownTimes.length === fatUpdate) {
        clickIntervals.push(JSON.parse(JSON.stringify(allClickIntervals)));
        clickDownTimes.push(JSON.parse(JSON.stringify(allClickDownTimes)));
        allClickIntervals.splice(0, slices);
        allClickDownTimes.splice(0, slices);
    }

    // Intervals and DownTime for Keyboard Strokes
    if (manyKeyInt.length) {
        allKeyIntervals.push((manyKeyInt.reduce((a, b) => a + b, 0))/(manyKeyInt.length));
        allKeyDownTimes.push((manyKeyDown.reduce((a, b) => a + b, 0))/(manyKeyDown.length));
    } else {
        allKeyIntervals.push(0);
        allKeyDownTimes.push(0);
    }

    if (allKeyIntervals.length === fatUpdate && allKeyDownTimes.length === fatUpdate) {
        keyIntervals.push(JSON.parse(JSON.stringify(allKeyIntervals)));
        keyDownTimes.push(JSON.parse(JSON.stringify(allKeyDownTimes)));
        allKeyIntervals.splice(0, slices);
        allKeyDownTimes.splice(0, slices);
    }

    // Interval Between Mouse Moves
    if (manyMouseInt.length) {
        allMoveIntervals.push((manyMouseInt.reduce((a, b) => a + b, 0))/(manyMouseInt.length));
    } else {
        allMoveIntervals.push(0);
    }

    if (allMoveIntervals.length === fatUpdate) {
        moveIntervals.push(JSON.parse(JSON.stringify(allMoveIntervals)));
        allMoveIntervals.splice(0, slices);
    }

    manyClickDown = [];
    manyClickInt = [];

    manyKeyInt = [];
    manyKeyDown = [];

    manyMouseInt = [];
};

let recordDuration;
function stopRecording(){
    // Stop rising keyboard & mouse events
    clearInterval(timeRecording);
    ioHook.stop();

    allActions.push(numClicks + numKeyStrokes);
    allRealMoves.push(numMouseMoves);

    totalActions = allActions.reduce((a, b) => a + b, 0);
    actionsPerMinute = totalActions*kmslices;
    apm.push(actionsPerMinute);

    totalMoves = allRealMoves.reduce((a, b) => a + b, 0);
    mouseMovesPerMinute = totalMoves;
    mouseMoves.push(mouseMovesPerMinute);

    mouseMoves = mouseMoves.concat(Array(Math.floor(kmtimestep/2)).fill(0));
    apm = apm.concat(Array(Math.floor(kmtimestep/2)).fill(0));

    // Intervals and DownTime for Mouse Clicks
    if (manyClickInt.length) {
        allClickIntervals.push((manyClickInt.reduce((a, b) => a + b, 0))/(manyClickInt.length));
        allClickDownTimes.push((manyClickDown.reduce((a, b) => a + b, 0))/(manyClickDown.length));
    } else {
        allClickIntervals.push(0);
        allClickDownTimes.push(0);
    }

    clickIntervals.push(allClickIntervals);
    clickDownTimes.push(allClickDownTimes);

    clickIntervals = clickIntervals.concat(Array(Math.floor(fatiguetimestep/2)).fill(new Array(fatiguetimestep).fill(0)));
    clickDownTimes = clickDownTimes.concat(Array(Math.floor(fatiguetimestep/2)).fill(new Array(fatiguetimestep).fill(0)));

    // Intervals and DownTime for Keyboard Strokes
    if (manyKeyInt.length) {
        allKeyIntervals.push((manyKeyInt.reduce((a, b) => a + b, 0))/(manyKeyInt.length));
        allKeyDownTimes.push((manyKeyDown.reduce((a, b) => a + b, 0))/(manyKeyDown.length));
    } else {
        allKeyIntervals.push(0);
        allKeyDownTimes.push(0);
    }

    keyIntervals.push(allKeyIntervals);
    keyDownTimes.push(allKeyDownTimes);

    keyIntervals = keyIntervals.concat(Array(Math.floor(fatiguetimestep/2)).fill(new Array(fatiguetimestep).fill(0)));
    keyDownTimes = keyDownTimes.concat(Array(Math.floor(fatiguetimestep/2)).fill(new Array(fatiguetimestep).fill(0)));

    // Interval Between Mouse Moves
    if (manyMouseInt.length) {
        allMoveIntervals.push((manyMouseInt.reduce((a, b) => a + b, 0))/(manyMouseInt.length));
    } else {
        allMoveIntervals.push(0);
    }

    moveIntervals.push(allMoveIntervals);
    moveIntervals = moveIntervals.concat(Array(Math.floor(fatiguetimestep/2)).fill(new Array(fatiguetimestep).fill(0)));

    endTime = Date.now();
    recordDuration = (endTime - startTime)/1000;
}

// This function allows slicing the arrays with data (in milliseconds, always) and computes mean (m) and variance (v) for that slice from:
// - click times (ARRAY: [eventTime, downTime, Intervals]);
// - keystroke times (ARRAY: [eventTime, downTime, Intervals]);
// - Move times (ARRAY: [eventTime, Intervals]);
//
// INPUT: - array, ARRAY of click times, keystroke times or move times;
//        - sliceSize, INT of size of each slice in SECONDS;
//        - start, INT of where to start slicing in SECONDS, in case not all data is needed (default = 0)
//
// Example: Take array with structure wow = [[200, 2, 3], [300, 1, 2], [1200, 4, 5], [2500, 4, 5], [2700, 5, 5]]
//
//          sliceIt(wow, 1) -> Array(3) = [[[2, 3], [1, 2]], [[4, 5]], [[4, 5], [4, 5]]] ->
//                          -> [[m11, v11, m12, v12], [m21, v21, m22, v22], [m31, v31, m32, v32]]
//
//          sliceIt(wow, 1, 1) -> Array(2) = [[[4, 5]], [[4, 5], [4, 5]]] ->
//                          -> [[m21, v21, m22, v22], [m31, v31, m32, v32]]
//
function sliceIt (array, sliceSize, start=0) {

    // Since sliceSize is seconds, we convert it to milliseconds
    let realSlice = sliceSize*1000;
    // The number of slices that can fit in the recording while taking into account the offset (start)
    // Each slice will have data corresponding to "sliceSize" seconds of recording
    let slices = Math.ceil((recordDuration-start)/sliceSize);
    // if Clicks or Keystrokes, width=3, if Moves, width=2
    let width = array[0].length;
    // How many slices must be cut considering the offset
    let shift = Math.floor(start/sliceSize);

    // Array where we will store the slices
    let auxanswer = new Array(slices);
    // Array for arrays with statistical data for each slice
    let finalAnswer = [];

    // Initialize the empty slices
    for (var i = 0; i < auxanswer.length; i++) {
        auxanswer[i] = new Array();
    }

    // Goes through all elements in the input array
    array.forEach(function (element) {
        // Checks if eventTime is bigger than the start value if it is valid
        if (Math.floor(element[0]/realSlice) < (slices+shift) && element[0] >= start*1000) {
            // Selects the slice to push the element to based on the ratio between the eventTime
            // and the size of slice while also taking into account the offset
            // If slice is 5 seconds and eventTime is 3 seconds, it will go the 1st slice (3/5 = 0).
            // If slice is 5 seconds and eventTime is 6 seconds, it will go the 2nd slice (6/5 = 1).
            let index = Math.floor(element[0]/realSlice)-shift;
            auxanswer[index].push(element)
        }
    });

    // Goes through all the slices
    auxanswer.forEach(function (element) {
        let i = 1;
        // Initialize array to store statistics for each entry
        let z = [];

        // for each available metric (keydownTime, interval), computes the mean and variance
        while (i < width) {
            if (element.length > 0) {
                // if the event is longer than 10 seconds, it gets filtered out
                z.push(d3.mean(element.reduce(function(a, b) {if (b[i] < 10000) {a.push(b[i])} else {a.push(0)} return a}, [])),
                    d3.variance(element.reduce(function (a, b) {if (b[i] < 10000) {a.push(b[i])} else {a.push(0)} return a}, [])));
            } else {
                // If there are no elements in that slice, fills with 0
                z.push(0, 0);
            }
            i++;
        }
        finalAnswer.push(z);
    });

    // The output: Array of Arrays where each entry is a statistic such as mean or variance
    // The length of the inner arrays depends on the number of metrics available
    // The order will always be the following (mean, variance, mean, variance)
    return finalAnswer
}

function notZero(value) {
    return value > 0;
}

function isDefined(value) {
    return value != undefined;
}

function finalFatigue() {
    // Computes a final value for fatigue!
    // Divide the recording in 2 halves, first and second
    // For half, compute the value of the various available metrics such Key Downtimes, Click Intervals, Move Intervals ...
    // Between, Keyboard, mouse, downTimes, Intervals, Means and Variances, each half has 10 features.
    // For each half add the various similar metrics resulting in 4 final metrics Mean-Int, Mean-DT, Var-Int, Var-DT

    // WARNING: This was only developed for LoL analysis where each recording should have 2 parts. The first one with champ select,
    // Loading screen, early game and a second half with action packed teamfights and game decisive moments. Use at your own risk.

    // Gets Duration of recording
    let duration = recordDuration;

    // Gets the data related to Clicks, Keystrokes and Move events (intervals, downTimes)
    let fatMetrics = [allClickEvents, allKeyEvents, allMoveEvents];

    // We are hard-coding the analysis in two-halves of the recording
    let tempFirstHalf = [];
    let tempSecondHalf = [];

    let firstHalf = new Array(4);
    let secondHalf = new Array(4);

    // For each metric, we divide the metrics between first and second half
    fatMetrics.forEach(function(element, index) {
        if (element.length > 0) {
            let aux = sliceIt(element, duration/2);
            tempFirstHalf.push(aux[0]);
            tempSecondHalf.push(aux[1]);
        } else {
            tempFirstHalf.push([0, 0, 0, 0]);
            tempSecondHalf.push([0, 0, 0, 0]);
        };
    });

    // We are hard coding the metrics for each half
    // Each half has 4 entries by the following other: DownTime Mean, Interval Mean, DownTime Variance, Interval variance
    firstHalf[0] = (tempFirstHalf[0][0] + tempFirstHalf[1][0]);
    firstHalf[1] = (tempFirstHalf[0][2] + tempFirstHalf[1][2] + tempFirstHalf[2][0]);
    firstHalf[2] = (tempFirstHalf[0][1] + tempFirstHalf[1][1]);
    firstHalf[3] = (tempFirstHalf[0][3]+ tempFirstHalf[1][3] + tempFirstHalf[2][1]);

    secondHalf[0] = (tempSecondHalf[0][0] + tempSecondHalf[1][0]);
    secondHalf[1] = (tempSecondHalf[0][2] + tempSecondHalf[1][2] + tempSecondHalf[2][0]);
    secondHalf[2] = (tempSecondHalf[0][1] + tempSecondHalf[1][1]);
    secondHalf[3] = (tempSecondHalf[0][3]+ tempSecondHalf[1][3] + tempSecondHalf[2][1]);

    // For each metric computes a ratio between the second half and the first half.
    let tempAvg = [];
    firstHalf.forEach(function(element, idx) {
        tempAvg.push(secondHalf[idx]/element);
    });

    tempAvg = tempAvg.map(function(element){
        if (isNaN(element) || element == undefined) {
            return 0.5
        } else {
            return element
        }
    });

    let avg = tempAvg[0]*0.40+tempAvg[1]*0.40+tempAvg[2]*0.10+tempAvg[3]*0.10;
    // The final result is the minimum between half the average of the value of the 4 metrics and 1
    // If the average values are equal to the reference (first half), the fatigue will be = 0.5
    // If the average values are lower than the reference, the fatigue will be < 0.5
    // If the average values are higher than the reference, the fatigue will be > 0.5
    return Math.min(avg*0.5, 1)
}

function arrayFatigue() {

    // Returns array with fatigue levels, one value for each second and considerng a 10 seconds sliding window.
    let fatMetrics = [clickDownTimes, clickIntervals, keyIntervals, keyDownTimes, moveIntervals];
    let tempResult = [];

    fatMetrics.forEach(function(element, index) {

        // For each metric computes the mean values if they are not 0 (IO activity was detected)
        let stat = element.reduce(function (a, b) {
            let aux = d3.mean(b.filter(notZero));
            a.push(aux);
            return a
        }, []);

        // For each metric computes the variance values if they are not 0 (IO activity was detected)
        let stat2 = element.reduce(function (a, b) {
            let aux = d3.variance(b.filter(notZero));
            a.push(aux);
            return a
        }, []);

        // computes the average of the defined values
        let avg = d3.mean(stat.filter(isDefined));
        // For each undefined entry (no mean could be computed) make it the average of the defined values
        stat = stat.map(function(element, index) {
            if (element == undefined) {return avg} else {return element}
        });

        // computes the average of the defined values
        let avg2 = d3.mean(stat2.filter(isDefined));
        // For each undefined entry (no mean could be computed) make it the average of the defined values
        stat2 = stat2.map(function(element, index) {
            if (element == undefined) {return avg2} else {return element}
        });

        tempResult.push(stat, stat2);
    });

    // Clusters the means of DownTimes, means of Intervals, Variance of DownTimes and Variance of Intervals
    let DownTimes = (tempResult[0]).map(function(element, idx) {return (isNaN(element) ? 0 : element) + (isNaN(tempResult[6][idx]) ? 0 : tempResult[6][idx])});
    let Intervals = (tempResult[2]).map(function(element, idx) {return (isNaN(element) ? 0 : element) + (isNaN(tempResult[4][idx]) ? 0 : tempResult[4][idx]) + (isNaN(tempResult[8][idx]) ? 0 : tempResult[8][idx])});

    let DownTimes2 = (tempResult[1]).map(function(element, idx) {return (isNaN(element) ? 0 : element) + (isNaN(tempResult[7][idx]) ? 0 : tempResult[7][idx])});
    let Intervals2 = (tempResult[3]).map(function(element, idx) {return (isNaN(element) ? 0 : element) + (isNaN(tempResult[5][idx]) ? 0 : tempResult[5][idx]) + (isNaN(tempResult[9][idx]) ? 0 : tempResult[9][idx])});

    // Normalizes all the values for each metric
    DownTimes = DownTimes.map(v =>  (v - Math.min(...DownTimes))/(Math.max(...DownTimes) - Math.min(...DownTimes)));
    Intervals = Intervals.map(v =>  (v - Math.min(...Intervals))/(Math.max(...Intervals) - Math.min(...Intervals)));

    DownTimes2 = DownTimes2.map(v =>  (v - Math.min(...DownTimes2))/(Math.max(...DownTimes2) - Math.min(...DownTimes2)));
    Intervals2 = Intervals2.map(v =>  (v - Math.min(...Intervals2))/(Math.max(...Intervals2) - Math.min(...Intervals2)));

    let threshold = d3.quantile(apm, 0.33);

    // Computes average result
    // best case scenario: All metrics are 0, maximum performance
    // worst case scenario:  All metrics are 1, worst performance
    // The solution has a "normalization factor" based on the current APM values.
    // If, for each moment, the APM is lower than average, the fatigue level will be manually reduced
    // This prevents low IO activity from having high fatigue levels due to low amounts of data.
    DownTimes.map((element, idx) => {
        let answer = (element*0.40+Intervals[idx]*0.40+DownTimes2[idx]*0.10+Intervals2[idx]*0.10);

        if (isNaN(answer) || apm[idx] <= threshold) {
            return undefined
        } else {
            return answer
        }
    });

    let lowFatigue = Math.min(...DownTimes);

    return DownTimes.map((element, idx) => {

        if (element == undefined) {
            return lowFatigue*0.75
        } else {
            return element
        }
    });

}


module.exports = {
    startRecording : function(){ return startRecording()},
    stopRecording: function(){ return stopRecording()},
    recordDuration: function(){return recordDuration},
    getAPM: function(){return apm},
    getMPM: function(){return mouseMoves},
    getFinalFatigue: function() { return finalFatigue()},
    getFatigue: function() {return arrayFatigue()},
}