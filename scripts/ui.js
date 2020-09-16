//open url using default os browser:
function openBrowser(url){
    const {shell} = require('electron');
    shell.openExternal(url);
}
// ui setup:
function toggleMenu(menuButton) {
    var opacity = d3.select("#mySidenav").selectAll("a").style("opacity");
    if(opacity == "1"){ menuButton.classList.toggle("change"); closeMenu();}
    else if(opacity =="0"){ menuButton.classList.toggle("change"); openMenu();}

}
//var setupDone=false;
function toggleHelper(){
    closeTrainingsMockup();
    if(d3.select("#guideMenu").style("display")=="block"){
        d3.select("#guideMenu").style("display", "none");
        if(viewMode === "History"){
            updateHeaderText("📈    Progress History   📈");
        }else if (viewMode === "Record"){

            updateHeaderText("🏎️    "+new Date(recordName.replace(/_/g,":")).toGMTString().slice(0,-4)+"  Race Report    🏎️");
        }else if(viewMode === "Live") {
            updateHeaderText('🎥    Recording...    🎥')
        }
    }else{
        d3.select("#guideMenu").style("display", "block");
        d3.select("#settingsMenu").style("display","none");
        updateHeaderText('🌀    Start Menu    🌀')
    }
}
function closeHelper(){
    d3.select("#guideMenu").style("display", "none");
}
function openMenu() {
    console.log(d3.select(".hamburger-btn").style("width"));
    d3.select("#mySidenav").transition().style("width","14.5vw").duration(200);
    d3.select(".hamburger-btn").style("width","9vw").transition().style("width","14.5vw").duration(200);


//    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
    d3.select("#mySidenav").style("border-right" ,"outset darkgrey");

    d3.select("#mySidenav").selectAll("a").transition().delay(400).style("opacity","1").duration(200);


}
/**
 * Set the width of the side navigation to 0
 * & the left margin of the page content to 0, and the background color of body to white
 */
function closeMenu() {
    d3.select("#mySidenav").selectAll("a").style("opacity","0");
    d3.select("#mySidenav").style("border-right" ,"none");
    d3.select(".hamburger-btn").transition().style("width","9vw");
    document.getElementById("mySidenav").style.width = "0";
}
/**
 *
 */
function toggleSettings(){
    if(viewMode==="Live")return;
    if(d3.select("#settingsMenu").style("display")=="block"){
        closeSettingsUpdateHeader();
    }else{
        d3.select("#settingsMenu").style("display","block");
        updateHeaderText('⚙️ Settings️ ⚙️');
    }
}
function closeSettingsUpdateHeader(){
    d3.select("#settingsMenu").style("display","none");
    if(viewMode === "History"){
        updateHeaderText("📈    Progress History   📈");
    }else if (viewMode === "Record"){
        updateHeaderText("🏎️    "+new Date(recordName.replace(/_/g,":")).toGMTString().slice(0,-4)+"  Race Report    🏎️");
    }else if(viewMode === "Live"){
        updateHeaderText('🎥    Recording...    🎥');
    }else if (viewMode === "Start"){
        updateHeaderText('🌀    Start Menu    🌀');
    } else if (viewMode === "Trainings") {
        updateHeaderText('⏱    Trainings    ⏱');
    }
}
/**
 *
 */
function applySettings(recordCamera, username){
    closeSettingsUpdateHeader();
    let file = editJsonFile(workingDir+"/config.json");
    file.set("selectedUser",username);
    file.set("camera",recordCamera);
    file.save();
    getProgressHistory();
}
/**
 *
 */
function cancelSettings(){
    closeSettingsUpdateHeader();
    username = fileIO.getConfigJson().selectedUser;
    d3.select("#usrId").text(username);
    recordCamera = fileIO.getConfigJson().camera;
    document.getElementById('usernameinput').value=username;
    if(recordCamera){
        setRecordingDevices(d3.select("#cameraGrabDropbtn").selectAll("*").nodes()[1]);
    }else{
        setRecordingDevices(d3.select("#cameraGrabDropbtn").selectAll("*").nodes()[2]);
    }
}
/**
 * This method expands/contracts the Settings menu dropdown options (ie: Low, Medium, High VideoQuality)
 * @param dropdownOption is an HTML button we want to expand
 */
function onOffHandler(dropdownOption) {

    var expandableOpts =  d3.select(dropdownOption).select("div");
    console.log("on off handler")
    console.log(dropdownOption)
    console.log(expandableOpts)
    if(expandableOpts.style("display")=="block"){
        expandableOpts.style("display","none");
    }else{
        expandableOpts.style("display","block");
    }


}
function toggleTrainingsMockup(){
    if(d3.select("#trainingPage").style("display")=="block"){
        closeTrainingsMockup();
        if(viewMode === "History"){
            updateHeaderText("📈    Progress History   📈");
        }else if (viewMode === "Record"){
            updateHeaderText("🏎️    "+new Date(recordName.replace(/_/g,":")).toGMTString().slice(0,-4)+"  Race Report    🏎️");
        }else if(viewMode === "Live"){
            updateHeaderText('🎥    Recording...    🎥');
        }else if (viewMode === "Start"){
            updateHeaderText('🌀    Start Menu    🌀');
        } else if (viewMode === "Trainings") {
            updateHeaderText('⏱    Trainings    ⏱');
        }
    }else{
        openTrainingsMockup();
    }
}
function closeTrainingsMockup(){
    d3.select("#trainingPage").style("display","none");
}
function openTrainingsMockup(){
    if(viewMode!=="Live"){
        updateHeaderText('⏱    Trainings    ⏱');
        viewMode = "Trainings";
        d3.select("#trainingPage").style("display","block");
        d3.select("#settingsMenu").style("display","none");
        d3.select("#guideMenu").style("display", "none");
        d3.select("#main").style("display","none")
    }

}
function updateHeaderText(message){
    d3.select("#alert_txt").text(message);

}
function getSwProgressHistoryMetrics(){
    return [{
            label: "Actions Per Minute",
            value: 1
        },
        {
            label: "Mouse Activity",
            value: 2
        },
        {
            label: "Fatigue",
            value: 3
        }
    ];
}
function getAllProgressHistoryMetrics(){
    return [{
            label: "Engagement",
            value: 1
        },
        {
            label: "Emotional Valence",
            value: 2
        },
        {
            label: "Stress",
            value: 3
        },{
            label: "Sleepiness",
            value: 4
        },
        {
            label: "Focus",
            value: 5
        },
        {
            label: "Memory Load",
            value: 6
        },
        {
            label: "Heart Rate",
            value: 7
        },
        {
            label: "HRV",
            value: 8
        },
        {
            label: "Actions Per Minute",
            value: 9
        },
        {
            label: "Mouse Activity",
            value: 10
        },
        {
            label: "Fatigue",
            value: 11
        }
    ];
}
function getAllGameReportMetrics(){
    return [{
        label: "Engagement",
        value: 1
        },
        {
            label: "Emotional Valence",
            value: 2
        },
        {
            label: "Stress",
            value: 3
        },
        {
            label: "Sleepiness",
            value: 4
        },
        {
            label: "Focus",
            value: 5
        },
        {
            label: "Memory Load",
            value: 6
        },
        {
            label: "Heart Rate",
            value: 7
        },
        {
            label: "HRV",
            value: 8
        },
        {
            label: "Actions Per Minute",
            value:9
        },
        {
            label: "Mouse Activity",
            value: 10
        },
        {
            label: "Fatigue",
            value: 11
        }
    ];
}


function getSwGameReportMetrics(){
    return [{
            label: "Actions Per Minute",
            value: 1
        },
        {
            label: "Mouse Activity",
            value: 2
        },
        {
            label: "Fatigue",
            value: 3
        }
    ];
}
function setRecordingDevices(self) {
    console.log("set reccording devices")
    var gparent = self.parentNode.parentNode;
    if(self.textContent=="Enabled"){
        gparent.childNodes[0].nodeValue="Enabled ▼ ";
        recordCamera=true;
        // /*if(gparent.id=="screenGrabDropbtn"){screenGrab=true;}else*/ if(gparent.id=="cameraGrabDropbtn"){camGrab=true;}/*else{microphone = true; }*/
    }else{
        self.parentNode.parentNode.childNodes[0].nodeValue="Disabled ▼ ";
        recordCamera=false;
        // /*if(gparent.id=="screenGrabDropbtn"){screenGrab=false;}else*/ if(gparent.id=="cameraGrabDropbtn"){camGrab=false;}/*else{microphone = false; }*/
    }
}

function plotRacerUI(racerLst){
    function remove(el){
        console.log("remove!")
        console.log(el)
    }
    let usernames = [];
    racerLst.forEach((e)=>{usernames.push(e.username)});
    let racerUI = d3.select("#racerUI")
    racerUI.selectAll("*").remove();
    racerUI.append("input").attr("type","text").attr("id","searchRacer").attr("placeholder","Search for racers..");
    racerUI.append("ul").attr("id","racerList");
    usernames.forEach(d => {
        let li = d3.select("#racerList").append("li")
            .attr("class","btn")
            .text(d)
            .on("click", () =>{
                console.log("selected " +d)
                d3.select("#usrId").text(d);
                username = d;
                racerLst.forEach((r)=>{
                    if(username==r.username){
                        userId = r.id;
                    }
                })
            });
        var span = document.createElement("SPAN");
        var txt = document.createTextNode("\u00D7");
        span.className = "close";
        span.appendChild(txt);
        li.node().appendChild(span);
        // span.onclick = remove(this)
        console.log(span)
        span.onclick = (e) => {
            e.stopPropagation()
            const opts = {
                type: 'question',
                buttons: ['Delete', 'Cancel'],
                defaultId: 2,
                title: 'Confirm...',
                message: 'Are you sure you want to delete this racer?',
                detail: "This action can't be undone!",
            };
            const dialog = require('electron').remote.dialog;
            dialog.showMessageBox(null, opts, (response, checkboxChecked) => {
                console.log(response);
                if(response==0){
                    const request = require('request');
                    let aux = [];
                    racerLst.forEach((e)=>{console.log(e.id);
                        if(e.username!=d) aux.push(e.id)}
                    )
                    request.patch(
                        {
                            url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/org_list/"+orgId+"/",
                            headers: {Authorization:"Token "+tok},
                            formData: {"user_list":aux}
                        }, function(err, res, body) {
                            if(err){ console.log(err); newRacer();}
                            org = JSON.parse(body);
                            racerList = racerLst.filter(racer => racer.username != d)

                            li.remove();
                            if (username == d){
                                username = "";
                                let file = editJsonFile(workingDir+"/config.json");
                                file.set("selectedUser","");
                                file.save();
                            }
                        });

                }
            });
        }
    });
    racerUI.append("input").attr("type","text").attr("id","addRacerInput").attr("placeholder","New racer name...");
    racerUI.append("span").attr("class","addBtn").text("Add").on("click",newRacer)

    d3.select("#settingsMenu").on("keyup",FilterRacers);
    d3.select("#orgId").text(org.name);
    d3.select("#usrId").text(username);
}
function FilterRacers() {
    // Declare variables
    var input, filter, ul, li, a, i, txtValue;
    input = document.getElementById('searchRacer');
    filter = input.value.toUpperCase();
    ul = document.getElementById("racerList");
    li = ul.getElementsByTagName('li');
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        a = li[i];
        txtValue = a.textContent || a.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }

}
function newRacer() {
    var li = document.createElement("li");
    li.className = "btn";
    var inputValue = document.getElementById("addRacerInput").value;
    var t = document.createTextNode(inputValue);
    li.appendChild(t);
    if (inputValue === '') {
        alert("You must write something!");
    } else {
        li.onclick = () => {
            d3.select("#usrId").text(inputValue);
            username = inputValue;
            racerList.forEach((r)=>{
                if(username==r.username){
                    userId = r.id;
                }
            })
        };
        document.getElementById("racerList").appendChild(li);
    }
    document.getElementById("addRacerInput").value = "";

    var span = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    li.appendChild(span);

    span.onclick = (e) => {
        e.stopPropagation()
        const opts = {
            type: 'question',
            buttons: ['Delete', 'Cancel'],
            defaultId: 2,
            title: 'Confirm...',
            message: 'Are you sure you want to delete this racer?',
            detail: "This action can't be undone!",
        };
        const dialog = require('electron').remote.dialog;
        dialog.showMessageBox(null, opts, (response, checkboxChecked) => {
            console.log(response);
            if(response==0){
                const request = require('request');
                let aux = [];
                racerList.forEach((e)=>{console.log(e.id);
                    if(e.username!=inputValue) aux.push(e.id)}
                )
                request.patch(
                    {
                        url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/org_list/"+orgId+"/",
                        headers: {Authorization:"Token "+tok},
                        formData: {"user_list":aux}
                    }, function(err, res, body) {
                        if(err){ console.log(err); newRacer();}
                        org = JSON.parse(body);
                        racerList = racerList.filter(racer => racer.username != inputValue)

                        li.remove();
                        if (username == inputValue){
                            username = "";
                            let file = editJsonFile(workingDir+"/config.json");
                            file.set("selectedUser","");
                            file.save();
                        }
                    });

            }
        });    }

    const request = require('request');
    //create new user
    request.post(
        {
            url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/create_user/",
            headers: {Authorization:"Token "+tok},
            formData: {username:inputValue,password:inputValue+"*mast3r"}
        }, function(err, res, body) {
            if(err){ console.log(err); newRacer();}
            // add new user to org
            let jsonBody = JSON.parse(body);
            username = jsonBody.username;
            userId = jsonBody.id;
            let aux = [];
            racerList.forEach((e)=>{aux.push(e.id)})
            aux.push(userId)
            request.patch(
                {
                    url: "http://emotai.him3efvi97.eu-west-1.elasticbeanstalk.com/home/org_list/"+orgId+"/",
                    headers: {Authorization:"Token "+tok},
                    formData: {"user_list":aux}
                }, function(err, res, body) {
                    if(err){ console.log(err); newRacer();}
                    console.log(body)
                    org = JSON.parse(body);
                    racerList.push({"id":userId,"username":username})

                });

        })

}
