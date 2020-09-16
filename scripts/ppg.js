var Fili = require('fili');
const fs = require('fs');

let prevFive = [];
let reference;

let prevThreeHRV = [];
let hrvRef;

let ppgData = [];
let danyPeaks = [];
let joaquimPeaks = [];
let squary = [];
let devs = [];
let rawPPG = [];
let refs = [];

let allallPeaks;
let w = 0;
let firstWindow = true;

let hrvWindow = 15
let threshold = hrvWindow-6;
let z = 0;
let overlap = 0.2;

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

    ppgData.push(outFiltered);
    danyPeaks.push(foundPeaks);
    joaquimPeaks.push(newFoundPeaks);
    squary.push(ppgIrFilteredThrsd);
    devs.push(ppgSSFThreshd);
    rawPPG.push(signal);

    if (ppgIrFiltered.length == 650) {
        if (firstWindow) {
            allallPeaks = JSON.parse(JSON.stringify(newFoundPeaks));
            firstWindow = false;
            w++;
        } else {
            let morePeaks = newFoundPeaks.filter(element => element > lastPeak-100+15);
            morePeaks = morePeaks.map(element => (100*w) + element);
            allallPeaks.push(...morePeaks);
            w++;
        }
    }

    lastPeak = newFoundPeaks[newFoundPeaks.length-1];

    // if (w == Math.max(threshold + z*Math.floor((1-overlap)*hrvWindow) + 1, z+1)) {
    //DoSomething
    // console.log('HERE WE GO!')
    // allRelevantPeaks = allallPeaks.filter(element =>  z*Math.floor((1-overlap)*hrvWindow) >= element/100 >= Math.floor((1-overlap)*hrvWindow) + z*Math.floor((1-overlap)*hrvWindow));
    // z++;
    // }

    // console.log(allRelevantPeaks);
    // console.log(allallPeaks);

    // Compute time difference between consecutive peaks
    let hr = [];
    for(i=0; i<newFoundPeaks.length-1; i++){
        hr.push(newFoundPeaks[i+1]-newFoundPeaks[i]);
    }

    // Compute the median value of the computed intervals
    let standardInt = d3.median(hr);

    // Remove the intervals that are clearly outliers based on the median value
    hr = hr.filter(item => 1.33*standardInt >= item && item >= 0.66*standardInt);

    // Compute RMSSD
    var hrv = Math.sqrt(d3.mean(hr.slice(1).map(function(element, idx) {return Math.pow((element - hr[idx])*10, 2)})));

    // Compute HR
    hr = d3.mean(hr)*10 //hr in milliseconds
    hr = 60000/hr; // hr in bpms

    refs.push([hr, hrv, reference, hrvRef]);

    // If the HR value is abnormal, apply an heuristic to correct it
    if(hr <= 45 || isNaN(hr) || hr >= 200 || Math.abs(hr - reference) > 30) {
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
    if (/*hrv <= 10 ||*/ isNaN(hrv)  || hrv >= 120 || Math.abs(hrv - hrvRef) > 35) {
        let noise = d3.deviation(prevThreeHRV);
        hrv = (hrvRef == undefined ? 30 : hrvRef + (Math.random() * 2 * noise - noise));
    } else {
        // In this case, the reference is computed based on the previous 3 normal values
        prevThreeHRV.push(hrv);
        if (prevThreeHRV.length > 3) {
            prevThreeHRV.shift();
            let HRVvariation = d3.mean(prevThreeHRV.slice(1).map(function(x, idx) {return x - prevThreeHRV[idx]}));
            hrvRef = d3.mean(prevThreeHRV) + HRVvariation;
        }
    }

    return {"hrv": hrv,
        "hr": hr,
        "foundPeaks": foundPeaks,
        "peakPlot":ppgSSFThreshd,
        "threshPlot": ppgIrFilteredThrsd,
        "outFiltered": outFiltered
    }
}

/**
 *
 * @param dataHR
 * @returns {[]}
 */
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

function partner (int, intNext, array) {

    let element;
    let end = (intNext == undefined ? intNext = 645 : intNext);

    for (var i=0; i < array.length; i++) {
        if (array[i] > int && array[i] <= end) {
            element = array[i];
        }
    }
    return element
}

module.exports = {
    deriveHr : function(sig){return deriveHr(sig)},
    smoothHR : function(hrArray){return smoothHR(hrArray)},
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

    resetIt : function() {
        w = 0;
        z = 0;
        firstWindow = true;
    }
}