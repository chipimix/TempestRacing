var Fili = require('fili');
const fs = require('fs');

let prevFive = [];
let reference;

let prevThreeHRV = [];
let hrvRef;

// let ppgData = [];
// let danyPeaks = [];
// let joaquimPeaks = [];
// let squary = [];
// let devs = [];
// let rawPPG = [];
// let refs = [];

// Declare array to save all Peaks that have been detected in the recording
let allallPeaks;

// Declare array to save all Peaks that are relevant for the HRV analysis (subset of allallPeaks)
let allRelevantPeaks;

// INT that counts the complete windows we have been through. Needed to organise all the peaks
// since the same peak appears multiple times across various windows due to the overlap
let w = 0;

// BOOL to check if it's the first full window being analysed
let firstWindow = true;

// Size of the window for HRV analysis in seconds
let hrvWindow = 15

// The value that W should reach for the first HRV analysis
// Since w only increases after the first full PPG window has been analysed, w=1 only after 6 seconds of recording
let threshold = hrvWindow-6;

// INT to move the sliding window of the peaks to be considered
let z = 0;

// Overlap between consecutive sliding windows for HRV analysis
let overlap = 14/15;

// Index of the last peak detected in the window being currently analysed
let lastPeak;


function deriveHr(signal){

    //assign bandpass filter coefficient calculator
    var firCalculator =  new Fili.FirCoeffs();
    var firFilterCoeffs = firCalculator.bandpass({
        order: 50, // filter order
        Fs: 100, // sampling frequency
        F1: 0.75, // cutoff frequency
        F2: 3.5
    });
    //assign filter from new coefficient
    var firFilter = new Fili.FirFilter(firFilterCoeffs);
    //apply filter to input signal
    var ppgIrFiltered = firFilter.multiStep(signal).slice(50);
    //shift data into positive domain
    var minppgIrFiltered = Math.abs(d3.min(ppgIrFiltered));
    for(var i = 0 ; i < ppgIrFiltered.length; i++){
        ppgIrFiltered[i]+=minppgIrFiltered
    }

    // Inverts plots so prominent peaks are turned upside
    var outFiltered = [];
    ppgIrFiltered.forEach((e)=>{
        outFiltered.push(-e);
    });

    // Shift data into positive domain again
    outFiltered = outFiltered.map(function(element, idx) {
        return element - Math.min(...outFiltered)
    });

    // apply maximum and minimum resolution thresholds
    var ppgIrFilteredThrsd = [];
    var meanFiltered = d3.mean(outFiltered);
    let lowest = Math.min(...outFiltered);
    let highest = Math.max(...outFiltered);
    for(var i = 0; i < outFiltered.length; i++){

        // Compare each its points to the surrounding neighbours instead of the whole window
        // Good to detect small peaks
        let slice = outFiltered.slice(Math.max(i-125, 0), Math.min(i+125, outFiltered.length));
        let sides = d3.mean(slice) + 0.40*d3.deviation(slice);

        // If it is bigger, become the biggest value of the whole window
        if(outFiltered[i]>sides){
            ppgIrFilteredThrsd.push(highest)
            // else, become the lowest value of the whole window
        } else if (outFiltered[i]<sides) {
            ppgIrFilteredThrsd.push(lowest)
        } else {
            // else, just get the normal value
            ppgIrFilteredThrsd.push(outFiltered[i]);
        }
    }

    // apply slope sum function
    var ppgSSFThreshd = [];
    let down = [];
    let up = [];
    for(var i = 0; i < ppgIrFilteredThrsd.length - 1; i++){
        //1st derivative
        var firstDThresh = ppgIrFilteredThrsd[i+1]-ppgIrFilteredThrsd[i];

        // Save index of negative derivatives
        if (firstDThresh < 0) {
            down.push(i)
        }

        // Save all derivatives
        ppgSSFThreshd.push(firstDThresh);
    }

    // ppgSSFThreshd holds the key :D
    // Look for expressive derivatives (onsets of heartbeats)
    var latestDerivativeFoundTs = -999;
    // At least 0.40 seconds between consecutive peaks (150 BPMs)
    // When the HR reference goes above 120 BPMs, the minimum interval is reduced to 0.30 seconds (200 BPM)
    var minPeakDistMsec = (reference > 120 ? 30 : 40);
    var foundPeaks = [];
    var peakThreshold = 0.33*d3.max(ppgSSFThreshd);
    size = ppgSSFThreshd.length;
    for(var i= 0; i < size; i++){
        if(ppgSSFThreshd[i] > peakThreshold){
            // Detect POSITIVE derivatives
            if(i > latestDerivativeFoundTs + minPeakDistMsec) {
                latestDerivativeFoundTs = i;
                foundPeaks.push(i);
            }
        }
    }

    // When looking for peaks, every peak must be between a positive and negative derivative
    // For every positive derivative, there must always be a negative one too
    // The peak must be between a positive and negative derivative
    let latestfoundPeakTs = -999;
    let maxIndex = 0;
    let newFoundPeaks = [];
    for (var i=0; i < foundPeaks.length; i++) {

        // Positive derivative being currently considered
        let currentPeak = foundPeaks[i];

        // Looks at current positive derivative, the following one and to all the negative derivatives
        // Extracts the corresponding negative derivative for the positive derivative we are looking at
        // Careful, between an up and down there might be another a smaller up and down that must be filtered
        let end = partner(currentPeak, foundPeaks[i+1], down);

        // Between the positive and negative, the highest value of the original PPG signal must be the peak
        let slice = outFiltered.slice(currentPeak, end);
        // Gets index of Maximum value, the real peak
        let maxIndex = slice.reduce((iMax, x, w, arr) => x > arr[iMax] ? w : iMax, 0);

        // These peaks must also respect the minimum peak distance and the width must also be reasonable
        // The usual vales are 0.40 seconds between peaks but that is reduced to 0.30 when the HR reference goes above 120 BPMs
        // In that case, the minimum width of the peaks is also reduced
        // This avoid peaks due to having 1 or 2 points above the threshold
        if (currentPeak + maxIndex > latestfoundPeakTs + minPeakDistMsec && end-currentPeak >= (reference > 120 ?  5 : 10)) {
            latestfoundPeakTs = currentPeak + maxIndex;
            newFoundPeaks.push(currentPeak + maxIndex);
        }
    }

    // ppgData.push(outFiltered);
    // danyPeaks.push(foundPeaks);
    // joaquimPeaks.push(newFoundPeaks);
    // squary.push(ppgIrFilteredThrsd);
    // devs.push(ppgSSFThreshd);
    // rawPPG.push(signal);

    // Saves all the PPG peaks that have been detected until now in an array
    // First, we wait until we have a full window (6.5 seconds of data)
    if (ppgIrFiltered.length == 650) {
        // If that window is the first one to be analysed
        if (firstWindow) {
            // Our array with all the peaks will start with the peaks of the first full window
            allallPeaks = JSON.parse(JSON.stringify(newFoundPeaks));
            firstWindow = false;
            w++;
        } else {
            // If it is not the first window, we need to find the peaks that are only from the new PPG window
            // Since each PPG window has a 1 second slide, 5 of those seconds overlap with the previous window
            // So most peaks have already been detected
            let morePeaks = newFoundPeaks.filter(element => element > lastPeak-100+15);
            morePeaks = morePeaks.map(element => (100*w) + element);
            allallPeaks.push(...morePeaks);
            w++;
        }
    }

    // Identifies the last peak that has been detected
    lastPeak = newFoundPeaks[newFoundPeaks.length-1];

    // Check if we need a new analysis based on the specified constants
    // There are 2 case scenarios in the Math.max.
    // The first one works when the slide is higher than 1 second -> threshold + z*Math.floor((1-overlap)*hrvWindow) + 1
    // The second one works when the slide is lower than 1 second -> threshold + z + 1

    if (ppgIrFiltered.length < 650) {

        allRelevantPeaks = JSON.parse(JSON.stringify(newFoundPeaks));

    }  else if (w < threshold + 1) {

        allRelevantPeaks = JSON.parse(JSON.stringify(allallPeaks));

    }  else if (w == Math.max(threshold + z*Math.floor((1-overlap)*hrvWindow) + 1, threshold + z + 1)) {
        // Define the time where the analysis starts in seconds
        let step = Math.max(z*Math.floor((1-overlap)*hrvWindow), z);

        // Filter all the relevant peaks for the current analysis
        allRelevantPeaks = allallPeaks.filter(element =>  hrvWindow + step >= element/100 && element/100 >= step);
        z++;
    }

    // Compute HR
    let hr = computeHR(newFoundPeaks);

    // Compute HRV
    let hrv = computeHRV(allRelevantPeaks);

    // refs.push([hr, hrv, reference, hrvRef]);

    // If the HR value is abnormal, apply an heuristic to correct it
    if(hr <= 45 || isNaN(hr) || hr >= 200 || hr - reference > 20) {
        let noise = d3.deviation(prevFive);
        // Trade the abnormal value for a reference plus a small random variation
        // The randomness helps preventing the system from getting stuck in extreme cases
        hr = (reference == undefined ? 65 : reference + (Math.random() * 2 * noise - noise));
    } else {
        // The reference is computed based on the previous 5 normal values
        prevFive.push(hr);
        if (prevFive.length > 5) {
            prevFive.shift();
            let variation = d3.mean(prevFive.slice(1).map(function(x, idx) {return x - prevFive[idx]}));
            reference = d3.mean(prevFive) + variation;
        }
    }

    // Apply the same reasoning but for HRV
    if (/*hrv <= 10 ||*/ isNaN(hrv)  || hrv >= 120 || hrv - hrvRef > 20 || hrv - hrvRef < -35) {
        let noise = d3.deviation(prevThreeHRV);
        hrv = (hrvRef == undefined ? 30 : hrvRef + (Math.random() * 2 * noise - noise)*3);
    } else {
        // In this case, the reference is computed based on the previous 3 normal values
        prevThreeHRV.push(hrv);
        if (prevThreeHRV.length > 3) {
            prevThreeHRV.shift();
            let HRVvariation = d3.mean(prevThreeHRV.slice(1).map(function(x, idx) {return x - prevThreeHRV[idx]}));
            hrvRef = d3.mean(prevThreeHRV) + HRVvariation;
        }
    }

    return {"hrv": hrv, // INT of HRV computed by RMSSD in millisecond
        "hr": hr, // INT of HR computed in BPMs
        "foundPeaks": foundPeaks, // ARRAY with peaks of the PPG
        "threshPlot": ppgIrFilteredThrsd, // ARRAY with square wave from thresholding PPG
        "peakPlot": ppgSSFThreshd, // ARRAY with -1, 0, 1 from analysing the differences of the square wave
        "outFiltered": outFiltered // ARRAY with filtered PPG
    }
}


function smoothHR(dataHR){
    var smoothedHR = []
    //iterate unprocessed HR data array
    for(var i = 0; i<dataHR.length; i++){
        var val = d3.mean(dataHR.slice(i-5,i+5))*0.7+dataHR[i]*0.3;
        if(isNaN(val)){
            smoothedHR.push(d3.mean(dataHR.slice(0,5))*0.3+d3.mean(dataHR.slice(0,10))*0.4+dataHR[i]*0.3);
        }else{
            smoothedHR.push(val);
        }
    }
    return smoothedHR
}

// Computes the correspoding downslop for an upslope
// Input: INT index of upslope to be analised, INT index of next upslopes and ARRAY w/ index of downslopes
// Output: INT index of corresponding downslope
function partner (int, intNext, array) {

    let element;

    // If there is no upslope after the current one, it means the PPG window is ending
    // In that case, assume the limit is the ending of the PPG window
    let end = (intNext == undefined ? intNext = 645 : intNext);

    // Go through all downslopes
    for (var i=0; i < array.length; i++) {
        // The index of downslope we are looking for must be higher than the upslope
        // And should be lower than the follwing upslope
        if (array[i] > int && array[i] <= end) {
            element = array[i];
        }
    }

    // Returns the index of the downslope correspoding to our upslope
    return element
}

function computeHRV (arrayPeaks) {

    // Compute time difference between consecutive peaks
    let anotherHR = [];
    for(i=0; i<arrayPeaks.length-1; i++){
        anotherHR.push(arrayPeaks[i+1]-arrayPeaks[i]);
    }

    // Compute the median value of the computed intervals
    let standardInt = d3.median(anotherHR);

    // Remove the intervals that are clearly outliers based on the median value
    anotherHR = anotherHR.filter(item => 1.33*standardInt >= item && item >= 0.66*standardInt);

    // Compute RMSSD
    var anotherHRV = Math.sqrt(d3.mean(anotherHR.slice(1).map(function(element, idx) {return Math.pow((element - anotherHR[idx])*10, 2)})));

    return anotherHRV

}


function computeHR (arrayPeaks) {

    // Compute time difference between consecutive peaks
    let anotherHR = [];
    for(i=0; i<arrayPeaks.length-1; i++){
        anotherHR.push(arrayPeaks[i+1]-arrayPeaks[i]);
    }

    // Compute the median value of the computed intervals
    let standardInt = d3.median(anotherHR);

    // Remove the intervals that are clearly outliers based on the median value
    anotherHR = anotherHR.filter(item => 1.33*standardInt >= item && item >= 0.66*standardInt);

    // Compute HR
    anotherHR = d3.mean(anotherHR)*10 //hr in milliseconds
    anotherHR = 60000/anotherHR; // hr in bpms

    return anotherHR

}

// Computes an HRV value for the whole recording with the option for baseline
// Inputs: INT of time for baseline in seconds (0 if there is no baseline)
//         INT of time for size of windows to compute HRV values in seconds (Golden standard is 300 seconds, 5 minutes)
//         INT of time for the slide of windows to compute HRV values in seconds (slide is the opposite of overlap)
//
// Output: ARRAY with 2 entries - baseline HRV and task HRV (baseline HRV will be NaN if there is no baseline)
function computeRecordingHRV (time, size, slide) {
    // Array to save HRV of the different windows
    let allHRVs = [];

    // Checks if the inputs were defined
    // If undefined, the HRV will be computed for the whole recording
    let start = (typeof time  == 'undefined' ?  0  : time);
    let windSlide = (typeof slide == 'undefined' ? 0 : slide);
    let windSize = (typeof size == 'undefined' ? allallPeaks[allallPeaks.length-1]/100 + 1 : size);

    let p=0;
    let analysis = true;

    // Goes through all different windows based on the values of windSize and windSlide
    while (analysis) {

        // Computes HRV taking into account the relevant peaks of the considered window
        // The Windows start being computed after the value of start
        // Example: start = 60s; windSlide = 30s; windSize = 60s
        // The relevant windows will be (60 - 120)s, (90 - 150)s, (120 - 180)s, (150 - 210)s
        let hrv = computeHRV(allallPeaks.filter(element =>  p*windSlide + windSize + start >= element/100 && element/100 >= p*windSlide + start));
        // Saves the HRV value
        allHRVs.push(hrv);

        // If the upper limit of the window being considered is higher than the last peak that was detected
        if (p*windSlide + windSize + start > allallPeaks[allallPeaks.length-1]/100) {
            // Stop the analysis
            analysis = false;
        }
        p++;
    }

    // Computes HRV for the baseline
    let baseHRV = computeHRV(allallPeaks.filter(element => time >= element/100));

    // The final HRV of the relevant part of the recording will be the mean of the windows
    return [baseHRV, d3.mean(allHRVs)];
}

/*
    writeIt : function() {

        let recordName = new Date().toISOString();
        recordName = recordName.replace(/:|\./g,"_");
        let jsonData = '{"ppg": ' + JSON.stringify(ppgData) + ',"danyPeaks": ' + JSON.stringify(danyPeaks) + ',"joaquimPeaks": '
                            + JSON.stringify(joaquimPeaks) + ',"squares": ' + JSON.stringify(squary) + ',"devs": ' + JSON.stringify(devs) + ',"raw": ' + JSON.stringify(rawPPG)
                            + ',"refs": ' + JSON.stringify(refs) + ',"allPeaks": ' + JSON.stringify(allallPeaks) + '}';
        console.log(jsonData);
        fs.writeFile(`${recordName}_ppgstuff.txt`, jsonData, function(err) {
            if (err) {
                console.log(err);
            }
        });
    },
*/

module.exports = {
    deriveHr : function(sig){return deriveHr(sig)},
    smoothHR : function(hrArray){return smoothHR(hrArray)},
    fullRecordingHRV : function (time, size, slide) {return computeRecordingHRV(time, size, slide)},
    resetIt : function() {
        w = 0;
        z = 0;
        firstWindow = true;
        hrvRef = undefined;
        prevThreeHRV = [];
        reference = undefined;
        prevFive = [];
    }
}