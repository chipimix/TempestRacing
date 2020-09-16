function deriveMetrics(data){
    var fft = require('fft-js').fft;
    var delta = 0;
    var theta = 0;
    var alphaLeft = 0;
    var alphaRight = 0;
    var beta = 0;
    var gamma = 0;
    var numChannels = data.length;
    data.forEach((channel,idx)=>{
        var spectrum = fft(channel);
        for(var f = 1; f<52; f++){
            var r = spectrum[f][0];
            var i = spectrum[f][1];

            if(f<6){ //[1,3]Hz
                delta += Math.sqrt(r*r+i*i)/numChannels
            }else if(f<11){ //[4,7] Hz
                theta += Math.sqrt(r*r+i*i)/numChannels;
            }else if( f < 16){ //[8,12]Hz
                if(idx< 0.5*numChannels){
                    alphaLeft += Math.sqrt(r*r+i*i)/(0.5*numChannels);
                } else{
                    alphaRight += Math.sqrt(r*r+i*i)/(0.5*numChannels);
                }
            }else if( f <33){//[13,25]Hz
                beta+=Math.sqrt(r*r+i*i)/numChannels;
            }else if ( f < 52){//[26,40]Hz
                gamma+=Math.sqrt(r*r+i*i)/numChannels
            }
        }
    })
    let alpha = alphaLeft+alphaRight;
    let bw = delta + theta + alpha + beta + gamma;
    let engagement = beta / (alpha+theta);
    let stress = 0.5*theta/alpha+0.5*theta;
    let memLoad = theta/alpha;
    let emoValence = alphaRight - alphaLeft;
    let sleepiness = delta/bw;
    let focus = gamma/bw;
    // console.log("engagement = "+ engagement+ " stress = "+ stress+ "emotional valence = "+emoValence)
    return { engagement:engagement,stress: stress, valence:emoValence,
             memLoad:memLoad, sleepiness:sleepiness, focus:focus };
}

module.exports = {
    deriveMetrics : function(data){return deriveMetrics(data)}
}
