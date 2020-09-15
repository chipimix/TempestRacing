const bluetooth = require('node-bluetooth')
const events = require('events')
const em = new events.EventEmitter();
let start,end;

let eeg1=[];
let eeg2=[];
let ppg=[];
let firstMsg = true;
let connection;
let data = new Buffer("");
const device = new bluetooth.DeviceINQ();
var deviceList = [];

// Find devices:
async function listNearbyDevices(){
    let promise = new Promise((res,rej) =>{
        device
            .on('finished', function finished(){
                res(deviceList.reverse());
                return deviceList;
            } )
            .on('error', () => {
                console.log("Error: couldn't list nearby devices!");
            })
            .on('found', function found(deviceAddress, deviceName){
                // console.log(deviceAddress);
                if("BITalino"==deviceName.slice(0,8)){
                    console.log(deviceAddress+"<---------------------");
                    deviceAddress=deviceAddress.slice(1,18); // windows os
                    deviceList.push({deviceAddress,deviceName});
                }}).scan();
    });

    return promise;
}

async function connect(address,channel){
    // if (typeof connection === 'undefined'){
        let promise = new Promise((res,rej) =>{
            bluetooth.connect(address, channel, function(err, linkage){
                if(err) { connected = false; return rej(err+ " to "+ address)};

                connection = linkage;

                // send sample rate setter message as 1000Hz:
                connection.write(Buffer.from( [(2 << 6) | 0x03],'utf-8'), (err) => {
                    if(err) { throw new Error(err); }
                    console.log("wrote "+((2 << 6) | 0x03).toString("2"));
                });
                res(true);
                return true;
            });
        });
        let result = await promise;
        return promise;
    // }
    // else{
    //     startDataStream();
    // }


}

function startDataStream(){
    //set start aquisition message:
    let analogChannels = [0, 1, 2];
    let commandStart = 0x01;
    for(const i of analogChannels) {
        commandStart = commandStart | 1 << (2+i);
    }
    //send start aquisition message:
    connection.write(Buffer.from( [commandStart],'utf-8'), (err) => {
        if(err) { throw new Error(err); }
        console.log("wrote "+commandStart);
    });
    connection.on('data', dataListener);
    // // why can't I detect when connection crashes? :(
    // connection.on('disconnect',()=>{ console.log("DISCONNECTED\nDISCONNECTED\nDISCONNECTED\nDISCONNECTED\nDISCONNECTED\n")});
    // connection.on('close',()=>{ console.log("2DISCONNECTED\n2DISCONNECTED\n2DISCONNECTED\n2DISCONNECTED\n2ISCONNECTED\n")});
    // connection.on('error',()=>{ console.log("3DISCONNECTED\n3DISCONNECTED\n3DISCONNECTED\n3DISCONNECTED\n3ISCONNECTED\n")});
    // connection.on('end',()=>{ console.log("4DISCONNECTED\n4DISCONNECTED\n4DISCONNECTED\n4DISCONNECTED\n4ISCONNECTED\n")});

    return true;
}

function checkCRC4(dataFrame){
    // let POLY = new Buffer([0,3,6,5,12,15,10,9,11,8,13,14,7,4,1,2]);
    // let len = dataFrame.length;
    // let OUT_CRC = dataFrame[len-1] & 0x0F;
    // let crc = 0;
    // for( var i = 0; i< len-2;i++){
    //     let b = dataFrame[i];
    //     crc = POLY[crc] ^ ( b >> 4); //get 1st 4 bits
    //     crc = POLY[crc] ^ ( b & 0x0F); // get last 4 bits
    // }
    // crc =  POLY[crc] ^ ( dataFrame[len-1] >> 4);
    // return crc == OUT_CRC;
    var POLY = new Buffer([0,3,6,5,12,15,10,9,11,8,13,14,7,4,1,2]);
    var crc = 0;
    for( var i = 0; i< dataFrame.length;i++){
        let b = dataFrame[i];
        crc = POLY[crc] ^ ( b >> 4); //get 1st 4 bits
        crc = POLY[crc] ^ ( b & 0x0F); // get last 4 bits
    }
    return !crc;
}
function getDataFromFrame(buffer){
    let a2 =(buffer[1] << 2)+(buffer[0] >> 6);
    let a1 = ((buffer[3] & 0x03) << 8) + buffer[2]
    let a0 = ((buffer[4] & 0x0F) << 6) +(buffer[3] >> 2);

    eeg1.push(a0);
    eeg2.push(a1);
    ppg.push(a2);
}

function dataListener(buffer){
    if(buffer.length===0){
        return;
    }
    if(firstMsg){
        start = new Date();
        firstMsg=false;
        em.emit("firstCommRcvd")
    }
    data = Buffer.concat([data,buffer])
    while(data.length>5){ //frame length from 3 bitalio channels
        let frame = data.slice(0,6);
        if(checkCRC4(frame)){
            //passed checksum, extract data
            getDataFromFrame(frame)
            //update data
            data = data.slice(6);
        }else{
            //     //if checksum fails, skip this byte
            console.log("checksum failed!")
            data = data.slice(1)
        }
    }
    // console.log(eeg1_aux.length +" " + (new Date() - start));

    if(eeg1.length>128){
        let auxEeg1 = eeg1.slice(0,128);
        let auxEeg2 = eeg2.slice(0,128);
        let auxPpg = ppg.slice(28,128);
        em.emit("rawDataUpdate",[auxEeg1, auxEeg2,auxPpg]);
        eeg1=eeg1.slice(100);
        eeg2=eeg2.slice(100);
        ppg=ppg.slice(100);
    }

}
function storeRawData(fName, eeg, ppg){
    fs.appendFile('readings/'+ fName+"_eeg.txt",eeg,function (err){
        if(err) throw err;
    });
    fs.appendFile('readings/'+ fName+"_ppg.txt",ppg,function (err){
        if(err) throw err;
    });
}

function stopRecording(){
    if(typeof connection != "undefined"){
        connection.write(Buffer.from( [0x00],'utf-8'), (err) => {
            if(err) { throw new Error(err); }
            console.log("wrote 0x00"+0x00);
        });
        connection.removeAllListeners();

    }
    firstMsg=true;
    return true;
}
function cleanData(){
    eeg1=[];eeg2=[];ppg=[];
}
function getSampleRatePpg(){
    return 100;
}
module.exports = {
    listNearbyDevices: function(){ return listNearbyDevices();},
    connect : function(mac_addr,ch){ return connect(mac_addr,ch);},
    startRecording : function(){ return startDataStream();},
    stopRecording : function(){ return stopRecording();},
    cleanData: function(){return cleanData();},
    getSampleRatePpg: function(){return getSampleRatePpg();},
    emitter : function() { return em;}

}



