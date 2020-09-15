//serving no actual purpose :D

/**
 * Apply LPF to an array of samples.
 * @param {!Array<number>} samples The samples.
 * @param {!number} cutoff The cutoff frequency.
 * @param {!number} sampleRate The sample rate.
 * @param {!number} numChannels The number of channels.
 */
function lowPassFilter(samples, cutoff, sampleRate, numChannels) {
    console.log(samples);
    var rc = 1.0 / (cutoff * 2 * Math.PI);
    var dt = 1.0 / sampleRate;
    var alpha = dt / (rc + dt);
    var last_val = [];
    var offset;
    for (let i=0; i<numChannels; i++) {
        last_val[i] = samples[i];
    }
    for (let i=0; i<samples.length; i++) {
        for (let j=0; j< numChannels; j++) {
            offset = (i * numChannels) + j;
            last_val[j] = last_val[j] + (alpha * (samples[offset] - last_val[j]));
            samples[offset] = last_val[j];
        }
    }
    return samples;
}

function highPassFilter(samples, cutoff, sampleRate, numChannels) {
    var rc = 1.0 / (cutoff * 2 * Math.PI);
    var dt = 1.0 / sampleRate;
    // var alpha = dt / (rc + dt);
    var alpha = rc / (rc + dt);
    var last_val = [];
    var offset;
    for (let i=0; i<numChannels; i++) {
        last_val[i] = samples[i];
    }
    for (let i=0; i<samples.length; i++) {
        for (let j=0; j< numChannels; j++) {
            offset = (i * numChannels) + j;
            // last_val[j] = last_val[j] + (alpha * (samples[offset] - last_val[j]));
            last_val[j] = alpha * ( last_val[j] +samples[offset] -samples[offset-1] );
            samples[offset] = last_val[j];
        }
    }
    return samples;
}

function bandPassFilter(data,sampleRate, cutOffA, cutOffB){
    console.log("data length = "+ data.length + "   ||    sample rate = "+ sampleRate);
    var fft = require('fft-js').fft;
    var iff = require('fft-js').ifft;

    var spectrum = fft(data);
    console.log("PSD length = "+spectrum.length);
    var plotFFT = [];
    var filteredFFT = [];
    spectrum.forEach((e,idx)=>{
        var currFreq = idx*(sampleRate/data.length);
        if(currFreq<=cutOffB && currFreq>=cutOffA){
            filteredFFT.push(e);
        }else{
            filteredFFT.push([0,0])
        }
    });
    var filteredSig = iff(filteredFFT)
    console.log("Filtered signal output length = "+ filteredSig.length);
    return filteredSig;

}


/**
 *
 * @param sources
 * @param bandwidth
 * @returns {number[]}
 */
function smoothedNumbers (sources, bandwidth) {
    var targets = d3.range(0,sources.length);
    var idxdata=[];
    targets.forEach(function merge(idx) {
        idxdata.push([idx,sources[idx]]);
    });
    // console.log(idxdata);
    return targets.map(function (t) {
        var numerator = d3.sum(idxdata, function (s) {
            return gaussian(s[0], t, bandwidth) * s[1];
        });

        var denominator = d3.sum(idxdata, function (s) {
            return gaussian(s[0], t, bandwidth);
        });

        return numerator / denominator;
    });
}

/**
 *
 * @param target
 * @param source
 * @param bandwidth
 * @returns {number}
 */
function gaussian (target, source, bandwidth) {
    return Math.exp(-Math.pow(target - source, 2) / (2*bandwidth*bandwidth));
}



module.exports = {
    bandPassFilter: function(data,sampleRate,cutOffA, cutOffB){ return bandPassFilter(data,sampleRate,cutOffA,cutOffB)},
    lowPassFilter: function(s, c,sr,ch){ return lowPassFilter(s,c,sr,ch)},
    highPassFilter: function(s,c,sr,ch){return highPassFilter(s,c,sr,ch)},
    gaussian: function(t,s,b){return gaussian(t,s,b)},
    smoothedNumbers: function(sources,bandwidth){return smoothedNumbers (sources, bandwidth)},

}
