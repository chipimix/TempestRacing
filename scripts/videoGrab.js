let recorder;
let cam_recorder;
var monitorCapture = false;
var camCapture = false;
var monitorHeight = 1080;
var monitorWidth = 1920;
// var videoFps = 16;
// var screenGrab = true;
// var camGrab = true;
// var videoWidth = 1920;
// var videoHeight = 1080;
var micGrab = true;
// var videoFPS = 30;
var storeScreenBlob = true;
var storeCamBlob = true;
var live = false;
// var f_name = "potato.webm";

let fs = require('fs');
const {desktopCapturer} = require('electron')

function startMediaRecording(fName, screenGrab,videoWidth,videoHeight,videoFPS,camGrab,cameraWidth,cameraHeight,cameraFps) {
    /**
     * Starts gathering information about all available desktop media sources, and
     * calls callback(error, sources) when finished. sources is an array of
     * DesktopCapturerSource objects, each DesktopCapturerSource represents a screen or
     * an individual window that can be captured.
     */
    desktopCapturer.getSources({types:[ 'window', "screen","Entire screen"]}, (error, sources) => {
        if (error) throw error
        // Iterate trough available sources:
        if(screenGrab) {
            for (let i = 0; i < sources.length; i++) {
                // If current source is Screen 1
                if (sources[i].name === 'Entire screen' || sources[i].name == "Screen 1") {
                    // Request MediaStream Promise:
                    navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sources[i].id,
                                minWidth: videoWidth,
                                maxWidth: videoWidth,
                                minHeight: videoHeight,
                                maxHeight: videoHeight,
                                maxFrameRate: videoFPS,
                                minFrameRate: videoFPS
                            },
                        }
                    }).then((stream) => handleScreenStream(stream, fName))
                        .catch(function() {
                            alert('could not connect screen');
                            log.error('could not connect screen')
                        })
                }
            }
        }

        //capture camera
        if(camGrab){
            navigator.mediaDevices.getUserMedia({
                audio :micGrab,
                video: {
                    mandatory: {maxFrameRate :videoFPS, minFrameRate: videoFPS,
                                maxWidth:cameraWidth, minWidth: cameraWidth,
                                maxHeight: cameraHeight, minHeight: cameraHeight}}})
                .then((stream)=>handleCameraStream(stream, fName))
                .catch(function() {
                    alert('could not connect camera');
                    log.error('could not connect camera');
                });
        }
    });

}
/**
 * This method is responsible for three distinct tasks:
 * 1: Upon recording's termination (aka: ondatavailable Event):
 * 1.1: save it in the file system;
 * 1.2: use the blob as src for a retrospective video (instead of loading the file we just saved in the disk)
 * 2: When metadata (duration, dimensions (video only) and text tracks) for the specified video has been loaded
 * (aka: onloadedmetadata  Event), show it in the html <video> tag
 **/
function handleScreenStream(stream, fName) {
    const video = document.getElementById('screen');
    recorder = new MediaRecorder(stream,{mimeType: 'video/webm;codecs=h264'});
    recorder.ondataavailable = function(event) { //// the entire media has been recorded
        var reader = new FileReader();
        reader.onload = function(){
            var buffer = Buffer.from(reader.result);
            if(storeScreenBlob){
                fs.writeFile("readings/"+fName+".webm", buffer, {}, (err,res) =>{
                    if(err){ console.log(err);return;}
                    // video BLOB is successfully stored in the filesystem!
                    // change the video src to the video BLOB
                    video.srcObject = null;
                    video.src =  URL.createObjectURL(event.data);
                    video.currentTime = 9999999999; // this line is important; other code is optional
                    video.pause();
                });
            }else{
                //set flag as true for next usage
                storeScreenBlob=true;
                video.srcObject = null;
                video.src =  URL.createObjectURL(event.data);
                video.currentTime = 9999999999; // this line is important; other code is optional
                video.pause();
            }
        }
        reader.readAsArrayBuffer(event.data);
    };
    // Show real-time video in the html <video> tag
    video.srcObject = stream;
    video.onloadedmetadata = (e) =>  {console.log("1hermagherd loaded metadatums");video.play()};

    recorder.onstop = function(event){
        live=false;
    }
    recorder.onstart = function(){
        setTimeout(function(){ live = true; }, 1000);
    }
    recorder.start();
}

/**
 *
 * @param stream
 */
function handleCameraStream(stream, fName){
    // document.getElementById('camera').src = URL.createObjectURL(stream);
    const cam = document.getElementById('camera');
    // console.log("<--<-<-<-<------")
    // console.log(cam);
    cam_recorder = new MediaRecorder(stream, {mimeType: 'video/webm;codecs=h264'});
    cam_recorder.ondataavailable = function(event){ // the entire media has been recorded
        var reader = new FileReader();
        reader.onload = function(){
            var buffer = Buffer.from(reader.result);

            if(storeCamBlob) {
                fs.writeFile("readings/" + fName + "_cam.webm", buffer, {}, (err, res) => {
                    if (err) {
                        console.log(err);
                        return
                    }
                    cam.srcObject = null;
                    cam.src = URL.createObjectURL(event.data);ap
                    cam.currentTime = 9999999999; // this line is important; other code is optional
                    cam.pause();
                });
            }else{
                cam.srcObject = null;
                cam.src = URL.createObjectURL(event.data);
                cam.currentTime = 9999999999; // this line is important; other code is optional
                cam.pause();
                storeCamBlob=true;
            }
        }
        reader.readAsArrayBuffer(event.data);
        console.log(event)
        console.log(event.data)
    };

    cam.srcObject=stream;

    // this commented line prevents camegrab from auto-playing the mic in real-time
    cam.onloadedmetadata = (e) =>{console.log("2hermagherd loaded metadatums");cam.play()};
    cam_recorder.start();
}
/**
 * This method tells the MediaRecorder to stop recording;
 * Eventually this will trigger the ondataavailable event invoced at handleScreenStream(stream)
 */
function stopMediaRecording(screenGrab,camGrab) {
    try{
        if(camGrab){
            //line below turns off camera DE FACTO & for good; shutting its creepy LED light >:D
            cam_recorder.stop();
            cam_recorder.stream.getTracks()[0].stop();
            cam_recorder.stream.getTracks()[1].stop();

        }
        if(screenGrab){
            recorder.stop();
        }
    }catch(e){
        console.log(e);
        log.error(e);
    }
}
/**
 * This method is called when an Error is catched in the handleScreenStream(stream) method.
 * @param e, Error to print
 */
function handleUserMediaError(e) {
    console.error('handleUserMediaError', e);
}

//
module.exports = {
    stopMediaRecording : function(screenGrab,cameraGrab){ return stopMediaRecording(screenGrab,cameraGrab)},
    startMediaRecording : function(fName,screen,screenW,screenH,screenFps,cam,camW,camH,camFps){ return startMediaRecording(fName,screen,screenW,screenH,screenFps,cam,camW,camH,camFps)},
    isRecording : function(){ return live;}
}
