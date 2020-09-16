const bluetooth = require('node-bluetooth');
const events = require('events')
const em = new events.EventEmitter();
var firstComm = true;
let fs = require('fs');
var isWin = process.platform === "win32";

var sampleRateMov = 16;
var sampleRateEeg = 256;
var sampleRatePpg = 256;

// recDuration represents of secs passed since the start fo the recording
var recDuration;
var startTs;


var plotWindowSize = 6;
var connected = false;
var active = false;

var ioEegBuffer = "";
var ioPpgBuffer = "";
var ioMovBuffer = "";

var dataPPGRed = [];
var dataPPGIR =  [];
var dataEEG1 =   [];
var dataEEG2 =   [];
var dataEEG3 =   [];
var dataEEG4 =   [];
var dataAccX =   [];
var dataAccY =   [];
var dataAccZ =   [];
var dataGyroX =  [];
var dataGyroY =  [];
var dataGyroZ =  [];
var dataMagnX =  [];
var dataMagnY =  [];
var dataMagnZ =  [];

var connection;

var batteryLevel = 50;

// Regular expressions matching the communication protocol for each sensor:
var eegRegExpr = '![0-9A-Fa-f]{28}/';
var ppgRegExpr = '"[0-9A-Fa-f]{16}/';
var movRegExpr = '#[0-9A-Fa-f]{40}/';
var batteryRegExpr = '\\*[0-9A-Fa-f]{2}/';

var commBuffer = "";

// var animationInterval;
// var dataStorageInterval;

var mastrDeviceList = [];


// Get Timestamp for script start: fName
function addZero(x, n) {
  while (x.toString().length < n) {
    x = "0" + x;
  }
  return x;
}
var fName = new Date().toISOString();
// fName= fName.getFullYear()+"_"+addZero(fName.getMonth(),2)+"_"+addZero(fName.getDate(),2)+"_"+addZero(fName.getHours(),2)+"h_"+addZero(fName.getMinutes(),2)+"m_"+addZero(fName.getSeconds(),2)+"s_"+addZero(fName.getMilliseconds(),3)+"ms";



// CHANGE ME:
//let address = '00:14:03:17:43:55'; // 256
//let address = '00:14:03:17:41:00' // 128
//let address = '20:18:09:11:33:41'; // headband
//let channel = 1;
//let name = 'Emotai 0001\r\n';

// create device inquire:
const device = new bluetooth.DeviceINQ();
var mastrDeviceList = [];
// // List paired devices:
// device.listPairedDevices(console.log);bl

// // Find devices:
async function listNearbyDevices(){
    let promise = new Promise((res,rej) =>{
        device
            .on('finished', function finished(){
                res(mastrDeviceList.reverse());
                return mastrDeviceList;
            } )
            .on('error', () => {
                console.log("Error: couldn't list nearby devices!");
            })
            .on('found', function found(deviceAddress, deviceName){
                console.log(deviceAddress);
                if("EMOTAI"==deviceName.slice(0,6) || "MASTR"==deviceName.slice(0,6) || "Emotai" == deviceName.slice(0,6)){
                    console.log(deviceAddress);
                    if(isWin){
                        deviceAddress=deviceAddress.slice(1,18);
                    }
                    mastrDeviceList.push({deviceAddress,deviceName});
                }}).scan();
    });

    return promise;
 }


async function connect(address,channel){
    let promise = new Promise((res,rej) =>{
        bluetooth.connect(address, channel, function(err, linkage){
            // console.log(address+" "+channel);
            if(err) { connected = false; return rej(err+ " to "+ address)};
            connection = linkage;
            console.log("connected!")
            setConnected();
            res(true);
            return true;
        });
    });

    let result = await promise;
    return promise;

}


/**
 * This function searches for regular expressions matching the communication protocol sensor-type and its reading values
 * @param msg String to parse. e.g: '!0014DA,001542,001471,0014DA/'
 */
function parseMessage(msg){
    // Look for eeg message regular expression:
    let exprFound = msg.match(eegRegExpr);
    var ts = new Date();
    var eegExprCounter = 0;
    var movExprCounter = 0;
    var ppgExprCounter = 0;
    while(exprFound!=null && eegExprCounter < sampleRateEeg){
        // console.log("eeg counter = " + parseInt(exprFound[0].slice(1,5),16));
        // exprFound example message = '!F2BF43F3DD435F03429E0F42BCB0/' = 26 bytes
        var msgCounter = parseInt(exprFound[0].slice(1,5),16);
        var eeg1Expr = parseInt(exprFound[0].slice(5,11),16);
        var eeg2Expr = parseInt(exprFound[0].slice(11,17),16);
        var eeg3Expr = parseInt(exprFound[0].slice(17,23),16);
        var eeg4Expr = parseInt(exprFound[0].slice(23,29),16);
        dataEEG1.push(eeg1Expr);
        dataEEG2.push(eeg2Expr);
        dataEEG3.push(eeg3Expr);
        dataEEG4.push(eeg4Expr);
        //remove parsed characters from message:
        msg = msg.slice(0,exprFound.index) + msg.slice(exprFound.index+ exprFound[0].length);
        //search the remainder of the string for EEG message
        exprFound = msg.match(eegRegExpr);
        ioEegBuffer+= [ts.getTime()/1000, eeg1Expr,eeg2Expr,eeg3Expr,eeg4Expr].toString()+"\n";
        eegExprCounter++;
    }

    // Look for ppg message regular expression: '"F2BE 000728 001E3A/' = 14 bytes
    exprFound = msg.match(ppgRegExpr);
    while(exprFound!=null && ppgExprCounter < sampleRatePpg){
        // console.log("ppg counter = " + parseInt(exprFound[0].slice(1,5),16));
        var msgCounter = parseInt(exprFound[0].slice(1,5),16);
        var redExpr = parseInt(exprFound[0].slice(5,11),16);
        var irExpr = parseInt(exprFound[0].slice(11,17), 16);
        dataPPGRed.push(redExpr);
        dataPPGIR.push(irExpr);
        //remove parsed characters from message:
        msg = msg.slice(0,exprFound.index) + msg.slice(exprFound.index+ exprFound[0].length);
        //search the remainder of the string for more PPG message
        exprFound = msg.match(ppgRegExpr);
        ioPpgBuffer+=[ts.getTime()/1000, redExpr,irExpr].toString()+"\n";
        ppgExprCounter++;
    }

    exprFound = msg.match(movRegExpr);
    // Look for acc, gyro & magn message regular expression:
    while(exprFound!=null && movExprCounter < sampleRateMov){
        // exprFound example message = '#FF33003AEFD2FA67FC09FE9EFFB000EB0064/' = 38 bytes
        var msgCounter = parseInt(exprFound[0].slice(1,5),16);
        var accX = parseInt(exprFound[0].slice(5,9),16);
        var accY = parseInt(exprFound[0].slice(9,13),16);
        var accZ = parseInt(exprFound[0].slice(13,17),16);
        var gyroX = parseInt(exprFound[0].slice(17,21),16);
        var gyroY = parseInt(exprFound[0].slice(21,25),16);
        var gyroZ = parseInt(exprFound[0].slice(25,29),16);
        var magnX = parseInt(exprFound[0].slice(29,33),16);
        var magnY = parseInt(exprFound[0].slice(33,37),16);
        var magnZ = parseInt(exprFound[0].slice(37,41),16);
        var movList = [accX,accY,accZ,gyroX,gyroY,gyroZ,magnX,magnY,magnZ];
        var mask = 2**(16-1);
        for(var i=0; i<movList.length;i++){
            if(movList[i]>=32768){
                movList[i]= -(movList[i] & mask) + (movList[i] & ~mask)
            }
        }
        dataAccX.push(movList[0]);
        dataAccY.push(movList[1]);
        dataAccZ.push(movList[2]);
        dataGyroX.push(movList[3]);
        dataGyroY.push(movList[4]);
        dataGyroZ.push(movList[5]);
        dataMagnX.push(movList[6]);
        dataMagnY.push(movList[7]);
        dataMagnZ.push(movList[8]);

        ioMovBuffer+= ((ts.getTime()/1000).toString()+","+movList.toString()+"\n");

        //remove parsed characters from message:
        msg = msg.slice(0,exprFound.index) + msg.slice(exprFound.index+ exprFound[0].length);
        //search the remainder of the string for EEG message
        exprFound = msg.match(movRegExpr);
        movExprCounter++;
    }
    exprFound = msg.match(batteryRegExpr);
    while(exprFound!=null){
        // exprFound example message = '*90/'
        batteryLevel = parseInt(exprFound[0].slice(1,3),16)
        //remove parsed characters from message:
        msg = msg.slice(0,exprFound.index) + msg.slice(exprFound.index+ exprFound[0].length);
        //search the remainder of the string for more PPG message
        exprFound = msg.match(batteryRegExpr);

    }
    // console.log("after\n"+msg)
    // commBuffer=msg;
    // console.log("Found : " + eegExprCounter + " " + ppgExprCounter + " " + movExprCounter + " regex");

    return msg
    // We can check what's left in the message after parsing. There can be garbage from the first ever communication.
    // Additionally there can also be an incomplete last message. We will need the next second's message for it.
    // console.log("before\n"+commBuffer)
    //    console.log("after\n"+msg);
    //    console.log("\n------------------------------------------------");
}


function storeData(){
    var currentIoEegBuffer = ioEegBuffer;
    var currentIoPpgBuffer = ioPpgBuffer;
    var currentIoMovBuffer = ioMovBuffer;
    fs.appendFile('readings/'+ fName+"_eeg.txt",currentIoEegBuffer,function (err){
                            if(err) throw err;
        ioEegBuffer=ioEegBuffer.slice(currentIoEegBuffer.length)
    });
    fs.appendFile('readings/'+ fName+"_ppg.txt",currentIoPpgBuffer,function (err){
                            if(err) throw err;
        ioPpgBuffer=ioPpgBuffer.slice(currentIoPpgBuffer.length)

    });
    fs.appendFile('readings/'+ fName+"_mov.txt",currentIoMovBuffer,function (err){
                            if(err) throw err;
        ioMovBuffer=ioMovBuffer.slice(currentIoMovBuffer.length)
    });

}

function updateCommBuffer(){
    dataEEG1 = dataEEG1.slice(sampleRateEeg);
    dataEEG2 = dataEEG2.slice(sampleRateEeg);
    dataEEG3 = dataEEG3.slice(sampleRateEeg);
    dataEEG4 = dataEEG4.slice(sampleRateEeg);
    dataPPGIR = dataPPGIR.slice(sampleRatePpg);
    dataPPGRed = dataPPGRed.slice(sampleRatePpg);
    dataAccX = dataAccX.slice(sampleRateMov);
    dataAccY = dataAccY.slice(sampleRateMov);
    dataAccZ = dataAccZ.slice(sampleRateMov);
    dataGyroX = dataGyroX.slice(sampleRateMov);
    dataGyroY = dataGyroY.slice(sampleRateMov);
    dataGyroZ = dataGyroZ.slice(sampleRateMov);
    dataMagnX = dataMagnX.slice(sampleRateMov);
    dataMagnY = dataMagnY.slice(sampleRateMov);
    dataMagnZ = dataMagnZ.slice(sampleRateMov);
}

function setConnected(){
    // tell mastr to stop sending messages as we are not in aquisition mode yet.
    // stopComm();
    connected=true;
    console.log("connection made");
    d3.select("#gudieMenu").style("display","none");
}

function startRecording(){
    if(connected){
        startComm();
        active = true;
        return true;
    }else{
        throw "Tempest is not connected to any MASTR headband"
    }

}

function stopRecording() {
    if( connected ){
        if ( active ){
            stopComm();
            active = false;
            return true;
    //     }else throw "Tempest is connected to a MASTR headband, however no record has started yet."
    // }else throw "Tempest is not connected to any MASTR headband"
        }else{ return false;}
    }else{ return false;}
}

/**
 * Listener function responsible for i
 * @param buffer
 */
function dataListener(buffer){
    //console.log("==============>"+buffer.length)
    if(buffer.length>0){
        // when a message is received, append it to the message buffer
        commBuffer+=buffer;
        console.log("buffer length > 0")
        if(firstComm){
            fName = new Date().toISOString();
            fName = fName.replace(/:/g,"_");
            em.emit("firstCommRcvd")
            console.log("first comm")

            firstComm=false;
        }
        if(commBuffer.length>12960 +38+18+30 ){
            //parse communication Buffer
            var parsedMessageOutput = parseMessage(commBuffer);

            if(isBufferLengthGreaterThan(sampleRateEeg,sampleRatePpg,sampleRateMov)){
                em.emit("rawDataUpdate",[dataEEG1.slice(0,sampleRateEeg), dataEEG2.slice(0,sampleRateEeg),
                    dataEEG3.slice(0,sampleRateEeg), dataEEG4.slice(0,sampleRateEeg), dataPPGIR.slice(0,sampleRatePpg),
                    dataPPGRed.slice(0,sampleRatePpg),dataAccX.slice(0,sampleRateMov),dataAccY.slice(0,sampleRateMov),
                    dataAccZ.slice(0,sampleRateMov),dataGyroX.slice(0,sampleRateMov),dataGyroY.slice(0,sampleRateMov),
                    dataGyroZ.slice(0,sampleRateMov),dataMagnX.slice(0,sampleRateMov),dataMagnY.slice(0,sampleRateMov),
                    dataMagnZ.slice(0,sampleRateMov)]);
                storeData();
                commBuffer=parsedMessageOutput;
                updateCommBuffer();
            }
        }
    }
}


function errorListener(){
    console.log(" Bluetooth connection error! ")
}


function sendMessage(str){
    //TODO check if connection is active before try catch
    try{
        connection.write(new Buffer(str,'utf-8'), () => { console.log("wrote "+str);})
    }catch(err){
        console.error(err);
    }

}

function stopComm(){
    sendMessage('@S0/');
    connection.removeAllListeners();
    // clearInterval(dataStorageInterval);
    // clearInterval(animationInterval);
    firstComm = true;
}

function startComm(){
    sendMessage('@S1/');
    // add event for receiving data:
    connection.on('data', dataListener);
    connection.on('error', errorListener);
    // start Media Recording


}

function setSampleRate(device, value){
    if(device=="EEG"){
        if(value==256){sendMessage('@G0');}
        else if(value==128){sendMessage('@G1')}
        else throw "IMPOSSIBRU @EEG sample rate"
    }else if(device=="PPG"){
        if(value=256){ sendMessage('@P0')}
        else if( value == 128){ sendMessage('@P1')}
        else if( value == 64){ sendMessage('@P2')}
        else throw "IMPOSSIBRU @PPG sample rate"
    }else if( device == "MOV"){
        if(value== 16){ sendMessage('@M0')}
        else if(value == 8){ sendMessage('@M1')}
        else throw "IMPOSSIBRU @MOV sample rate"
    }
    else throw "Device parameter non existent"
}

function isBufferLengthGreaterThan(sampleRateEeg,bvpSampleRate,sampleRateMov){
    return dataEEG1.length>=sampleRateEeg&&/* dataEEG2.length/sampleRateEeg>=recLength &&
           dataEEG3.length/sampleRateEeg>=recLength && dataEEG4.length/sampleRateEeg>=recLength &&*/
           dataPPGIR.length>=sampleRatePpg && /*dataPPGRed.length/bvpSampleRate>=recLength &&*/
           dataAccX.length>=sampleRateMov /*&& dataAccY.length/sampleRateMov>=recLength &&
           dataAccZ.length/sampleRateMov >= recLength &&
           dataGyroX.length/sampleRateMov>=recLength && dataGyroY.length / sampleRateMov >= recLength &&
           dataGyroZ.length / sampleRateMov >= recLength &&
           dataMagnX.length / sampleRateMov >= recLength && dataMagnY.length / sampleRateMov >= recLength &&
           dataMagnZ.length / sampleRateMov >= recLength*/;
}

function cleanData(){
    dataPPGIR  =  [];
    dataPPGRed =  [];
    dataEEG1   =  [];
    dataEEG2   =  [];
    dataEEG3   =  [];
    dataEEG4   =  [];
    dataAccX   =  [];
    dataAccY   =  [];
    dataAccZ   =  [];
    dataGyroX  =  [];
    dataGyroY  =  [];
    dataGyroZ  =  [];
    dataMagnX  =  [];
    dataMagnY  =  [];
    dataMagnZ  =  [];

}

module.exports = {
    connect : function(mac_addr,ch){ return connect(mac_addr,ch)},
    listNearbyDevices: function(){ return listNearbyDevices()},
    getDevice: function(){ return mastrDeviceList;},
    setSampleRate: function(d,v){ setSampleRate(d, v);},
    startComm: function(){return startComm();},
    stopComm: function(){return stopComm();},
    dataPPGRed: function(){ return dataPPGRed;},
    getFileName: function(){ return fName;},
    dataPPGIR: function(){ return dataPPGIR;},
    dataEEG1: function(){ return dataEEG1;},
    dataEEG2: function(){ return dataEEG2;},
    dataEEG3: function(){ return dataEEG3;},
    dataEEG4: function(){ return dataEEG4;},
    dataAccX: function(){ return dataAccX;},
    dataAccY: function(){ return dataAccY;},
    dataAccZ: function(){ return dataAccZ;},
    dataGyroX: function(){ return dataGyroX;},
    dataGyroY: function(){ return dataGyroY;},
    dataGyroZ: function(){ return dataGyroZ;},
    dataMagnX: function(){ return dataMagnX;},
    dataMagnY: function(){ return dataMagnY;},
    dataMagnZ: function(){ return dataMagnZ;},
    getConnection: function() {return connection;},
    setSampleRateMov: function(sr){ sampleRateMov = sr;},
    setSampleRateEeg: function(sr){ sampleRateEeg = sr ;},
    setSampleRatePpg: function(sr){ sampleRatePpg = sr;},
    getSampleRateMov: function(){ return sampleRateMov;},
    getSampleRateEeg: function(){ return sampleRateEeg;},
    getSampleRatePpg: function(){ return sampleRatePpg;},
    getBatteryLevel: function(){ return batteryLevel;},
    getDataListener: function(){return dataListener;},
    // getEegExprCount: function(){ return eegExprCounter;},
    // getPpgExprCount: function(){ return ppgExprCounter;},
    // getMovExprCount: function(){ return movExprCounter;},
    getFirstCommTs: function(){ return firstCommTs;},
    sendMessage: function(str){ return sendMessage(str);},
    stopRecording : function(){ return stopRecording();},
    startRecording : function(){ return startRecording();},
    cleanData : function() { return cleanData();},
    emitter : function() { return em;}

}

