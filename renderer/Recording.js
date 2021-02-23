var LTTB = require("downsample").LTTB;
const d3 = require('d3');
const fs = require('fs');
const log = require('electron-log');
const editJsonFile = require("edit-json-file");
const plotter = require('../scripts/svg-renderer');
// const bComm = require('../scripts/mastrComms');
const bComm = require('../scripts/bitalinoComm');
const vidGrab = require('../scripts/videoGrab');
const fileIO = require('../scripts/fileIO');
const remote = require('electron').remote;
const dialog = require('electron').remote.dialog;
const http = require('http')
const eeg = require('../scripts/eeg');
const ppg = require('../scripts/ppg');
const sig = require('../scripts/signal');
const inputInteraction = require('../scripts/clickStrokes')
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
var aux = "";
var workingDir = require('electron').remote.app.getAppPath().slice(0,-19); //compiled
// var workingDir = require('electron').remote.app.getAppPath();
var liveRec = false;
var recordName = "";
var recordId;
var username = fileIO.getConfigJson().selectedUser;
var recordCamera = fileIO.getConfigJson().camera;
var viewMode = "Start";
var ipcRenderer = require('electron').ipcRenderer;
var gameStartOffset = 0;


/* RAW METRICS */
//PPG
var ppgIr = [];
var ppgRed = [];
var ppgTs = [];

//EEG
var eegTs = [];
var eeg1 = [];
var eeg2 = [];
var eeg3 = [];
var eeg4 = [];

//IMU
var accx = [];
var accy = [];
var accz = [];
var gyrox = [];
var gyroy = [];
var gyroz = [];
var magnx = [];
var magny = [];
var magnz = [];
var movTs = [];

// tell Tempest.js window manager app is initialized

/* -------------- DERIVED METRICS -------------- */
/* ----- RECORD PSYCHOPHYSIOLOGICAL METRICS ---- */
//PPG
let heartRate = [];
let hrv = [];
//EEG
let engagement = [];
let stress = [];
let emotionValence = [];
let focus = [];
let memLoad = [];
let sleepiness= [];
/* ------- RECORD KEYBOARD&MOUSE METRICS ------- */
let apm = [];
let mouseMoves = [];
let fatigue = [];
/* ------- RECORD GAME METRICS ------- */
let csm = [];
let gold = [];
/* ----------- PROGRESS OTHER METRICS ---------- */
let recordsProgress = [];
let progressData = [];

var svgXMousePos=0;

var chart1Metric ="";
var chart2Metric ="";

var communicationEmitter = bComm.emitter();
var fileEmitter = plotter.emitter();

let width = 1218.8;
let height = 133.849756097561;

let matchMetadata = {};
let reportMetadata = {};

var tok="";
var userId=0;
var racerList=[];
var orgId=0;
var org={};
let logName ="";
ipcRenderer.on('set-version', (event, arg) => {
    console.log("version = "+ arg);
    const versionSpan = document.getElementById('versionSpan')
    versionSpan.innerHTML = "Tempest "+arg
})
ipcRenderer.send('get-version')
/* --------------- EVENT HANDLERS -------------- */
ipcRenderer.on('usr-tok', function (event,datum) {
    tok=datum.token;
    userId=datum.userId;
    logName = datum.userId;
    if(username.length==0){
        username = datum.username;
    }
    getOrg();
    checkLogs();
});

function getOrg(){
    const request = require('request');
    request.get({url:'http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/org_list', headers: {Authorization:"Token "+tok}}, function(err,httpResponse,body){
        if(err || httpResponse.statusCode == 404){
            console.log("error ");
            updateHeaderText("⚠️️Can't Access Organization Retrying...   ⚠️");
            getOrg();
        }else{
            org = JSON.parse(body)[0];
            orgId = org.id;
            racerList = org.user_list;
            plotRacerUI(racerList)
            if (username.length >0){
                racerList.forEach((e)=>{
                    if(e.username==username){
                        console.log("hoh: userId = "+e.id);
                        console.log(e.username)
                        userId=e.id;
                        getProgressHistory();
                    }
                });
            }

        }
    });
}

function getProgressHistory(){
    const request = require('request');
    progressData = [];
    recordsProgress = [];
    request.get({url:'http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/org_data?user_id='+userId, headers: {Authorization:"Token "+tok}}, function(err,httpResponse,body){
        if(err || httpResponse.statusCode == 404){
            console.log("error ");
            updateHeaderText("⚠️️Can't Access Progress History! Retrying...   ⚠️");
            getProgressHistory();
        }else{
            let response = JSON.parse(body);
            parseProgressJSON(response);
            if(viewMode!="Start"){
                showProgress();
            }
        }
    });
}
/* -------------- WINDOW HANDLERS -------------- */
window.addEventListener("load", () => {
    lookForDevices();
});
window.addEventListener("resize", () =>{
    if(d3.select("#main").style("display")=="block"
        && !d3.select("#CHART1").empty()){
        //replot properly
    }
});

/* ----------- COMMUNICATION HANDLERS ---------- */
communicationEmitter.on("firstCommRcvd",()=>{
    recordName = new Date().toISOString();
    recordName = recordName.replace(/:/g,"_");
    // vidGrab.startMediaRecording(recordName,true,screen.width/4,screen.height/4,4,true,1280,720,4 );
    vidGrab.startMediaRecording(recordName,true,854,480,1,recordCamera,854,480,1 );
    fs.appendFile('readings/'+ recordName+"_derived.csv",["Engagement,Stress,Emotional Valence,Heart Rate,HRV,APM,Mouse Moves,Fatigue,Sleepiness,Focus,Memory Load"].toString()+"\n",function (err){
        if(err) throw err;3
    });
    updateHeaderText(" 🎥   Recording... 🎥 ")
    //hide menu start button:
    d3.select("#start_btn").style("display", "none");
    //display menu report button
    d3.select("#report_btn").style("display", "block");
    //hide guide interface
    d3.select("#guideMenu").style("display", "none");

});
communicationEmitter.on('rawDataUpdate', (arg) => {
    // Received data from wearable device
    d3.selectAll(".noLive").style("display","none");
    d3.select("#live").style("display","block");
    gamerRtDataParser(arg);
    gamerRtAnimation();
    gameRtDataUpdater();
    function gamerRtDataParser(arg){
        ppgIr = ppgIr.concat(arg[2]); //bitalino
        if(vidGrab.isRecording()){
            let brainMetrics = eeg.deriveMetrics([arg[0], arg[1]]); //bitalino
            engagement.push(brainMetrics.engagement);
            stress.push(brainMetrics.stress);
            emotionValence.push(brainMetrics.valence);
            focus.push(brainMetrics.focus);
            memLoad.push(brainMetrics.memLoad);
            sleepiness.push(brainMetrics.sleepiness);
            var aux = ppg.deriveHr((ppgIr));
            heartRate.push(aux.hr);
            hrv.push(aux.hrv);
            ppgRed = aux.outFiltered;
            console.log(inputInteraction.getAPM())
            console.log(inputInteraction.getMPM())
            console.log(inputInteraction.getFatigue())
            fs.appendFile('readings/'+ recordName+"_derived.csv",
                [brainMetrics.engagement,brainMetrics.stress,brainMetrics.valence,aux.hr,aux.hrv,inputInteraction.getAPM().slice(-1),inputInteraction.getMPM().slice(-1),inputInteraction.getFatigue().slice(-1),brainMetrics.sleepiness,brainMetrics.focus,brainMetrics.memLoad].toString()+"\n",
                function (err){if(err) throw err;});
        }
    }
    function gamerRtAnimation(){
        // plotter.plotPpgLiveAnimation("#PPGLive",ppgRed,256); //mastr
        plotter.plotPpgLiveAnimation("#PPGLive",ppgIr,100,heartRate.slice(-1)); //bitalino
    }
    function gameRtDataUpdater(){
        if(ppgIr.length>bComm.getSampleRatePpg()*6){
            ppgIr = ppgIr.slice(bComm.getSampleRatePpg());
        }
    }
});

function handleProgressClick(game_id){
    cleanMatchData();
    const csv = require('csv-parser');
    const request = require('request');
    //get game info for specific record
    let size=0;
    d3.select(".zoom").style("cursor","progress")
    request.get({url:'http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/recordings/'+game_id.toString()+"/",
        headers: {Authorization:"Token "+tok}}, function(err,httpResponse,body){
        let response = JSON.parse(body);
        updateHeaderText(" ⌛  Loading Race Report...  ⌛ ");
        d3.select("#loading").style("display","block");
        request(response.derivedMetrics, (err,res,body)=>{
            // console.log(err)
            // console.log("-->"+res.headers['content-length'])
            // console.log(typeof body)
            var data = d3.csvParse(body);
            console.log(data.length)
            // console.log(data)
            data.forEach((csvRowDict,i)=>{
                for (let metricKey in csvRowDict) {
                    switch(metricKey) {
                        case 'Engagement':
                            engagement.push(parseFloat(csvRowDict['Engagement']));break;
                        case 'Stress':
                            stress.push(parseFloat(csvRowDict['Stress']));break;
                        case 'Emotional Valence':
                            emotionValence.push(parseFloat(csvRowDict['Emotional Valence']));break;
                        case 'Heart Rate':
                            heartRate.push(parseFloat(csvRowDict['Heart Rate']));break;
                        case 'HRV':
                            hrv.push(parseFloat(csvRowDict['HRV']));break;
                        case 'Mouse Moves':
                            mouseMoves.push(parseFloat(csvRowDict['Mouse Moves']));break;
                        case 'APM':
                            apm.push(parseFloat(csvRowDict['APM']));break;
                        case 'Fatigue':
                            fatigue.push(parseFloat(csvRowDict['Fatigue']));break;
                        case 'Sleepiness':
                            sleepiness.push(parseFloat(csvRowDict['Sleepiness']));break;
                        case 'Focus':
                            focus.push(parseFloat(csvRowDict['Focus']));break;
                        case 'Memory Load':
                            memLoad.push(parseFloat(csvRowDict['Memory Load']));break;
                    }
                }
            })
            // console.log(engagement)
            engagement = sig.smoothedNumbers(engagement,engagement.length/154+3);
            // console.log(engagement)
            stress = sig.smoothedNumbers(stress,stress.length/154+3);
            emotionValence = sig.smoothedNumbers(emotionValence,emotionValence.length/154+3);
            sleepiness = sig.smoothedNumbers(sleepiness,sleepiness.length/154+3);
            memLoad = sig.smoothedNumbers(memLoad,memLoad.length/154+3);
            focus = sig.smoothedNumbers(focus,focus.length/154+3);
            heartRate=ppg.smoothHR(heartRate);
            hrv=ppg.smoothHR(hrv);
            // heartRate=heartRate;
            apm = sig.smoothedNumbers(apm,apm.length/154);
            mouseMoves = sig.smoothedNumbers(mouseMoves,mouseMoves.length/154);
            fatigue = sig.smoothedNumbers(fatigue,fatigue.length/154);

            d3.select('#screen').attr('src',response.screenVideo).attr('type','video/webm;codecs=h264');
            d3.select('#camera').attr('src',response.camVideo).attr('type','video/webm;codecs=h264');
            var vid = document.getElementById('screen');
            var cam = document.getElementById('camera');
            vid.load();
            cam.load();
            vid.oncanplaythrough = function (e) {
                vid.pause();
            };
            cam.oncanplaythrough = function (e) {
                cam.pause();
            }

            initialPlot();

            d3.select("#mouseInteraction").style("display","block");
            d3.select("#mouseInteraction").on("click",null);

            d3.select(".zoom").style("cursor","move");

            updateHeaderText(" 🏎️  "+date+"  Race Report  🏎️ ");
            d3.select("#loading").style("display","none");


        })
    });

}

/* ------------------ GETTERS ------------------- */
function getDataFromMetricName(name){
    switch(name) {
        case "Engagement":
            return engagement;
        case "Heart Rate":
            return heartRate;
        case "HRV":
            return hrv;
        case "Emotional Valence":
            return emotionValence;
        case "Stress":
            return stress;
        case "Sleepiness":
            return sleepiness;
        case "Focus":
            return focus;
        case "Memory Load":
            return memLoad;
        case "Mouse Activity":
            return mouseMoves;
        case "Actions Per Minute":
            return apm;
        case "Fatigue":
            return fatigue;
        // case "Gold":
        //     return gold;
        // case "Creep Score":
        //     return csm;
        // case "Engagement Progress":
        //     return engagementProgress;
        // case "Heart Rate Progress":
        //     return heartRateProgress;
        // case "Emotional Valence Progress":
        //     return emotionValenceProgress;
        // case "Stress Progress":
        //     return stressProgress;
        // case "Mouse Activity Progress":
        //     return mouseMovesProgress;
        // case "Actions Per Minute Progress":
        //     return apmProgress;
        // case "Gold Progress":
        //     return goldProgress;
        // case "Creep Score Progress":
        //     return csmProgress;
        // case "Kills Progress":
        //     return killsProgress;
        // case "Deaths Progress":
        //     return deathsProgress;
        // case "Assists Progress":
        //     return assistsProgress;
    }
}

/* ------------------ SETTERS ------------------- */
function cleanMatchData(){
    gameStartOffset=0;
    ppgIr = [];
    ppgRed = [];
    ppgTs = [];

    eegTs = [];
    eeg1 = [];
    eeg2 = [];
    eeg3 = [];
    eeg4 = [];

    accx = [];
    accy = [];
    accz = [];
    gyrox = [];
    gyroy = [];
    gyroz = [];
    magnx = [];
    magny = [];
    magnz = [];
    movTs = [];
    heartRate = [];
    hrv = [];
    engagement = [];
    stress = [];
    emotionValence = [];
    apm = [];
    mouseMoves = [];
    fatigue = [];
    csm = [];
    focus = [];
    memLoad = [];
    sleepiness = [];
    document.getElementById('camera').src = "";
}
function cleanProgressData(){
    recordsProgress = [];

}
/* ---------------- UI FUNCTIONS ---------------- */
/**
 * Plots list of found devices on the guideMenu Interface;
 * Updates the alert message accordingly;
 * Setups up functions for the interaction with each device;
 *
 * @param devices
 */
function plotFoundDevices(devices){
    //and alert txt
    if(!liveRec){
        if(devices.length>0){ // we found devices!
            // update left guide
            if(viewMode === "Start"){
                updateHeaderText("🛈  Headband found! Select it or Browse Progress  History 🛈");
            }
            d3.select("#leftGuideMenuText").selectAll("p").remove();
            d3.select("#leftGuideMenuText").append("p").text("Headband Found! Please select:");
            d3.select("#leftGuideMenuText").append("div").attr("id","deviceList");
            devices.forEach(d => { requestConnection(d)});
        }else{
            if(viewMode === "Start"){
                updateHeaderText("🛈  No headband found! Please make sure device is paired and retry...");
            }
            d3.select("#leftGuideMenuText")
                .insert("div",":nth-child(2)")
                .attr("class","helperMenuBtn")
                .attr("id","retryConn")
                .text("Retry Connection?")
                .on("click", ()=>{
                    lookForDevices();d3.select("#retryConn").remove();
                    d3.select("#leftGuideMenuText").select("p").text("Searching for headband...");

                })
            d3.select("#leftGuideMenuText").select("p").text("No Headband Found...");
        }
    }
}
// mouse over chart interaction:
function handleSessionReportMouseMove() {
    // TODO make this method generic for any number of charts
    //check if #CHART1 & #CHART2 css property display is equal to block
    // console.log(plotter.getScale().domain()+" "+plotter.getScale().range())
    let auxScale =d3.scaleLinear().domain(plotter.getScale().domain()).range([5,d3.select("rect.zoom").node().getBBox().width]);
    var newXPos = Math.round(auxScale.invert(d3.mouse(this)[0]));
    d3.scaleLinear().domain()
    if (newXPos < 0/* || svgXMousePos > inputInteraction.getRecDuration()*/) {
        console.log("OUTTABOUNDSOUTTABOUNDS      " + newXPos + "    >  " + inputInteraction.recordDuration());
        return;
    }
    if(newXPos !=svgXMousePos){ // this if prevents small movements from replotting the same data
        svgXMousePos=newXPos;
        plotter.highlightLineChart(svgXMousePos)
    }
    // TODO MAKE SURE THIS SUBTRACTION IS accurate in long-ass-recordings
    var vid = document.getElementById('screen');
    var cam = document.getElementById('camera');
    // var vid_time = plotter.getScale().invert(d3.mouse(this)[0]).toFixed(1);
    var vid_time = d3.scaleLinear().domain(plotter.getScale().domain()).range([5,d3.select("rect.zoom").node().getBBox().width]).invert(d3.mouse(this)[0]).toFixed(1);

    // console.log("x pos = "+ d3.mouse(this)[0].toFixed(1)+ "filtered xpos = "+vid_time); ''
    // console.log("vid.currentTime="+vid.currentTime)
    // console.log("cam.currentTime="+cam.currentTime)
    if(vid.currentTime.toFixed(1) != vid_time ){
        vid.currentTime = vid_time;
        vid.pause();
        cam.currentTime = vid_time;
        cam.pause();
    }
    let img = d3.select("#scrollBarContainer").select("image");
    if(img.attr("xlink:href")!=workingDir+"/images/play.png"){
        img.attr("xlink:href", workingDir+"/images/play.png")
    }
}
let currentRecIdx=-1;
function handleProgressHistoryMouseMove(d,i){
    // TODO make this method generic for any number of charts

    let auxScale =d3.scaleLinear().domain(plotter.getScale().domain()).range([5,d3.select("rect.zoom").node().getBBox().width]);
    var newXPos = Math.round(auxScale.invert(d3.mouse(this)[0]));
    // var newXPos = plotter.getScale().invert(d3.mouse(this)[0]);
    var testDate = newXPos;
    var bestDate;
    var bestDiff = -(new Date(0,0,0)).valueOf();
    var currDiff = 0;

    for(let i = 0; i < recordsProgress.length; ++i){
        currDiff = Math.abs(recordsProgress[i] - testDate);
        if(currDiff < bestDiff){
            bestDate = i;
            bestDiff = currDiff;
        }
    }
    function updateRecap(timeStamp){
        date=recordsProgress[timeStamp].toLocaleString('en-GB',{weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour:'numeric', minute:'numeric',second:'numeric'});
        let matchFatigue = progressData[timeStamp].fatigue;
        let matchApm = progressData[timeStamp].apm;
        let duration = progressData[timeStamp].duration;

        document.getElementById("progressInspector").innerHTML = "<p style='    font-weight: bolder;text-align: center;font-size: x-large;margin: 1% 0%;'> RACE RECAP</p>"+
            "<p>"+date+"</p>"+
            "<p>Duration............ "+parseInt(duration)+" min</p>"+
            "<p>User................ "+username+"</p>"+
            "<p>Engagement.......... "+nanToNa(getGrade("engagement",timeStamp)) +" %</p>"+
            "<p>Emotional Valence... "+nanToNa(getGrade("emotionalValence",timeStamp)) +" %</p>"+
            "<p>Stress.............. "+nanToNa(getGrade("stress",timeStamp)) +" %</p>"+
            "<p>Sleepiness.......... "+nanToNa(getGrade("sleepiness",timeStamp)) +" %</p>"+
            "<p>Focus............... "+nanToNa(getGrade("focus",timeStamp)) +" %</p>"+
            "<p>Memory Load......... "+nanToNa(getGrade("focus",timeStamp)) +" %</p>"+
            "<p>Heart Rate.......... "+nanToNa(parseInt(progressData[timeStamp].heartRate)) +" bpm</p>"+
            "<p>HRV................. "+nanToNa(parseInt(progressData[timeStamp].hrv))+" ms</p>";
        d3.selectAll("circle").style("r","7");
        d3.selectAll("circle").filter((d,i)=>{return i ===timeStamp || i ===timeStamp+recordsProgress.length;}).style("r","21");
    }
    if(currentRecIdx!=bestDate){
        currentRecIdx=bestDate;
        updateRecap(bestDate)
    }

}
function handleProgressHistoryMouseClick(d,i){
    var newXPos = plotter.getScale().invert(d3.mouse(this)[0]);
    var testDate = newXPos;
    var bestDate;
    var bestDiff = -(new Date(0,0,0)).valueOf();
    var currDiff = 0;

    for(let i = 0; i < recordsProgress.length; ++i){
        currDiff = Math.abs(recordsProgress[i] - testDate);
        if(currDiff < bestDiff){
            bestDate = i;
            bestDiff = currDiff;
        }
    }
    recordName=progressData[bestDate].date.replace(/:/g,"_")
    recordId = progressData[bestDate].id;

    handleProgressClick(recordId);

}
function getGrade(metricName,idx){
    let maxVal = -99999999999;
    let minVal = 99999999999;
    for(let i = 0; i<progressData.length;i++){
        let currVal = progressData[i][metricName];
        if(currVal>maxVal){
            maxVal=currVal
        }
        if(currVal<minVal){
            minVal=currVal
        }
    }
    return parseInt((progressData[idx][metricName]-minVal)/(maxVal-minVal)*100)
}
function quit(){

    try{
        stopRecording();
    }catch(e){
        log.error(e);
        remote.getCurrentWindow().close()
    }

    remote.getCurrentWindow().close()
}
function lookForDevices(){
    console.log("looking for cheese")
    // Fully loaded!
    var requestNearbyMastrDeviceList = bComm.listNearbyDevices();
    requestNearbyMastrDeviceList.then(r =>{
        plotFoundDevices(r);
    }).catch(err=>{ log.error(err); console.log(err)});
}
function requestConnection(d){
    d3.select("#deviceList").append("p")
        .attr("class","btn")
        .text(d.deviceName + " : "+ d.deviceAddress)
        .on("click", () =>{
            // console.log(d3.select(this));
            d3.select("#alert_txt").text("🛈  Attempting Bluetooth connection to "+d.deviceName+ " ... 🛈");
            var requestConnection = bComm.connect(d.deviceAddress,1);
            //handle successfull connection
            requestConnection.then(r =>{
                //Ready to start recording:
                console.log(requestConnection)
                d3.select("#alert_txt").text("🗲  Bluetooth connection to "+d.deviceName+ " successfully established - you can now start recording with the headband. 🗲");
                // update left guide
                d3.select("#leftGuideMenuText").selectAll("*").remove();
                d3.select("#leftGuideMenuText").append("p").text("Successfully connected to "+ d.deviceName+ ".");
                d3.select("#leftGuideMenuText").append("p").text("Click here to Start.");

                //hideGuide left guide:
                d3.select("#guideStart").style("display","block");
                d3.select("#guideSearch").style("display","none");

                d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("cursor","pointer")
                    .on("mouseover",()=>{ d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("background-color","#4b4b48")})
                    .on("mouseout", ()=>{d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("background-color","#31312f")})
                    .on("mousedown", ()=>{ startRecording();});


            }).catch(err=>{ d3.select("#alert_txt").text("⚠  " +err+ " Please make sure headband is charged and connected.  ⚠")});
        });
}
/**
 * This method updates the warning message
 */
function startRecording(){
    closeTrainingsMockup();
    cleanMatchData();
    try{
        console.log("trying start recording")
        if(bComm.startRecording()){
            startSWRecording(true);
            console.log("recording!")
            bComm.cleanData();
            engagement = [];
            stress = [];
            emotionValence = [];
            heartRate = [];
            hrv = [];
            focus = [];
            sleepiness = [];
            memLoad = [];
        }
    }catch (e) {
        console.log("failed")
        console.log(e)
        closeHelper();
        d3.select(".noLive").style("display","none");
        d3.select("#live").style("display","block");
    }
}
function stopRecording(){
    stopSWRecording();
    if(bComm.stopRecording()){
        //hw report
        engagement = sig.smoothedNumbers(engagement,engagement.length/154+3);
        emotionValence= sig.smoothedNumbers(emotionValence,emotionValence.length/154+3);
        stress= sig.smoothedNumbers(stress,stress.length/154+3);
        sleepiness = sig.smoothedNumbers(sleepiness,sleepiness.length/154+3);
        memLoad = sig.smoothedNumbers(memLoad,memLoad.length/154+3);
        focus= sig.smoothedNumbers(focus,focus.length/154+3);
        heartRate=ppg.smoothHR(heartRate);
        hrv=ppg.smoothHR(hrv);
    }
}
function gameReport(){
    let date = "";
    stopRecording();
    apm=inputInteraction.getAPM();
    let duration = parseInt(inputInteraction.recordDuration()/60).toString();
    mouseMoves=inputInteraction.getMPM();
    fatigue = inputInteraction.getFatigue();
    apm=sig.smoothedNumbers(apm,apm.length/154);
    mouseMoves=sig.smoothedNumbers(mouseMoves,mouseMoves.length/154);
    fatigue = sig.smoothedNumbers(fatigue, fatigue.length/154)
    viewMode = "Record";
    d3.select("#live").style("display","none");
    d3.select(".noLine").style("display","none");
    d3.select("#main").style("display","block");
    let request = require('request');

    //used to fetch LoL data here

    let gameReportFile = workingDir+"\\readings\\"+recordName+"_derived.csv";
    let screenVideoFile = workingDir+"\\readings\\"+recordName+".webm";
    let cameraVideoFile = workingDir+"\\readings\\"+recordName+"_cam.webm";
    setTimeout(()=>{

        let formData = {
            user: userId,
            date: recordName.replace(/_/g, ":"),
            apm: d3.mean(apm).toString(),
            mouseMoves: d3.mean(mouseMoves).toString(),
            fatigue: inputInteraction.getFinalFatigue(),
            duration: duration,
            derivedMetrics: fs.createReadStream(gameReportFile),
            screenVideo: fs.createReadStream(screenVideoFile)
        }
        if (fs.existsSync(cameraVideoFile)) {
            formData['camVideo'] = fs.createReadStream(cameraVideoFile);
        }
        if(engagement.length > 0){
            formData['engagement'] = d3.mean(engagement).toString();
            formData['stress'] = d3.mean(stress).toString();
            formData['emotionalValence'] = d3.mean(emotionValence).toString();
            formData['memoryLoad'] = d3.mean(memLoad).toString();
            formData['focus'] = d3.mean(focus).toString();
            formData['sleepiness'] = d3.mean(sleepiness).toString();
            formData['heartRate'] =d3.mean(heartRate).toString();
            formData['hrv'] = ppg.fullRecordingHRV()[1].toString();
            // formData['hrv'] =d3.mean(hearRateVariability).toString();
        }

        let sentSize = 0;
        let totalSize;
        // after we get LoL game metrics, store game data in back-end
        request.post(
            {
                url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/recordings/",
                headers: {Authorization:"Token "+tok},
                formData: formData
            }, function(err, res, body) {
                if (err || res.statusCode==404){
                    console.log(err)

                } else{
                    console.log(body)
                    let bodyJson = JSON.parse(body);
                    recordId = bodyJson.id
                    parseProgressJSON([bodyJson])
                    //erase local files
                    let arr= [gameReportFile,screenVideoFile];
                    if(recordCamera){
                        arr.push(cameraVideoFile)
                    }
                    arr.forEach((path)=>{
                        fs.unlink(path, (err) => {
                            if (err) {
                                console.error(err)
                                return
                            }
                            console.log("erased local files!")
                        })
                    })
                    function updateRecap(timeStamp){
                        console.log(timeStamp)
                        date=recordsProgress[timeStamp].toLocaleString('en-GB',{weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour:'numeric'});

                        let matchFatigue = progressData[timeStamp].fatigue*100;
                        let matchApm = progressData[timeStamp].apm;

                        document.getElementById("progressInspector").innerHTML = "<p style='    font-weight: bolder;text-align: center;font-size: x-large;margin: 1% 0%;'>RACE RECAP</p>"+
                            "<p>"+date+"</p>"+
                            "<p>Duration............ "+parseInt(duration)+" min</p>"+
                            "<p>User................ "+username+"</p>"+
                            "<p>Engagement.......... "+nanToNa(getGrade("engagement",timeStamp)) +" %</p>"+
                            "<p>Emotional Valence... "+nanToNa(getGrade("emotionalValence",timeStamp)) +" %</p>"+
                            "<p>Stress.............. "+nanToNa(getGrade("stress",timeStamp)) +" %</p>"+
                            "<p>Sleepiness.......... "+nanToNa(getGrade("sleepiness",timeStamp)) +" %</p>"+
                            "<p>Focus............... "+nanToNa(getGrade("focus",timeStamp)) +" %</p>"+
                            "<p>Memory Load......... "+nanToNa(getGrade("focus",timeStamp)) +" %</p>"+
                            "<p>Heart Rate.......... "+nanToNa(parseInt(progressData[timeStamp].heartRate)) +" bpm</p>"+
                            "<p>HRV................. "+nanToNa(parseInt(progressData[timeStamp].hrv))+" ms</p>";

                    }
                    updateRecap(progressData.length-1)
                    console.log(date)
                    updateHeaderText(" 🏎️  "+date+"  Race Report  🏎️ ")
                    console.log("1UPLOAD COMPLETE!")


                }
            }
        ).on('data', function (chunk) {
            sentSize+=chunk.length;
            updateHeaderText(" ⌛  Uploading Race Report..."+parseInt(sentSize/totalSize*100)+"%  ⌛ ");
            console.log(" ⌛  Uploading Race Report..."+parseInt(sentSize/totalSize*100)+"%  ⌛ ")
        }).on( 'response', function ( data ) {
            totalSize = data.headers['content-length'];
        } );


    }, 2000);
    initialPlot();


}

let SWOnlyMetricHandler;
function startSWRecording(withHW=false){
    cleanMatchData();
    ppg.resetIt();
    viewMode = "Live";
    closeHelper();


    closeHelper();
    d3.select(".noLive").style("display","none");
    d3.select("#live").style("display","block");
    // closeSettingsUpdateHeader();
    if( !withHW){ // if recording is SW only store SW only variables.
        recordName = new Date().toISOString();
        recordName = recordName.replace(/:/g,"_");

        fs.appendFile('readings/'+ recordName+"_derived.csv",["APM,Mouse Moves,Fatigue"].toString()+"\n",function (err){
            if(err) throw err;
        });
        SWOnlyMetricHandler = setInterval(()=>{
            let auxApm= inputInteraction.getAPM().slice(-1);
            let auxMouseMoves = inputInteraction.getMPM().slice(-1);
            let auxFatigue = inputInteraction.getFatigue().slice(-1);
            //todo, ideally this if would not be necessary because we shouldn't set the interval before we start recording

            if (auxApm>0 || auxMouseMoves.length>0){
                fs.appendFile('readings/'+ recordName+"_derived.csv",[auxApm, auxMouseMoves, auxFatigue].toString()+"\n",function (err){
                    if(err) throw err;
                });
            }

        }, 1000);
        vidGrab.startMediaRecording(recordName,true,854,480,1,recordCamera,854,480,1 );
        updateHeaderText(" 🎥   Recording without Headband ... 🎥 ")

    }else{
        updateHeaderText(" 🎥   Recording with Headband ... 🎥 ")
    }
    // vidGrab.startMediaRecording(recordName,true,screen.width/4,screen.height/4,1,true,1280,720,4 );

    liveRec=true;
    //hide menu start button:
    d3.select("#start_btn").style("display", "none");
    //display menu report button
    d3.select("#report_btn").style("display", "block");
    inputInteraction.startRecording(withHW);

}
function stopSWRecording(){
    clearInterval(SWOnlyMetricHandler);
    d3.select("#start_btn").style("display","block");
    d3.select("#report_btn").style("display","none");
    vidGrab.stopMediaRecording(true,recordCamera);
    liveRec=false;
    inputInteraction.stopRecording()
}

function stopHWRecording(){

}



function getCurrentHeightWidth(){
    winHeight = remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds().height;
    winWidth = remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds().width;
    margin = {top: 20.16, right: 10, bottom: 21.599999999999998, left: 54};
    width = winWidth-margin.left-margin.right;
    height = winHeight/4.1-margin.top-margin.bottom;

    return {"width":width,"height":height}
}
function plotLineChart(svgId, svgDatum, sr, name, width, height, xDomain, yDomain){
    // let plotSize = getCurrentHeightWidth();

    winHeight = remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds().height;
    winWidth = remote.getCurrentWindow().webContents.getOwnerBrowserWindow().getBounds().width;

    margin ={top: 20.16, right: 10, bottom: 21.599999999999998, left: 54};
    plotter.plotLineChart(svgId, svgDatum, sr, name, 1218.8, 133.849756097561,xDomain)
}

function showProgress(){
    if(progressData.length > 1 && viewMode!=="Live"){
        viewMode = "History";
        d3.selectAll("#CHART1").selectAll("*").remove();
        d3.selectAll("#CHART2").selectAll("*").remove();
        d3.select("#live").style("display","none");
        closeTrainingsMockup();
        d3.select(".noLine").style("display","none");
        d3.select("#main").style("display","block");
        closeHelper();
        closeMenu();
        closeSettingsUpdateHeader();
        initialProgressPlot();
        // updateHeaderText("📈    Progress History   📈");
        d3.selectAll("video").style("display","none");
        d3.select("#gameRecapBtn").style("display","none")

    }else{
        const optss = {
            type: 'warning',
            buttons: ['Okay'],
            defaultId: 0,
            title: 'Warning',
            message: 'Progress History requires two or more games.',
            detail: 'Please record more games using Tempest.',
            // checkboxLabel: 'Remember my answer',
            // checkboxChecked: true,
        };

        dialog.showMessageBox(null, optss, (response, checkboxChecked) => {
        });
    }
}

function initialPlot() {
    d3.selectAll("circle").remove();
    d3.selectAll("#circleTextCHART2").remove();
    d3.selectAll("#circleTextCHART1").remove();
    d3.selectAll('video').style("display","inline-block");
    let opts;
    viewMode="Record";
    chart1Metric="Engagement";
    chart2Metric="Heart Rate";
    if(engagement.length==0){
        chart1Metric="Mouse Activity";
        chart2Metric="Actions Per Minute"
        opts = getSwGameReportMetrics();
    }else{
        opts = getAllGameReportMetrics();
    }
    let datum1 = getDataFromMetricName(chart1Metric);
    let datum2 = getDataFromMetricName(chart2Metric);
    plotLineChart("CHART1", datum1,1, chart1Metric);
    plotLineChart("CHART2", datum2, 1, chart2Metric);
    d3.select("#chart1Dropdown").select("svg").remove();
    d3.select("#chart2Dropdown").select("svg").remove();
    //handle metric picker:
    if(d3.select("#chart1Dropdown").select("svg").empty()){
        var config = {
            width: 190,
            members: opts,
            fontSize: 18,
            fontFamily: "calibri",
            x: 20,
            y: 45,
            changeHandler: function(option) {
                console.log("changeHandler!")
                let chart="#CHART1";
                let metricName=option.label;
                let color='#00ffb0'
                if( this.parentNode.parentNode.parentNode.parentNode.id == "chart2Dropdown"){
                    chart="#CHART2"
                    color='#d31359'
                }
                if(viewMode=="History"){
                    console.log(metricName)
                    metricName+=" Progress";
                    plotter.plotProgressChart(chart, getDataFromMetricName(metricName),1, metricName, 1218.8, 133.849756097561);
                }else{

                    plotLineChart(chart, getDataFromMetricName(metricName),1, metricName, width, height, plotter.getScale().domain());
                    //plotter.plotScrollZoomBar( chart, getDataFromMetricName(metricName), d3.select("#CHART1").select(".dataLine").attr("d"), color,width,height);

                }
            }
        }
        plotter.svgDropDown(config,chart2Metric,d3.select('#chart2Dropdown'),"#d31359");
        plotter.svgDropDown(config,chart1Metric,d3.select('#chart1Dropdown'),"#00ffb0");
    }
    d3.selectAll(".zoom")
        .attr("width","100%")

    plotter.plotScrollZoomBar( "#CHART1", datum1, d3.select("#CHART1").select(".dataLine").attr("d"), "#00ffb0",1218.8,133.849756097561);

    d3.select("#mouseInteraction").on("mousemove",handleSessionReportMouseMove);
    // left click mouse re-loads video
    d3.selectAll("video").on("click",()=>{d3.select("#screen").node().load();d3.select("#camera").node().load();});
    plotter.plotScrollZoomBar( "#CHART2", datum2, d3.select("#CHART2").select(".dataLine").attr("d"), "#d31359",1218.8,133.849756097561);

    //
    // //display buttons interface
    d3.select("#gameRecapBtn").style("display","block");
    console.log('d3.select("#gameRecapBtn").style("display","block")')



}
function initialProgressPlot() {
    let opts = getAllProgressHistoryMetrics();
    //prevents bugs when transitioning from report to history while replay is playing:
    d3.selectAll('video').attr("src","")
    d3.selectAll(".scrollZoomBar").remove();
    d3.select("#chart1Dropdown").select("svg").remove();
    d3.select("#chart2Dropdown").select("svg").remove();
    d3.selectAll("circle").remove();
    //dropdown metric picker
    if(d3.select("#chart2Dropdown").select("svg").empty()) {

        var config = {
            width: 190,
            members: opts,
            fontSize: 18,
            fontFamily: "calibri",
            x: 20,
            y: 45,
            changeHandler: function (option) {
                // "this" refers to the option group
                // Change handler code goes here
                // document.getElementById("selectedInput").value = option.label;
                console.log("changeHandler")
                let chart="#CHART1";
                let metricName=option.label;
                let color='#00ffb0'
                if( this.parentNode.parentNode.parentNode.parentNode.id == "chart2Dropdown"){
                    chart="#CHART2"
                    color='#d31359'
                }
                // let d = getDataFromMetricName(metricName+" Progress");
                plotter.plotProgressChart(chart, progressData,1, metricName, 1218.8, 133.849756097561, plotter.getScale().domain());
                // plotter.plotProgressScrollZoomBar(chart, progressData, metricName,d3.select(chart).select('.dataLine').attr("d"), color,width, height )
            }
        }

        plotter.svgDropDown(config,"Heart Rate",d3.select('#chart2Dropdown'),"#d31359");
        plotter.svgDropDown(config,"Engagement",d3.select('#chart1Dropdown'),"#00ffb0");


        chart1Metric="Engagement";
        chart2Metric="Heart Rate";
        //
        // let datum1 = getDataFromMetricName(chart1Metric);
        // let datum2 = getDataFromMetricName(chart2Metric);
        let dim = getCurrentHeightWidth()
        let width = dim.width, height = dim.height;
        plotter.plotProgressChart("#CHART1", progressData,1, chart1Metric, 1218.8, 133.849756097561);
        plotter.plotProgressChart("#CHART2", progressData,1, chart2Metric, 1218.8, 133.849756097561);

        d3.select("#main").style("display","block");
        d3.selectAll("video").style("display","none")
        d3.select("#progressViewMode").style("display","inline-block");
        d3.select("#progressInspector").style("display","inline-block");
        d3.select("#mouseInteraction").style("display","block");
        //
        plotter.plotProgressScrollZoomBar( "#CHART1", progressData, chart1Metric, d3.select("#CHART1").select(".dataLine").attr("d"), "#00ffb0",1218.8, 133.849756097561);
        plotter.plotProgressScrollZoomBar( "#CHART2", progressData, chart2Metric, d3.select("#CHART2").select(".dataLine").attr("d"), "#d31359",1218.8, 133.849756097561);

        d3.select("#mouseInteraction").on("mousemove",handleProgressHistoryMouseMove);
        d3.select("#mouseInteraction").on("mouseenter",()=>{d3.select("#chart1Dropdown").style("opacity","0.5");d3.select("#chart2Dropdown").style("opacity","0.5");});
        d3.select("#mouseInteraction").on("mouseleave",()=>{d3.select("#chart1Dropdown").style("opacity","1");d3.select("#chart2Dropdown").style("opacity","1");});
        d3.select("#mouseInteraction").on("click",handleProgressHistoryMouseClick)

    }

    updateHeaderText("📈    Progress History   📈");

}
function parseProgressJSON(jsonObj){
    // cleanProgressData();
    jsonObj.forEach((game)=>{
        let matchMetadata = {}
        for (let metricKey in game) {
            let metricValue = game[metricKey]
            if (metricKey === 'date'){
                matchMetadata[metricKey]=metricValue;
                recordsProgress.push(new Date(metricValue));
            }else if(metricValue !== null){
                matchMetadata[metricKey]=metricValue;
            }
        }
        progressData.push(matchMetadata)
    })
}


window.onerror = function(error, url, line) {
    console.error = log.error;
    log.error(error,url,line)
};
window.addEventListener("DOMContentLoaded", function() {
    document.getElementById('usrId').value=fileIO.getConfigJson().selectedUser;
    if(recordCamera){
        setRecordingDevices(d3.select("#cameraGrabDropbtn").selectAll("*").nodes()[1]);
    }else{
        setRecordingDevices(d3.select("#cameraGrabDropbtn").selectAll("*").nodes()[2]);
    }
}, false);

function checkLogs(){
    //check for errors
    const { app } = require('electron').remote
    let localLog = app.getPath('home')+"/AppData/Roaming/Tempest/logs/renderer.log";
    const request = require('request');
    if (fs.existsSync(localLog)) {
        request.post(
            {
                url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/logs/",
                headers: {Authorization:"Token "+tok},
                formData: {
                    user: userId,
                    date: new Date().toISOString(),
                    logFile: fs.createReadStream(localLog)
                }
            }, function(err, res, body) {
                if (err || res.statusCode == 404) {
                    console.log(err)
                } else {
                    console.log("log file cloud storage successful. erasing local files")

                    console.log(res);
                    console.log(body);
                    //remove local file
                    fs.unlink(localLog, (err) => {
                        if (err) {
                            console.error(err)
                            return
                        }
                        console.log("erased local log file!")
                    })
                }
            }
        )
    }
}

function deleteRecord(){
    const options = {
        type: 'question',
        buttons: ['Delete', 'No, thanks'],
        defaultId: 2,
        title: 'Confirm',
        message: 'Do you want to delete this recording?',
        detail: "This action can't be undone.",
    };

    dialog.showMessageBox(null, options, (response, checkboxChecked) => {
        console.log(response);
        if(response==0){
            const request = require('request');
            request.delete({url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/recordings/"+recordId+"/",
                    headers: {Authorization:"Token "+tok},
                    formData: {}},
                function(err,res,body){
                    console.log(res);
                    console.log(body);
                    console.log("deleted deleted!")
                    getProgressHistory();
                });
        }
    });

}
function nanToNa(arg){
    if(isNaN(arg)) return "N/A";
    return  arg;
}

function handleProgressMouseInteraction(){
    d3.select("#mouseInteraction").on("mousemove",handleProgressHistoryMouseMove);
    d3.select("#mouseInteraction").on("mouseenter",()=>{d3.select("#chart1Dropdown").style("opacity","0.5");d3.select("#chart2Dropdown").style("opacity","0.5");});
    d3.select("#mouseInteraction").on("mouseleave",()=>{d3.select("#chart1Dropdown").style("opacity","1");d3.select("#chart2Dropdown").style("opacity","1");});
    d3.select("#mouseInteraction").on("click",handleProgressHistoryMouseClick)
}
function getFocus(){return focus;}
function launchExportReportWindow(){
    ipcRenderer.send('exportReport', {"hr":heartRate,"hrv":hrv,"emoVal":emotionValence ,"engagement":engagement ,"stress": stress, "sleepiness":sleepiness,"memLoad":memLoad,"metadata":matchMetadata,
        meta:{hr:d3.mean(heartRate),hrv:d3.mean(hrv),engagement:d3.scaleLinear().domain([d3.min(engagement),d3.max(engagement)]).range([0,100])(d3.mean(engagement)),valence:d3.scaleLinear().domain([d3.min(emotionValence),d3.max(emotionValence)]).range([0,100])(d3.mean(emotionValence)),
            stress:d3.scaleLinear().domain([d3.min(stress),d3.max(stress)]).range([0,100])(d3.mean(stress)),"sleepiness":d3.scaleLinear().domain([d3.min(sleepiness),d3.max(sleepiness)]).range([0,100])(d3.mean(sleepiness)),
            "memLoad":d3.scaleLinear().domain([d3.min(memLoad),d3.max(memLoad)]).range([0,100])(d3.mean(memLoad)),"user":username,"duration":engagement.length,"date":recordName.replace(/_/g,":")}})
}