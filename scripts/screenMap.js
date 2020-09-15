const d3 = require('d3');
const inputInteraction = require('../scripts/newclickStrokes');

// Gets screen size
let ogHeight = window.innerHeight;
let ogWidth = screen.width;

// gets size of Tempest's report screen square (copied from HTML)
let smolHeight = ogHeight*0.936*0.335;
let smolWidth = ogWidth*0.298;; 

// Defines scaler to adapt screen size to screen square in Tempest's report
let heightScale = d3.scaleLinear().domain([0, ogHeight]).range([0, smolHeight]);
let widthScale = d3.scaleLinear().domain([0, ogWidth]).range([0, smolWidth]);


function getClickMap(timeStamp) {
    // INPUT: STRING of milliseconds or STRING array with interval of milliseconds
    // example: getClickMap("2000") or getClickMap(["1000", "5000"])
    // Draws a heatmap of mouseclicks!

    // let dataSet = [[683, 360, 1], [1366, 0, 1], [0, 720, 1], [0, 0, 1], [1366, 720, 1]];
    let dataSet;
    
    // Gets the Timeline from IOinteraction
    let timeLine = inputInteraction.getTimeline();

    // Checks if we have an interval
    if (Array.isArray(timeStamp)) {
        dataSet = getInterval(timeStamp[0], timeStamp[1], "mousedown")
    // Checks if the timestamp exists
    } else if (timeLine.hasOwnProperty(timeStamp)) {
        dataSet = timeLine[timeStamp]["mousedown"];
    } else {
        dataSet = [];
    }

    // Makes the coordinates with more clicks appear above the other ones in the SVG 
    dataSet.sort(function(a,b) {
        return a[2]-b[2]
    });

    // Gets the number of clicks for each coordinate
    let intensity = dataSet.map((num) => num[2]);
    
    // Computes maximum and minimun number of clicks in total
    let maxIntensity = Math.max(...intensity);
    let minIntensity = Math.min(...intensity);

    // 0 clicks -> 1, Max number of clicks -> 1
    let colorScale = d3.scaleLinear().domain([0, maxIntensity]).range([0, 1]);
    // Coordinates with less clicks will have smaller circles than coordinates with more clicks
    let radScale = d3.scaleLinear().domain([minIntensity, maxIntensity]).range([6.5, 11.5]);

    // Gets the SVG where we will draw our stuff
    let svgContainer = d3.select('#IOmap');

    // Draws the dataSet as circles on the SVG
    let circles = svgContainer.selectAll("circle")
                                .data(dataSet)
                                .enter()
                                .append("circle");

    // Sets the properties of the circles
    let circleAttributes = circles
                            .attr("cx", (d, i) => widthScale(d[0]))
                            .attr("cy", (d, i) => heightScale(d[1]))
                            // more clicks => bigger radius
                            .attr("r", (d, i) =>  radScale(d[2]))
                            // less clicks => blue, more clicks => red, moderate clicks => green
                            .attr("fill", (d, i) => d3.interpolateHslLong("blue", "red")(colorScale(d[2])));

}

function getMouseMap (timeStamp) {
    // INPUT: STRING of milliseconds or STRING array with interval of milliseconds
    // example: getClickMap("2000") or getClickMap(["1000", "5000"])
    // Draws map of cursor!

    let dataSet;
    let timeLine = inputInteraction.getTimeline();

    // Checks if input is an interval
    if (Array.isArray(timeStamp)) {
        dataSet = getInterval(timeStamp[0], timeStamp[1], "m")
    // Checks if the timestamp exists
    } else if (timeLine.hasOwnProperty(timeStamp)) {
        dataSet = timeLine[timeStamp]["m"];
    } else {
        dataSet = [];
    }

    // Gets the SVG where we will draw
    let svgContainer = d3.select('#IOmap');

    // Defines the drawing as a line
    let lineFunction = d3.line()
        .x((d, i) => widthScale(d[0]))
        .y((d, i) => heightScale(d[1]));

    // Draws the line using our dataSet
    let lineGraph = svgContainer.append("path")
                            .attr("d", lineFunction(dataSet))
                            // The line will be red!
                            .attr("stroke", "rgb(255,0,0)")
                            .attr("stroke-width", 3)
                            .attr("fill", "none");

}

// Array to save which keys have been drawn
let activeKeys = [];
function getKeyMap (timeStamp) {
    // INPUT: STRING of milliseconds or STRING array with interval of milliseconds
    // example: getClickMap("2000") or getClickMap(["1000", "5000"])
    // Draws keyboard with pressed keys in yellow

    // Hides the webcam when drawing the keyboard
    d3.select('#camera').style("display", "none");
    // Shows the keyboard!
    d3.select('#svg4109').style("display", "block");    

    let dataSet;
    let timeLine = inputInteraction.getTimeline();

    // Checks if input is an interval
    if (Array.isArray(timeStamp)) {
        dataSet = getInterval(timeStamp[0], timeStamp[1], "keyup")
    // Checks if the timestamp exists
    } else if (timeLine.hasOwnProperty(timeStamp)) {
        dataSet = timeLine[timeStamp]["keyup"];
    } else {
        dataSet = [];
    }

    // Goes through all clicked keys
    dataSet.forEach((element, index) => {

        // Gets Rawcode of the key
    	let code = element[1];
        // It was drawn, so it becomes an active key
        activeKeys.push(code);
        // Said key becomes yellow
        d3.select("#raw"+code).style('fill', "yellow");
        // Gets location of the pressed key
		let keyPos = document.getElementById("raw"+code).getBBox();
        // Adds the content of the Key
		d3.select("#svg4109").select("g").append("text")
											.style("font-size", "22px")
											.attr("x",keyPos.x+6)
											.attr("y",keyPos.y+23)
											.text(String.fromCharCode(code));
    });
    
}

function clearKeyboard(wCamera) {
    // INPUT: BOOLEAN if we want the camera back or not

    // All keys that were yellow return to white
    activeKeys.forEach((element) => {
        d3.select("#raw"+element).style('fill', "white");
        d3.select("#svg4109").empty();
    })

    // Also removes the letters/symbols of the keys
    d3.select("#svg4109").selectAll("text").remove();
    
    // if wCamera is True, the keyboard is hidden and we get the camera back
    if (wCamera) {
        d3.select('#camera').style("display", "block");
        d3.select('#svg4109').style("display", "none");  
    }

    // Since all keys are back to white now, no keys are active
    activeKeys = [];
}

function createBoard () {
    // Adds a SVG element to Tempest that covers the screen grab!
    d3.select("#main").append("svg")
                        .style("width","29.8%")
                        .style("height","33.5%")
                        .style("left","20%")
                        .style("position","absolute")
                        .style('background-color',"rgba(0,0,0,0)")
                        .attr('id', 'IOmap');
}

function clearBoard () {
    // Clears all clicks and drawings!
    d3.select("#IOmap").selectAll("*").remove();

}

function clearAll(wCamera) {
    // Clears both keyboard and screen grab
    clearKeyboard(wCamera);
    clearBoard();
}


function getInterval(timeStart, timeEnd, eventType) {
	// INPUT: STRING of time, STRING of time, STRING of event ("m", "mousedown" or "keyup")

    // Converts the time to integers and from milliseconds to seconds
    let start = parseInt(timeStart)/1000;
	let end = parseInt(timeEnd)/1000;

	let timeLine = inputInteraction.getTimeline();
	let i = start;
	let answer = [];

    // Go through the selected time interval in the timeline
    // Collect all occurences of the selected eventType within that interval 
	while (i <= end) {
		let key = (i*1000).toString();
		if (timeLine.hasOwnProperty(key)) {
            // Must create Deep Clone otherwise the analysis also changes the timeline!!!
			let data = JSON.parse(JSON.stringify(timeLine[key][eventType]));
			answer = answer.concat(data);
		}
        i++;
	}

    // If we are dealing with keyup or mousedown, adds up all equal occurences
    // [[120, 350, 2], [120, 350, 5], [110, 400, 0]] => [[120, 350, 7], [110, 400, 0]] 
	if (eventType === 'keyup' || eventType === 'mousedown') {
		let j = 0;
		while (j < answer.length) {
			let w = j+1;
			while (w < answer.length) {
				if (answer[w][0] == answer[j][0] && answer[w][1] == answer[j][1]) {
					answer[j][2] = answer[j][2]+answer[w][2];
					answer.splice(w, 1);		
				} else {w++;}	
			}
			j++;
		}
	}

	return answer
}

module.exports = {
	getClickMap: function(timestamp) {return getClickMap(timestamp)},
	getMouseMap: function(timestamp) {return getMouseMap(timestamp)},
	getKeyMap: function(timestamp) {return getKeyMap(timestamp)},
	clearBoard: function() {return clearBoard()},
	createBoard: function() {return createBoard()},
	clearKeyboard: function(wCamera) {return clearKeyboard(wCamera)},
	clearAll: function(wCamera) {return clearAll(wCamera)},
	getInterval: function(timeStart, timeEnd, eventType) {return getInterval(timeStart, timeEnd, eventType)},
}