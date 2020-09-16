const csv = require('csv-parser');
const fs = require('fs');
const events = require('events')
const em = new events.EventEmitter();
let gameMetrics =""




function storeProgress(fileName, date, avgEngagement, avgStress, avgEmoValence, avgHR,avgApm, avgMouseMoves,lolAPI){
    let msg = "";
    let kills=0, deaths=0, assists=0;
    date = date.replace(/_/g, ":");
    Object.keys(lolAPI).forEach(function(key) {
        switch(lolAPI[key]) {
            case "K":
                kills++;
                break;
            case "D":
                deaths++;
                break;
            case "A":
                assists++;
                break;
    }});
    if(avgEmoValence!==undefined){
        msg="\n"+date+","+avgEngagement+","+avgStress+","+avgEmoValence+","+avgHR+","+avgApm+","+avgMouseMoves+','+kills+','+deaths+','+assists+',"'+lolAPI+'"';
    }else{
        msg="\n"+date+",,,,,"+avgApm+","+avgMouseMoves+','+kills+','+deaths+','+assists+',"'+lolAPI+'"';
    }

    if(!fs.existsSync('readings/'+fileName+'Progress.csv')){
        // if it doesn't add header
        fs.appendFile('readings/'+fileName+'Progress.csv','Date,Engagement,Stress,Emotional Valence,Heart Rate,Actions per Minute,Mouse Moves,' +
            'Kills,Deaths,Assists,Game Metrics'+msg,function (err){ if(err) throw err; console.log("saved "+msg)});
    }else {
        fs.appendFile('readings/' + fileName + 'Progress.csv',
            msg, function (err) {
            if (err) throw err;
            console.log("saved " + msg);
        });
    }


}
function ImportDerivedMetrics(fileName,engagement,stress,emoValence,hr,apm,mouseMoves){
    fs.createReadStream(fileName)
        .pipe(csv())
        .on('data', (csvRowDict) => {
            for (let metricKey in csvRowDict) {
                switch(metricKey) {
                    case 'Engagement':
                        engagement.push(parseFloat(csvRowDict['Engagement']));break;
                    case 'Stress':
                        stress.push(parseFloat(csvRowDict['Stress']));break;
                    case 'Emotional Valence':
                        emoValence.push(parseFloat(csvRowDict['Emotional Valence']));break;
                    case 'Heart Rate':
                        hr.push(parseFloat(csvRowDict['Heart Rate']));break;
                    case 'Mouse Moves':
                        mouseMoves.push(parseFloat(csvRowDict['Mouse Moves']));break;
                        console.log(csvRowDict)
                        console.log(csvRowDict['Mouse Moves'])
                    case 'APM':
                        apm.push(parseFloat(csvRowDict['APM']));break;
                }
            }
        })
        .on('end', () => {
            console.log("record import ended")
            console.log(mouseMoves)
            em.emit("recordLoaded",)

        });
}
function getProgressReportData(username,date,engagement,stress,emoValence,hr,apm,mouseMoves,/*gameApi,*/ kills, deaths, assists){
    let i=0;
    fs.createReadStream('readings/'+username+"Progress.csv")
        .pipe(csv())
        .on('data', (csvRowDict) => {
            console.log(i++);
            console.log(csvRowDict)
            for (let metricKey in csvRowDict) {
                console.log(metricKey)
                switch(metricKey) {
                    case 'Date':
                        let fName = csvRowDict['Date'];
                        date.push(new Date(fName));break;
                    case 'Engagement':
                        console.log(csvRowDict['Engagement'])
                        if(csvRowDict['Engagement']!=undefined){
                            engagement.push(parseFloat(csvRowDict['Engagement']));
                        }
                        break;
                    case 'Stress':
                        if(csvRowDict['Stress']!=undefined){
                            stress.push(parseFloat(csvRowDict['Stress']));
                        }
                        break;
                    case 'Emotional Valence':
                        if(csvRowDict['Emotional Valence']!=undefined){
                            emoValence.push(parseFloat(csvRowDict['Emotional Valence']));
                        }
                        break;
                    case 'Heart Rate':
                        if(csvRowDict['Heart Rate']!=undefined){
                            hr.push(parseFloat(csvRowDict['Heart Rate']));
                        }
                        break;
                    case 'Mouse Moves':
                        mouseMoves.push(parseFloat(csvRowDict['Mouse Moves']));break;
                    case 'Actions per Minute':
                        console.log()
                        apm.push(parseFloat(csvRowDict['Actions per Minute']));break;
                    case 'Game Metrics':
                        /*gameApi.push(csvRowDict['Game Metrics']);*/break;
                    case 'Kills':
                        kills.push(csvRowDict['Kills']);break;
                    case 'Deaths':
                        deaths.push(csvRowDict['Deaths']);break;
                    case 'Assists':
                        assists.push(csvRowDict['Assists']);break;
                }
            }

        })
        .on('end', () => {
            em.emit("progressLoaded")

        });
}
function getGameMetricsData(username,record){
    let readStream = fs.createReadStream('readings/'+username+"Progress.csv")
        .pipe(csv())
        .on('data', (csvRowDict) => {
            console.log(csvRowDict['Date'])
            console.log(record)
            if (csvRowDict['Date']== record){
                gameMetrics = csvRowDict['Game Metrics'];

                readStream.destroy()
            }
        })
        .on('close', () => {
            console.log("hey! "+ gameMetrics)
            em.emit("gameMetricsLoaded", gameMetrics)

        });
}
function getConfigJson(){
    let rawdata = fs.readFileSync(process.cwd()+'\\config.json');
    let jsonConfig = JSON.parse(rawdata);
    return jsonConfig
}
function setConfigJson(args){
    //let out=[]
    if(typeof args.username != "undefined"){
        //out.push({"username":username});
        //let data = JSON.stringify(student);
        let data = '{ "username": "'+args.username+'"}';
        fs.writeFileSync('config.json', data)
    }
}
module.exports = {
    ImportDerivedMetrics : function(fileName,engagement,stress,emoValence,hr,apm,mouseMoves,){
        return ImportDerivedMetrics(fileName,engagement,stress,emoValence,hr,apm,mouseMoves)
    },
    storeProgress : function(fileName, date, avgEngagement, avgStress, avgEmoValence, avgHR,avgApm, avgMouseMoves,lolAPI) {
        return storeProgress(fileName, date, avgEngagement, avgStress, avgEmoValence, avgHR, avgApm, avgMouseMoves, lolAPI);
    },
    getConfigJson : function(username){ return getConfigJson(username)},
    setConfigJson: function(args){return getConfigJson(args)},
    getProgressData : function(username,date,engagement,stress,emoValence,hr,apm,mouseMoves,/*gameApi,*/kills, deaths, assists){ return getProgressReportData(username,date,engagement,stress,emoValence,hr,apm,mouseMoves,/*gameApi,*/ kills, deaths, assists)},
    getGameMetricsData : function(username, record){ return getGameMetricsData(username,record);},
    emitter : function() { return em;}
}
