const events = require('events')
var brush, zoom;
var xRAW_wide;
var currentXScale;
const em = new events.EventEmitter();
let margin = {top: 20.16, right: 10, bottom: 21.599999999999998, left: 44};

function plotLineChart(svg_id, dataset, sampleRate, name = "Chart", width, height, xxDomain = [0, dataset.length - 1], yyDomain = [d3.max(dataset), d3.min(dataset)], color ="#00ffb0") {
    if (dataset == undefined || dataset.length < 2 || svg_id === "") return;

    //svg id needs to start with hashtag
    if (svg_id[0] !== "#") {
        svg_id = "#" + svg_id;
    }
    //if we're dealing with an horizontal line:
    if (yyDomain[0] === yyDomain[1]) {
        yyDomain[1]++;
    }
    //get coloring according to chart 1 or 2
    // setup scales
    var xScale = d3.scaleLinear().domain(xxDomain).range([0, width]);
    var yScale = d3.scaleLinear().domain(yyDomain).range([0, height]);
    // Setup line function
    var line = d3.line()
        .x(function (d, i) {return xScale(i);})
        .y(function (d, i) {return yScale(d);})
        .curve(d3.curveMonotoneX);

    let domain = [0, 100];
    let yUnits = "Magnitude";
    switch(name) {
        case "Heart Rate":
            yUnits = "BPM";
            break;
        case "HRV":
            yUnits = "Milliseconds";
            break;
        case "Creep Score":
            yUnits = "CSM"
            break;
        case "Gold":
            yUnits = ""
            break;
        case "Actions Per Minute":
            yUnits = "APM"
            break;
    }
    if(color === 'gradient'){
        console.log("plot with gradient")
        if (name === "Emotional Valence") {
            console.log("metric = emo val")
            domain = [-1, 1];
            d3.select(svg_id).append("linearGradient")
                .attr("id", "yesThisIsEmoValGradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", 120)
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "#00FFB0"},
                    {offset: "40%", color: "#00FFB0"},
                    {offset: "60%", color: "#FF0051"},
                    {offset: "100%", color: "#FF0051"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });
            color = 'url(#yesThisIsEmoValGradient)'
        } else if (name === "Heart Rate" || name === "Creep Score" || name === "Gold" || name === "Actions Per Minute" || name === "HRV") {
            domain = [d3.min(dataset), d3.max(dataset)];
            if(name === "Heart Rate"){
                console.log("metric = hr")

                d3.select(svg_id).append("linearGradient")
                    .attr("id", "yesThisIsHRGradient")
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", 0).attr("y1", 0)
                    .attr("x2", 0).attr("y2", 120)
                    .selectAll("stop")
                    .data([
                        {offset: "0%", color: "#FF0051"},
                        // {offset: "33%", color: "#FF0051"},
                        // {offset: "33%", color: "#FFAE00"},
                        // {offset: "66%", color: "#FFAE00"},
                        {offset: "50%", color: "#FFAE00"},
                        // {offset: "66%", color: "#00FFB0"},
                        {offset: "100%", color: "#00FFB0"}
                    ])
                    .enter().append("stop")
                    .attr("offset", function(d) { return d.offset; })
                    .attr("stop-color", function(d) { return d.color; });
                color = 'url(#yesThisIsHRGradient)'
                yUnits = "Beats per minute"
            }else if(name === 'HRV'){
                console.log("metric = hrv")

                d3.select(svg_id).append("linearGradient")
                    .attr("id", "yesThisIsHRVGradient")
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", 0).attr("y1", 0)
                    .attr("x2", 0).attr("y2", 120)
                    .selectAll("stop")
                    .data([
                        {offset: "0%", color: "#00FFB0"},
                        // {offset: "33%", color: "#00FFB0"},
                        // {offset: "33%", color: "#FFAE00"},
                        {offset: "50%", color: "#FFAE00"},
                        // {offset: "66%", color: "#FFAE00"},
                        // {offset: "66%", color: "#FF0051"},
                        {offset: "100%", color: "#FF0051"}
                    ])
                    .enter().append("stop")
                    .attr("offset", function(d) { return d.offset; })
                    .attr("stop-color", function(d) { return d.color; });
                color = 'url(#yesThisIsHRVGradient)'
                yUnits = "Milliseconds"
            }
        }else if(name === "Stress"){
            console.log("metric = stress")

            d3.select(svg_id).append("linearGradient")
                .attr("id", "yesThisIsStressGradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", 120)
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "#FF0029"},
                    // {offset: "33%", color: "#FF0029"},
                    // {offset: "33%", color: "#DB006A"},
                    {offset: "50%", color: "#DB006A"},
                    // {offset: "66%", color: "#DB006A"},
                    // {offset: "66%", color: "#B60083"},
                    {offset: "100%", color: "#B60083"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });
            color = 'url(#yesThisIsStressGradient)'
        }else if(name === "MemLoad"){
            console.log("metric = mem load")

            d3.select(svg_id).append("linearGradient")
                .attr("id", "yesThisIsMemLoadGradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", 120)
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "#0029FF"},
                    // {offset: "33%", color: "#0029FF"},
                    // {offset: "33%", color: "#2445DB"},
                    // {offset: "66%", color: "#2445DB"},
                    {offset: "50%", color: "#2445DB"},
                    // {offset: "66%", color: "#493AB6"},
                    {offset: "100%", color: "#493AB6"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });
            color = 'url(#yesThisIsMemLoadGradient)'
        }else if(name === "Sleepiness"){
            console.log("metric = sleepiness")

            d3.select(svg_id).append("linearGradient")
                .attr("id", "yesThisIsSleepGradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", 120)
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "#FFAE00"},
                    // {offset: "33%", color: "#FFAE00"},
                    // {offset: "33%", color: "#DB9524"},
                    {offset: "50%", color: "#DB9524"},
                    // {offset: "66%", color: "#DB9524"},
                    // {offset: "66%", color: "#B67C49"},
                    {offset: "100%", color: "#B67C49"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });
            color = 'url(#yesThisIsSleepGradient)';
        }else if(name === "Engagement"){
            d3.select(svg_id).append("linearGradient")
                .attr("id", "yesThisIsEngagementGradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", 0).attr("y2", 120)
                .selectAll("stop")
                .data([
                    {offset: "0%", color: "#00FFB0"},
                    // {offset: "33%", color: "#00FFB0"},
                    // {offset: "33%", color: "#00DBBB"},
                    // {offset: "66%", color: "#00DBBB"},
                    {offset: "50%", color: "#00DBBB"},
                    // {offset: "66%", color: "#00B6C7"},
                    {offset: "100%", color: "#00B6C7"}
                ])
                .enter().append("stop")
                .attr("offset", function(d) { return d.offset; })
                .attr("stop-color", function(d) { return d.color; });
            color = 'url(#yesThisIsEngagementGradient)';
        }
    }

    if (d3.select(svg_id).select("g").empty()) { //if there was no linechart plotted beforehand
        //create g with transform for axis labels and title
        var svg = d3.select(svg_id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("color", color);
        //append clip path:
        svg.append("defs").append("clipPath")
            .attr("id", "clip" + svg_id.slice(1))
            .append("rect")
            .attr("height", "24vh")
            .attr("width", "95.22%")
        // append x axis:

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).ticks(9)
                .tickFormat(function (d) {
                    return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
                }));
        //append y axis
        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(d3.scaleLinear().domain(domain).range([height, 0])))
            .append("text")
            .attr("fill", color)
            .attr("y", "-1em")
            .attr("x", "-2.7em")
            .attr("text-anchor", "start")
            .text(yUnits);
        // append svg path element describing our line:
        svg.append("g")
            .attr("clip-path", "url(#clip" + svg_id.slice(1) + ")")
            .append("path")
            .attr("class", "dataLine")
            .datum(dataset)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    } else { //update linechart in previously plotted svg
        //update line function and its data
        d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", line);
        //update x axis
        d3.select(svg_id).select(".xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).ticks(9)
                .tickFormat(function (d) {
                    return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
                }));
        //update y axis
        d3.select(svg_id).select(".yAxis")
            .call(d3.axisLeft(d3.scaleLinear().domain(domain).range([height, 0])));
        //erased lines below as we should only need to do this once
        // d3.select("#clip"+svg_id.slice(1))
        //     .select("rect")
        //     .attr("width", width)
        //     .attr("height", height);
        // .call(d3.axisBottom(xScale)/* .tickFormat((d)=>{return (d/sampleRate).toFixed(1);})*/);

    }
}

function plotRtLineChart(svg_id, dataset, sampleRate, xxDomainStart = 0, xxDomainEnd = dataset.length, yyDomainStart = d3.min(dataset), yyDomainEnd = d3.max(dataset)) {
    if (dataset == undefined || svg_id == "") return;
    if (dataset[0].length == 2) {
        var auxDataset = [];
        dataset.forEach((el) => {
            auxDataset.push(el[1])
        });
        dataset = auxDataset;
        xxDomainEnd = dataset.length;
        yyDomainStart = d3.min(dataset);
        yyDomainEnd = d3.max(dataset);
    }
    if (svg_id[0] != "#") {
        svg_id = "#" + svg_id;
    }
    if (yyDomainStart == yyDomainEnd) {
        yyDomainEnd++;
    }
    var width = d3.select(svg_id).node().clientWidth - margin.left - margin.right;
    var height = d3.select(svg_id).node().clientHeight - margin.top - margin.bottom;

// setup scales
    var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd]).range([0, width]);
    var yScale = d3.scaleLinear().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    if (svg_id == "#EEG4" || svg_id == "#EEG3") {
        yScale = d3.scaleLog().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    }
// define line function (returns svg path)
// var line = d3.line()
//                .x(function (d, i) { return xScale(i);})
//                .y(function (d, i) { return yScale(d);});

    if (d3.select(svg_id).select("g").empty()) {
        //create
        var svg = d3.select(svg_id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("color", "#00ffb0");
        svg.append("defs").append("clipPath")
            .attr("id", "clip" + svg_id.slice(1))
            .append("rect")
            .attr("height", "24vh")
            .attr("width", "95.22%")
        // append x axis:
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).tickFormat((d) => {
                return (d / sampleRate).toFixed(1);
            }))
            .append("text")
            .text("Seconds");
        // append y axis:
        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("fill", "#00ffb0")
            .attr("y", "-1em")
            .attr("x", "-2.7em")
            .attr("text-anchor", "start")
            .text("Magnitude");
        // append svg path element describing our line:
        svg.append("g")
            .attr("clip-path", "url(#clip" + svg_id.slice(1) + ")").append("path")
            .attr("class", "dataLine")
            .datum(dataset)
            .attr("fill", "#00ffb0")
            .attr("fill-opacity", 0.1)
            .attr("stroke", "#00ffb0")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
        // 12. Appends a circle for each datapoint
        // svg.selectAll(".dot")
        //     .data(dataset)
        //     .enter().append("circle") // Uses the enter().append() method
        //     .attr("class", "dot") // Assign a class for styling
        //     .attr("cx", function(d, i) { return xScale(i) })
        //     .attr("cy", function(d) { return yScale(d.y) })
        //     .attr("r", 5);
    } else {
        //update
        if (dataset.length < sampleRate * 6) {
            d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", line);
            d3.select(svg_id).select(".xAxis")
                .call(d3.axisBottom(xScale)/* .tickFormat((d)=>{return (d/sampleRate).toFixed(1);})*/);
            d3.select(svg_id).select(".yAxis")
                .call(d3.axisLeft(yScale));
        } else {
            var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd - sampleRate]).range([0, width]);
            var line = d3.line()
                .x(function (d, i) {
                    return xScale(i);
                })
                .y(function (d, i) {
                    return yScale(d);
                });
            d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", line);
            d3.select(svg_id).select(".yAxis").call(d3.axisLeft(yScale))
            d3.select(svg_id).select(".xAxis").call(d3.axisBottom(xScale))
            d3.select(svg_id).select(".dataLine").attr("transform", null)
                .transition().duration(800)
                .attr("transform", "translate(" + xScale(-sampleRate) + ")");
        }

    }

}

function plotRtLineChart(svg_id, dataset, sampleRate, xxDomainStart = 0, xxDomainEnd = dataset.length, yyDomainStart = d3.min(dataset), yyDomainEnd = d3.max(dataset)) {
    if (dataset == undefined || svg_id == "") return;
    if (dataset[0].length == 2) {
        var auxDataset = [];
        dataset.forEach((el) => {
            auxDataset.push(el[1])
        });
        dataset = auxDataset;
        xxDomainEnd = dataset.length;
        yyDomainStart = d3.min(dataset);
        yyDomainEnd = d3.max(dataset);
    }
    if (svg_id[0] != "#") {
        svg_id = "#" + svg_id;
    }
    if (yyDomainStart == yyDomainEnd) {
        yyDomainEnd++;
    }
    var width = d3.select(svg_id).node().clientWidth - margin.left - margin.right;
    var height = d3.select(svg_id).node().clientHeight - margin.top - margin.bottom;

// setup scales
    var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd]).range([0, width]);
    var yScale = d3.scaleLinear().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    if (svg_id == "#EEG4" || svg_id == "#EEG3") {
        yScale = d3.scaleLog().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    }
// define line function (returns svg path)
// var line = d3.line()
//                .x(function (d, i) { return xScale(i);})
//                .y(function (d, i) { return yScale(d);});

    if (d3.select(svg_id).select("g").empty()) {
        //create
        var svg = d3.select(svg_id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("color", "#00ffb0");
        svg.append("defs").append("clipPath")
            .attr("id", "clip" + svg_id.slice(1))
            .append("rect")
            .attr("height", "95%")
            .attr("width", "95.22%")
        // append x axis:
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).tickFormat((d) => {
                return (d / sampleRate).toFixed(1);
            }))
            .append("text")
            .text("Seconds");
        // append y axis:
        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("fill", "#00ffb0")
            .attr("y", "-1em")
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Magnitude");
        // append svg path element describing our line:
        svg.append("g").attr("clip-path", "url(#clip" + svg_id.slice(1) + ")").append("path")
            .attr("class", "dataLine")
            .datum(dataset)
            .attr("fill", "#00ffb0")
            .attr("fill-opacity", 0.1)
            .attr("stroke", "#00ffb0")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
        // 12. Appends a circle for each datapoint
        // svg.selectAll(".dot")
        //     .data(dataset)
        //     .enter().append("circle") // Uses the enter().append() method
        //     .attr("class", "dot") // Assign a class for styling
        //     .attr("cx", function(d, i) { return xScale(i) })
        //     .attr("cy", function(d) { return yScale(d.y) })
        //     .attr("r", 5);
    } else {
        //update
        if (dataset.length < sampleRate * 6) {
            d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", line);
            d3.select(svg_id).select(".xAxis")
                .call(d3.axisBottom(xScale)/* .tickFormat((d)=>{return (d/sampleRate).toFixed(1);})*/);
            d3.select(svg_id).select(".yAxis")
                .call(d3.axisLeft(yScale));
        } else {
            var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd - sampleRate]).range([0, width]);
            var line = d3.line()
                .x(function (d, i) {
                    return xScale(i);
                })
                .y(function (d, i) {
                    return yScale(d);
                });
            d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", line);
            d3.select(svg_id).select(".yAxis").call(d3.axisLeft(yScale))
            d3.select(svg_id).select(".xAxis").call(d3.axisBottom(xScale))
            d3.select(svg_id).select(".dataLine").attr("transform", null)
                .transition().duration(800)
                .attr("transform", "translate(" + xScale(-sampleRate) + ")");
        }

    }

}

function plotProgressChart(svg_id, dataset, sampleRate, name = "Chart", width, height, xxDomain=d3.extent(dataset, function (d) {return new Date(d['date']);}), yyDomain = [d3.max(dataset), d3.min(dataset)]) {
    if (dataset == undefined || dataset.length < 2 || svg_id == "") return;
    name = getAttrFromName(name);

    var color = "#00ffb0";
    if (svg_id == "#CHART2") {
        color = "#d31359"
    }
    var xScale = d3.scaleTime().domain(xxDomain).range([5, width-5]);
    var yScale = d3.scaleLinear().domain(d3.extent(dataset, function (d) {
        return d[name];
    })).range([height, 0]);
    let domain = yScale.domain();
    if (name == "stress" || name == "engagement" || name == "sleepiness" || name == "focus" || name == "memoryLoad" || name == "mouseMoves") {
        let rescale = d3.scaleLinear().domain(domain).range([0, 100]);
        domain = [rescale(domain[0]), rescale(domain[1])];
    } else if (name == "emotionalValence") {
        let rescale = d3.scaleLinear().domain(domain).range([-1, 1]);
        //
        domain = [rescale(domain[0]), rescale(domain[1])];
    }
    var line = d3.line()
        .defined(function (d) {
            return !isNaN(d[name]);
        })
        .x(function (d) { /*console.log("x");console.log(d);*/
            return xScale(new Date(d.date));
        })
        .y(function (d) {/*console.log("y");console.log(d);*/
            return yScale(d[name]);
        }).curve(d3.curveBasis);

    if (d3.select(svg_id).select("g").empty()) {
        var g = d3.select(svg_id).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").style("color", color);
        //append clip path:
        g.append("defs").append("clipPath")
            .attr("id", "clip" + svg_id.slice(1))
            .append("rect")
            .attr("height", "95%")
            .attr("width", "95.22%");
        g.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(d3.scaleLinear().domain(domain).range([height, 0])))
            .append("text")
            .attr("fill", color)
            .attr("y", "-1.5em")
            .attr("dy", "0.71em")
            .attr("text-anchor", "end")
            .text("Magnitude");
        g.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d %b - %I:%M")).ticks(7))
        // append svg path element describing our line:
        let clipG = g.append("g").attr("clip-path", "url(#clip" + svg_id.slice(1) + ")");
        clipG.append("path")
            .attr("class", "dataLine")
            .datum(dataset)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
        g.selectAll(".dot")
            .data(dataset)
            .enter()
            .append("circle") // Uses the enter().append() method
            .attr("class", "dot")
            .attr("fill", color) // Assign a class for styling
            .attr("cx", function (d) {
                return xScale(new Date(d.date))
            })
            .attr("cy", function (d) {
                if (typeof d[name] !== "undefined") {
                    return yScale(d[name])
                } else {
                    return height;
                }
            })
            .attr("r", 8);
    } else {
        //update
        var g = d3.select(svg_id).select("g");
        g.select(".dataLine").datum(dataset).attr("d", line);
        g.select(".xAxis")
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%d %b - %I:%M")).ticks(7))
        g.selectAll(".yAxis")
            .call(d3.axisLeft(d3.scaleLinear().domain(domain).range([height, 0])));
        g.selectAll(".dot").data(dataset)
            .attr("cx", function (d) {
                return xScale(new Date(d.date))
            })
            .attr("cy", function (d) {
                if (typeof d[name] !== "undefined") {
                    return yScale(d[name])
                } else {
                    return height;
                }
            })
    }

}

function plotPpgLiveAnimation(svg_id, dataset, sampleRate, hr, xxDomainStart = 0, xxDomainEnd = dataset.length, yyDomainStart = d3.min(dataset), yyDomainEnd = d3.max(dataset)) {
    if (dataset == undefined || svg_id == "") return;
    if (dataset[0].length == 2) {
        var auxDataset = [];
        dataset.forEach((el) => {
            auxDataset.push(el[1])
        });
        dataset = auxDataset;
        xxDomainEnd = dataset.length;
        yyDomainStart = d3.min(dataset);
        yyDomainEnd = d3.max(dataset);
    }
    if (svg_id[0] != "#") {
        svg_id = "#" + svg_id;
    }
    if (yyDomainStart == yyDomainEnd) {
        yyDomainEnd++;
    }
    var width = d3.select(svg_id).node().clientWidth;
        console.log("width: " + width);
    var height = d3.select(svg_id).node().clientHeight;

// setup scales
    var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd]).range([0, width]);
    var yScale = d3.scaleLinear().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    if (svg_id == "#EEG4" || svg_id == "#EEG3") {
        yScale = d3.scaleLog().domain([yyDomainEnd, yyDomainStart]).range([0, height]);
    }
// define line function (returns svg path)
    var area = d3.area()
        .x(function (d, i) {
            return xScale(i);
        })
        .y0(height)
        .y1(function (d, i) {
            return yScale(d)
        })
        .curve(d3.curveMonotoneX);
    if (d3.select(svg_id).select("g").empty()) {
        //create
        var svg = d3.select(svg_id).append("g");
        svg.append("defs").append("clipPath")
            .attr("id", "clip" + svg_id.slice(1))
            .append("rect")
            .attr("height", "24vh")
            .attr("width", "99.9vw");
        // append svg path element describing our line:
        svg.append("g").attr("clip-path", "url(#clip" + svg_id.slice(1) + ")").append("path")
            .attr("class", "dataLine")
            .datum(dataset)
            .attr("fill", "rgba(0,255,176,0.3)")
            .attr("stroke", "#00ffb0")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", area);
    } else {
        //update
        if (dataset.length > sampleRate && dataset.length < sampleRate * 6) {

            var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd - sampleRate]).range([0, width]);
            // console.log(xScale.domain() + "<----")
            // console.log(width + "<----")
            // console.log(dataset)
            var area = d3.area()
                .x(function (d, i) {
                    return xScale(i);
                })
                .y0(height)
                .y1(function (d, i) {
                    return yScale(d)
                })
                .curve(d3.curveMonotoneX);
            d3.select(svg_id).select(".yAxis").call(d3.axisLeft(yScale))
            d3.select(svg_id).select(".xAxis").call(d3.axisBottom(xScale))
            d3.select(svg_id).select(".dataLine").attr("transform", null).datum(dataset).transition(900).attr("d", area)

            // d3.select(svg_id).select(".dataLine").datum(dataset).attr("d",area).transition(900);


        } else {
            var xScale = d3.scaleLinear().domain([xxDomainStart, xxDomainEnd - sampleRate]).range([0, width]);
            var area = d3.area()
                .x(function (d, i) {
                    return xScale(i);
                })
                .y0(height)
                .y1(function (d, i) {
                    return yScale(d)
                })
                .curve(d3.curveMonotoneX);
            d3.select(svg_id).select(".dataLine").datum(dataset).attr("d", area);
            d3.select(svg_id).select(".yAxis").call(d3.axisLeft(yScale))
            d3.select(svg_id).select(".xAxis").call(d3.axisBottom(xScale))
            d3.select(svg_id).select(".dataLine").attr("transform", null)
                .transition().duration(900)
                .attr("transform", "translate(" + xScale(-sampleRate) + ")");
            d3.select("#bpm_text").text(parseInt(hr)+" bpm");
        }

    }

}

function cleanPlots() {
    d3.select("#EEG1").select("g").remove();
    d3.select("#EEG2").select("g").remove();
    d3.select("#EEG3").select("g").remove();
    d3.select("#EEG4").select("g").remove();
    d3.select("#EEG4").select("g").remove();
    d3.select("#PPGIR").select("g").remove();
    d3.select("#PPGRed").select("g").remove();
    d3.select("#ACCX").select("g").remove();
    d3.select("#ACCY").select("g").remove();
    d3.select("#ACCZ").select("g").remove();
    d3.select("#GYROX").select("g").remove();
    d3.select("#GYROY").select("g").remove();
    d3.select("#GYROZ").select("g").remove();
    d3.select("#MAGNX").select("g").remove();
    d3.select("#MAGNY").select("g").remove();
    d3.select("#MAGNZ").select("g").remove();
}

function largestTriangleThreeBucket(data, threshold, xProperty, yProperty) {
    /**
     * This method is adapted from the
     * "Largest Triangle Three Bucket" algorithm by Sveinn Steinarsson
     * In his 2013 Masters Thesis - "Downsampling Time Series for Visual Representation"
     * http://skemman.is/handle/1946/15343
     *
     * The MIT License
     *
     * Copyright (c) 2013 by Sveinn Steinarsson
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     * --------------------------------------------------------------------------------------------------------
     */
    yProperty = yProperty || 0;
    xProperty = xProperty || 1;

    var m = Math.floor,
        y = Math.abs,
        f = data.length;

    if (threshold >= f || 0 === threshold) {
        return data;
    }

    var n = [],
        t = 0,
        p = (f - 2) / (threshold - 2),
        c = 0,
        v,
        u,
        w;

    n[t++] = data[c];

    for (var e = 0; e < threshold - 2; e++) {
        for (var g = 0,
                 h = 0,
                 a = m((e + 1) * p) + 1,
                 d = m((e + 2) * p) + 1,
                 d = d < f ? d : f,
                 k = d - a; a < d; a++) {
            g += +data[a][xProperty], h += +data[a][yProperty];
        }

        for (var g = g / k,
                 h = h / k,
                 a = m((e + 0) * p) + 1,
                 d = m((e + 1) * p) + 1,
                 k = +data[c][xProperty],
                 x = +data[c][yProperty],
                 c = -1; a < d; a++) {
            "undefined" != typeof data[a] &&
            (u = .5 * y((k - g) * (data[a][yProperty] - x) - (k - data[a][xProperty]) * (h - x)),
            u > c && (c = u, v = data[a], w = a));
        }

        n[t++] = v;
        c = w;
    }

    n[t++] = data[f - 1];

    return n;
};

/**
 * Plots list of found devices on the guideMenu Interface and updates the alert message accordingly.
 * @param devices
 */

function renderFoundDevices(devices) {
    d3.select("#leftGuideMenuText").selectAll("p").remove();
    d3.select("#leftGuideMenuText").append("p").text("MASTR Found! Please select...");
    d3.select("#leftGuideMenuText").append("div").attr("id", "deviceList");
    d3.select("#alert_txt").text("🛈  MASTR headband device(s) found! Select one or Import previous recording 🛈");
    devices.forEach(d => {
        d3.select("#deviceList").append("p")
            .attr("class", "btn")
            .text(d.deviceName + " : " + d.deviceAddress)
            .on("click", (a, b) => {
                // console.log(d3.select(this));
                d3.select("#alert_txt").text("🛈  Attempting Bluetooth Connection to " + d.deviceName + " ... 🛈");
                var requestConnection = mastrComm.connect(d.deviceAddress, 1);
                requestConnection.then(r => {
                    //Ready to start recording:
                    d3.select("#alert_txt").text("🗲  Bluetooth Connection to " + d.deviceName + " Successfully established -  you can now Start a recording or Import a previous one. 🗲");
                    d3.select("#leftGuideMenuText").selectAll("*").remove();
                    d3.select("#leftGuideMenuText").append("p").text("Successfully connected to " + d.deviceName + " .");
                    d3.select("#leftGuideMenuText").append("p").text("Click here to Start.");

                    d3.select("#guideStart").style("display", "block");
                    d3.select("#guideSearch").style("display", "none");
                    d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("cursor", "pointer")
                        .on("mouseover", () => {
                            d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("background-color", "#4b4b48")
                        })
                        .on("mouseout", () => {
                            d3.select(d3.select("#leftGuideMenuText").node().parentNode).style("background-color", "#31312f")
                        })
                        .on("mousedown", () => {
                            startRecording();
                        });


                }).catch(err => {
                    d3.select("#alert_txt").text("⚠  " + err + " Please make sure MASTR is charged and powered on.  ⚠")
                });


            });
    });
// d3.select("#leftGuideMenuText").append("p").text("Problems connecting?").append("a").style("href")

}
//----------------------------------------------------------------------------------------------------------------------
//plot Zoom Bar code below:

/**
 * Handler method for x domain zoom
 */
function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")
        return; // ignore zoom-by-brush
    var t = d3.event.transform;

    console.log("zoomed!");
    console.log("currentXScale " + currentXScale.domain() + " " + currentXScale.range());
    console.log("xRAW_wide " + xRAW_wide.domain() + " " + xRAW_wide.range());
    ["CHART1", "CHART2"].forEach(function (id) {
        //
        // var height = d3.select("#" + id).select(".yAxis").select(".domain").node().getBBox().height;
        // var width = d3.select("#" + id).select(".xAxis").select(".domain").node().getBBox().width;
        var height = 133.84976;
        var width = 1215;
        var data = d3.select("#" + id).select(".dataLine").datum();
        var dataMax = d3.max(data);
        var dataMin = d3.min(data);
        var line = getPath(width, height, data);
        var scaleB4 = d3.scaleLinear().domain(currentXScale.domain()).range(currentXScale.range());

        var newXDomain = t.rescaleX(xRAW_wide).domain();

        currentXScale.domain(newXDomain);
        data = data.slice(currentXScale.domain()[0], currentXScale.domain()[1]);

        line.x(function (d, i) {
            return currentXScale(i)
        });
        line.y(function (d, i) {
            return d3.scaleLinear().domain([d3.max(data), d3.min(data)]).range([0, height])(d);
        })
        // update line path according to zoom:
        d3.select("#" + id).select(".dataLine").attr("d", line);
        // update ScrollZoomBar according to zoom:
        // update categorical circles @line according to zoom
        d3.selectAll(".circle").attr("cx", function (d, i) {
            return currentXScale(i % (data.length + 1));
        });



        let metricName = ""
        if (id == "CHART2") {
            metricName = d3.select("#chart2Dropdown").select("g").select("g").text().slice(0, -1).trim();
        } else {
            metricName = d3.select("#chart1Dropdown").select("g").select("g").text().slice(0, -1).trim();
        }
        // var name = d3.select("#" + id).select("text").text();
        let scale = d3.scaleLinear().domain([dataMax,dataMin]).range([100, 0])
        let domain = [scale(d3.max(data)), scale(d3.min(data))]
        if (metricName == "Heart Rate" || metricName == "Creep Score" || metricName == "Gold" || metricName == "Actions Per Minute" || metricName == "HRV") {

            // if(metricName == "Heart Rate" ){
            domain = [d3.max(data), d3.min(data)];
        } else if (metricName == "Emotional Valence") {
            scale = d3.scaleLinear().domain([dataMax,dataMin]).range([1, -1])
            domain = [scale(d3.max(data)),scale(d3.min(data))]
        }


        d3.select("#" + id).select(".yAxis").call(d3.axisLeft(d3.scaleLinear().domain(domain).range([0, height])));
        console.log("zoomed yAxis domain = "+domain)
    });

    d3.selectAll(".brush").call(brush.move, xRAW_wide.range().map(t.invertX, t));

// update all x axis, regardless of visible charts
    d3.selectAll(".xAxis")
        .call(d3.axisBottom(currentXScale)
        // .ticks(d3.min(Math.ceil(currentXScale.domain()[1]-currentXScale.domain()[0]),10))
        // .ticks(10)
            .ticks(9)
            .tickFormat(function (d) {
                return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
            }));

    if(d3.selectAll("#progressInspector p").nodes().length > 0){
        let start = parseInt(currentXScale.domain()[0]);
        let end = parseInt(currentXScale.domain()[1] - 1);
        d3.selectAll("#progressInspector p").nodes()[2].innerText = "Time Interval....... " + parseInt(start / 60).toString().padStart(2, '0') + ":" + (start % 60).toString().padStart(2, '0') + " ↔ " + parseInt(end / 60).toString().padStart(2, '0') + ":" + (end % 60).toString().padStart(2, '0');
        // d3.selectAll("#progressInspector p").nodes()[8].innerText = "Actions Per Minute.. " + (d3.mean(apm.slice(start, end))).toFixed(2);
        if (engagement.length > 0) {
            let meanEngagement = d3.mean(engagement.slice(start, end));
            let meanEmoVal = d3.mean(emotionValence.slice(start, end));
            let meanStress = d3.mean(stress.slice(start, end));
            let meanSleep = d3.mean(sleepiness.slice(start, end));
            let meanFocus = d3.mean(getFocus().slice(start, end));
            let meanMemLoad = d3.mean(memLoad.slice(start, end));
            d3.selectAll("#progressInspector p").nodes()[4].innerText = "Engagement.......... " + parseInt(d3.scaleLinear().domain([d3.max(engagement), d3.min(engagement)]).range([100, 0])(meanEngagement)) + " %";
            d3.selectAll("#progressInspector p").nodes()[5].innerText = "Emotional Valence... " + parseInt(d3.scaleLinear().domain([d3.max(emotionValence), d3.min(emotionValence)]).range([100, 0])(meanEmoVal)) + " %";
            d3.selectAll("#progressInspector p").nodes()[6].innerText = "Stress.............. " + parseInt(d3.scaleLinear().domain([d3.max(stress), d3.min(stress)]).range([100, 0])(meanStress)) + " %";
            d3.selectAll("#progressInspector p").nodes()[7].innerText = "Sleepiness.......... " + parseInt(d3.scaleLinear().domain([d3.max(sleepiness), d3.min(sleepiness)]).range([100, 0])(meanSleep)) + " %";
            d3.selectAll("#progressInspector p").nodes()[8].innerText = "Focus............... " + parseInt(d3.scaleLinear().domain([d3.max(getFocus()), d3.min(getFocus())]).range([100, 0])(meanFocus)) + " %";
            d3.selectAll("#progressInspector p").nodes()[9].innerText = "Memory Load......... " + parseInt(d3.scaleLinear().domain([d3.max(memLoad), d3.min(memLoad)]).range([100, 0])(meanMemLoad)) + " %";
            d3.selectAll("#progressInspector p").nodes()[10].innerText = "Heart Rate.......... " + parseInt(d3.mean(heartRate.slice(start, end))) + " bpm";
            d3.selectAll("#progressInspector p").nodes()[11].innerText = "HRV................. " + parseInt(d3.mean(hrv.slice(start, end))) + " ms";
        }
    }
}

/**
 * Handler method for x domain mouse drag
 */
function brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom")
        return; // ignore brush-by-zoom
    var s = d3.event.selection || xRAW_wide.range();

    // console.log("brushed!");
    // console.log("currentXScale " + currentXScale.domain() + " " + currentXScale.range());
    // console.log("xRAW_wide " + xRAW_wide.domain() + " " + xRAW_wide.range());
    // (2) iterate through visible charts:
    ["CHART1", "CHART2"].forEach(function (id) {
        var data = d3.select("#" + id).select(".dataLine").datum();
        var dataMax = d3.max(data);
        var dataMin = d3.min(data);
        // var height = d3.select("#" + id).select(".yAxis").select(".domain").node().getBBox().height;
        var height = 133.84976;
        var width = 1215;
        var line = getPath(width, height, data);
        var scaleB4 = d3.scaleLinear().domain(currentXScale.domain()).range(currentXScale.range());
        xRAW_wide.domain(s.map(xRAW_wide.invert, xRAW_wide));

        data = data.slice(xRAW_wide.domain()[0], xRAW_wide.domain()[1]);
        line.x(function (d, i) {
            return xRAW_wide(i)
        });
        line.y(function (d, i) {
            return d3.scaleLinear().domain([d3.max(data), d3.min(data)]).range([0, height])(d);
        })
        // update line path according to zoom:
        d3.select("#" + id).select(".dataLine").attr("d", line);
        // update categorical circles @line according to scroll
        d3.selectAll(".circle").attr("cx", function (d, i) {
            return xRAW_wide(i % (data.length + 1));
        });

        currentXScale = d3.scaleLinear().domain(xRAW_wide.domain()).range(xRAW_wide.range());


        //(d3.scaleLinear().domain([d3.min(data), d3.max(data)]).range(range)(data[svgXMousePos])).toFixed(0) + percentage
        let metricName = ""
        if (id == "CHART2") {
            metricName = d3.select("#chart2Dropdown").select("g").select("g").text().slice(0, -1).trim();
        } else {
            metricName = d3.select("#chart1Dropdown").select("g").select("g").text().slice(0, -1).trim();
        }
        // var name = d3.select("#" + id).select("text").text();
        let scale = d3.scaleLinear().domain([dataMax,dataMin]).range([100, 0])
        let domain = [scale(d3.max(data)), scale(d3.min(data))]
        if (metricName == "Heart Rate" || metricName == "Creep Score" || metricName == "Gold" || metricName == "Actions Per Minute" || metricName == "HRV") {

            // if(metricName == "Heart Rate" ){
            domain = [d3.max(data), d3.min(data)];
        } else if (metricName == "Emotional Valence") {
            scale = d3.scaleLinear().domain([dataMax,dataMin]).range([1, -1])
            domain = [scale(d3.max(data)),scale(d3.min(data))]
        }


        d3.select("#" + id).select(".yAxis").call(d3.axisLeft(d3.scaleLinear().domain(domain).range([0, height])));
        console.log("brushed yAxis domain = "+domain)
    });


// s is a tuple of the pixel x-coordinates at which the brushed rect begins and ends
// xRAW_wide.domain(s.map(xRAW_wide.invert, xRAW_wide));
// line.x(function(d,i){return xRAW_wide(i)});
// d3.select("#path"+name).attr("d",line);
// console.log("currentXScale:")
// console.log(currentXScale.domain()[1])
// console.log(currentXScale.domain()[0])

    d3.selectAll(".xAxis")
        .call(d3.axisBottom(currentXScale)
        // .ticks(d3.min(Math.ceil(currentXScale.domain()[1]-currentXScale.domain()[0]),10))
        // .ticks(10)
            .ticks(9)
            .tickFormat(function (d) {
                return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
            }));

    d3.selectAll(".zoom").call(zoom.transform, d3.zoomIdentity
        .scale(width / (s[1] - s[0]))
        .translate(-s[0], 0));
// console.log("brushed function end");

}

/**
 * This method plots and sets up the scales, handler functions for the ScrollZoomBar interaction.
 * @param {string} metricName - derived metric we want to interact with
 * @param {string} svgName - Svg name, either chart one or two
 * @param {object} data - metric Array
 * @param {function} line - d3 line function
 * @param {string} lineColor - color descriptor (ie: #00ffb0)
 */
let mediaState = "inspector"

function plotScrollZoomBar(svgName, data, line, lineColor, width, height) {
    // var height = d3.select(svgName).select(".yAxis").select(".domain").node().getBBox().height;
    // var width = d3.select(svgName).select(".xAxis").select(".domain").node().getBBox().width;
    var height = 133.84976;
    var width = 1215;
    xRAW_wide = d3.scaleLinear().domain([0, data.length - 1]).range([0, width])
    currentXScale = d3.scaleLinear().domain([0, data.length - 1]).range([0, width])
    let record_dur = data.length;
    if (record_dur < 10) {
        tick_count = record_dur;
    } else {
        tick_count = 8;
    }
    var formatTime = d3.timeFormat("%M:%S");
    if (record_dur < 60) {
        formatTime = d3.timeFormat("%S");
    }
    xRAW_wide = d3.scaleLinear().domain([0, data.length - 1]).range([0, width]);

    brush = d3.brushX()
        .extent([[0, 0], [window.innerWidth, height * 0.24]])
        // line below TLDR: if you want to pass a callback, you have to pass a function, not call a function :)
        .on("brush end", function () {
            brushed();
        });
    zoom = d3.zoom()
        .scaleExtent([1, data.length - 1.5])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);
    var ybrush = d3.scaleLinear().domain([d3.max(data), d3.min(data)]).range([0, height * 0.24]);
    var tinyLine = d3.line()
        .x(function (d, i) {
            return xRAW_wide(i)
        })
        .y(function (d, i) {
            return ybrush(d)
        })
        .curve(d3.curveMonotoneX);
    var scrollZoomBar;
    //if scrollzoombar doesn't exist:
    if (d3.select("#tinyLine" + svgName.slice(1)).empty()) {
        console.log("scrollzoombar doesn't exist")

        //append g
        scrollZoomBar = d3.select("#scrollBarContainer").append("g")
            .attr("class", "scrollZoomBar")
            .attr("transform", "translate(" + margin.left + "," + /*height*0.47*/ 0 + ")");
        //append tinyline
        scrollZoomBar
            .append("path")
            .attr("id", "tinyLine" + svgName.slice(1))
            .attr("class", "line")
            .style("stroke", lineColor)
            .attr("fill", "none")
            .attr("d", tinyLine(data));

        console.log("scrollzoombar doesn't  exists; initial brush width ="+window.innerWidth);
        scrollZoomBar.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, window.innerWidth);
        if (d3.select("#scrollBarContainer").select(".axis").empty()) {
            console.log("scrollzoombar axis is empty")
            scrollZoomBar.append("g")
                .attr("class", "axis")
                .attr("transform", "translate(0," + height * 0.24 + ")").style("color", "#00ffb0")
            // .call(d3.axisBottom(xRAW_wide).ticks(10).tickFormat(formatMinutes));
                .call(d3.axisBottom(xRAW_wide)
                    .ticks(9)
                    .tickFormat(function (d) {
                        return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
                    }));
        }
    } else { //if scrollzoombar already exists:
        console.log("scrollzoombar already exists")

        scrollZoomBar = d3.select("#scrollBarContainer").select("g");
        d3.select("#tinyLine" + svgName.slice(1))
            .attr("d", tinyLine(data));
        console.log("scrollzoombar already exists; initial brush width ="+window.innerWidth);
        scrollZoomBar.select(".brush")
            .call(brush)
            .call(brush.move, window.innerWidth);
        d3.select("#scrollBarContainer").select(".axis")
            .call(d3.axisBottom(xRAW_wide)
                .ticks(9)
                .tickFormat(function (d) {
                    return d3.timeFormat('%M:%S')(new Date(0).setSeconds(d))
                }));
    }

    if (d3.select("#scrollBarContainer").select("image").empty()) {
        d3.select("#scrollBarContainer").append("svg:image")
            .attr('x', "0.05vw")
            .attr('y', "0.05vh")
            .attr('width', 48)
            .attr('height', 36)
            .attr("xlink:href", workingDir + "/images/play.png")
            .on('click', () => {
                let cam = document.getElementById('camera');
                let screen = document.getElementById('screen');
                if (mediaState == "inspector") {
                    mediaState = "replay";
                    console.log(screen.currentTime)
                    screen.addEventListener('timeupdate', () => {
                        highlightLineChart(parseInt(screen.currentTime))
                    });
                    cam.muted = false;
                    cam.play();
                    screen.play();
                    d3.select("#scrollBarContainer").select("image").attr("xlink:href", workingDir + "/images/pause.png")

                } else if (mediaState == "replay") {
                    mediaState = "inspector";
                    // cam.removeEventListener('timeupdate');
                    cam.muted = true;
                    cam.pause();
                    screen.pause();
                    d3.select("#scrollBarContainer").select("image").attr("xlink:href", workingDir + "/images/play.png")
                    screen.removeEventListener('timeupdate', () => {
                        highlightLineChart(parseInt(screen.currentTime))
                    });
                }
            });
    }

    if (d3.selectAll(".zoom").nodes().length < 1) {
        // console.log("mouseInteraction rect width = "+width);
        d3.select("#main").append("svg")
            .attr("id", "mouseInteraction")
            .attr("height", "48%")
            .attr("width", "95.22%")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "4vw")
            .append("rect")
            .attr("class", "zoom")
            .attr("height", "100%")
            .attr("width", "100%")
            .style("position", "absolute")
            .call(zoom);
    } else {
        d3.selectAll(".zoom")
            .call(zoom);
    }

    d3.select("#scrollBarContainer").style("display","block");
    d3.select("#historyDomain").style("display","none");
    console.log('\n' +
         '    d3.select("#scrollBarContainer").style("display","block");\n' +
        '    d3.select("#historyDomain").style("display","none");')
}

/**
 * This method plots and sets up the scales, handler functions for the ScrollZoomBar interaction.
 * @param {string} metricName - derived metric we want to interact with
 * @param {string} svgName - Svg name, either chart one or two
 * @param {object} data - metric Array
 * @param {function} line - d3 line function
 * @param {string} lineColor - color descriptor (ie: #00ffb0)
 */
function plotProgressScrollZoomBar(svgName, data, metricName, line, lineColor, width, height,xxDomain) {
    var height = 133.84976;
    var width = 1215;
    console.log("plotProgressScrollZoomBar! height= "+height+"  ,width= "+width);
    if (typeof xxDomain === "undefined") xxDomain=d3.extent(recordsProgress)
    // console.log("new zoom with scale = "  +xxDomain);
    xRAW_wide = d3.scaleLinear().domain(xxDomain).range([5, width-5]);
    currentXScale = d3.scaleTime().domain(xxDomain).range([5, width-5]);
    console.log(currentXScale.domain(),currentXScale.range())
    // if (!d3.select("#tinyLine" + svgName.slice(1)).empty()){
    //     d3.select("#tinyLine" + svgName.slice(1)).remove();
    // }
    if (!d3.select("#scrollBarContainer").select("image").empty()) {
        d3.select("#scrollBarContainer").select("image").remove();
    }
    let record_dur = data.length;
    if (record_dur < 10) {
        tick_count = record_dur;
    } else {
        tick_count = 8;
    }
    var formatTime = d3.timeFormat("%d %B");
    metricName = getAttrFromName(metricName);
    zoom = d3.zoom()
        // .scaleExtent([1, data.length*2])
        // .translateExtent([[0, 0], [width, height]])
        // .extent([[0, 0], [width, height]])
        .on("zoom", progressZoomed);
    var scrollZoomBar;


    d3.select("#mouseInteraction").remove();
    // if (d3.selectAll(".zoom").nodes().length < 1) {
        d3.select("#main").append("svg")
            .attr("id", "mouseInteraction")
            .attr("height", "48%")
            .attr("width", "95.22%")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "4vw")
            .append("rect")
            .attr("class", "zoom")
            .attr("height", "100%")
            .attr("width", "100%")
            .style("position", "absolute")
            .call(zoom);
    // } else {
    //     d3.select(".zoom").on("zoom",null)
    //     d3.select(".zoom")
    //         .call(zoom);
    // }
    d3.select("#scrollBarContainer").style("display","none");
    d3.select("#historyDomain").style("display","block");

}

function progressZoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush")
        return; // ignore zoom-by-brush
    let t = d3.event.transform;
    var scaleB4 = d3.scaleTime().domain(currentXScale.domain()).range(currentXScale.range());

    // console.log("t = "+t);
    var height = 133.84976;
    var width = 1215;
    var newXDomain = t.rescaleX(xRAW_wide).domain();
    // console.log("new Domain = "+newXDomain);
    currentXScale.domain(newXDomain);
    // console.log(currentXScale.domain());
    // console.log(t);
    // zoom.extent([[t.x,t.y],[width,height]]);
    ["CHART1", "CHART2"].forEach(function (id) {

        let metricName = "";
        if (id == "CHART2") {
            metricName = d3.select("#chart2Dropdown").select("g").select("g").text().slice(0, -1).trim();
        } else {
            metricName = d3.select("#chart1Dropdown").select("g").select("g").text().slice(0, -1).trim()
        }
        let data = d3.select("#" + id).select('.dataLine').datum();
        //        let data = d3.select("#" + id).select('.dataLine').datum().filter(d=>new Date(d.date).getTime() <= newXDomain[1] && new Date(d.date).getTime() >= newXDomain[0]);

        let line = getProgressPath(width, height, data, metricName);
        line.x(function (d, i) {
            return currentXScale(new Date(d.date));
        })
        //plot zoomed line
        d3.select("#" + id).select(".dataLine").attr("d", line);
        //plot zoomed circles
        d3.selectAll("circle").attr("cx", function (d) {
            return currentXScale(new Date(d.date))
        })

    });

    // update all x axis
    d3.selectAll(".xAxis").call(d3.axisBottom(currentXScale).tickFormat(d3.timeFormat("%d %b - %I:%M")).ticks(7))


}

/**
 *
 * @param w
 * @param h
 * @param data
 * @param pathClass
 * @returns {*}
 */
function getProgressPath(w, h, data, metricName) {
    metricName = getAttrFromName(metricName);
    var xScale = d3.scaleTime().domain(d3.extent(data, function (d) {
        return new Date(d['date']);
    })).range([0, w]);
    let yScale = d3.scaleLinear().domain(d3.extent(data, function (d) {
        return d[metricName];
    })).range([h, 0]);
    return d3.line()
        .defined(function (d) {
            return !isNaN(d[metricName]);
        })
        .x(function (d) {
            return xScale(new Date(d.date))
        })
        .y(function (d) {
            return yScale(d[metricName])
        })
        .curve(d3.curveBasis);
}

/**
 *
 * @param w
 * @param h
 * @param data
 * @param pathClass
 * @returns {*}
 */
function getPath(w, h, data) {
    xRAW_wide = d3.scaleLinear().domain([0, data.length - 1]).range([0, w]);
    var yScale = d3.scaleLinear().domain([d3.max(data), d3.min(data)]).range([0, h]);
// return d3.area()
//     .x(function(d,i) { return xRAW_wide(i); })
//     .y0(h)
//     .y1(function(d,i) { return yScale(d) })
//     .curve(d3.curveMonotoneX);
    return d3.line()
        .x(function (d, i) {
            return xRAW_wide(i)
        })
        .y(function (d, i) {
            return yScale(d)
        })
        .curve(d3.curveMonotoneX);
}

/**
 * This method plots line chart circle highlights
 * @param SVG path
 * @param SVG circle
 * @returns {*[x pos, y pos]}
 */
function plotHighlightCircles(path, circle, plotCircles) {
    var x = d3.event.pageX - margin.left;
    var pathEl = path.node();
    var beginning = x, end = pathEl.getTotalLength(), target;
    while (true) {
        target = Math.floor((beginning + end) / 2);
        var pos = pathEl.getPointAtLength(target);
        if ((target === end || target === beginning) && pos.x !== x) {
            break;

        }
        if (pos.x > x) end = target;
        else if (pos.x < x) beginning = target;
        else break; //position found
    }
    if (plotCircles) {
        circle
            .attr("cx", x)
            .attr("cy", pos.y);
    }
    return [x, pos.y];
}

// function plotHighlightCircles(path,circle,plotCircles){
//     let x = d3.event.pageX;
//     let pathEl = path.node();
//     let y = 0;
//     if (plotCircles){
//         let res = pathEl.getPointAtLength(x)
//         console.log(res)
//         circle
//             .attr("cx", res.x)
//             .attr("cy", res.y);
//         return [res.x,res.y]
//     }
//     // var beginning = x, end = pathEl.getTotalLength(), target;
//     // while (true) {
//     //     target = Math.floor((beginning + end) / 2);
//     //     var pos = pathEl.getPointAtLength(target);
//     //     if ((target === end || target === beginning) && pos.x !== x) {
//     //         break;
//     //
//     //     }
//     //     if (pos.x > x)      end = target;
//     //     else if (pos.x < x) beginning = target;
//     //     else                break; //position found
//     // }
//     // if(plotCircles) {
//     //     circle
//     //         .attr("cx", x)
//     //         .attr("cy", pos.y);
//     // }
//     // return [x, pos.y];
// }

function svgDropDown(options, defaultMetric, container, color) {
    if (typeof options !== 'object' || options === null || !container) {
        console.error(new Error("Container not provided"));
        return;
    }
    const defaultOptions = {
        width: "10.94vw",
        members: [],
        fontSize: 12,
        color: "#333",
        fontFamily: "Calibri,Candara,Segoe,Segoe UI,Optima,Arial,sans-serif",
        x: 0,
        y: 0,
        changeHandler: function () {
        }
    };

    options = {
        ...defaultOptions,
        ...options
    };
    options.optionHeight = options.fontSize * 1.5;
    options.height = options.fontSize + 8;
    options.padding = 5;
    options.hoverColor = color;
    options.hoverTextColor = "lightgray";
    options.bgColor = "rgba(0,0,0,0.8)";
    options.width;
// let marginLeft=0.5*container.node().getBBox().width-options.y;
    const g = container.append("svg").attr("class", "dropdownSvg").attr("width", "calc("+options.width+" + 2px)").attr("height", "100%")
        .append("g")
        .attr("shape-rendering", "crispEdges")
        .attr("x", options.x)
        .attr("y", options.y)
        .attr("transform", "translate(1,1)")
        .attr("font-family", options.fontFamily);

    let selectedOption =
        options.members.length === 0 ? {
                label: "",
                value: ""
            } :
            options.members[0];

    /** Rendering Select Field */
    const selectField = g.append("g");
// background
    selectField
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.height)
        .attr("class", "option select-field")
        .attr("fill", options.bgColor)
        .style("stroke", "#a0a0a0")
        .style("stroke-width", "1");

// text
    const activeText = selectField
        .append("text")
        .text(defaultMetric)
        .attr("x", options.padding)
        .attr("y", options.height / 2 + options.fontSize / 3)
        .attr("font-size", options.fontSize)
        .attr("fill", color);
// arrow symbol at the end of the select box
    selectField
        .append("text")
        .text("▼")
        .attr("x", options.width - options.fontSize - options.padding)
        .attr("y", options.height / 2 + (options.fontSize - 2) / 3)
        .attr("font-size", options.fontSize - 2)
        .attr("fill", color);

// transparent surface to capture actions
    selectField
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.height)
        .style("fill", "transparent")
        .on("click", handleSelectClick);

    /** rendering options */
    const optionGroup = g
        .append("g")
        .attr("class", "dropdownOptG")
        .attr("transform", `translate(0, ${options.height})`)
        .attr("opacity", 0); //.attr("display", "none"); Issue in IE/Firefox: Unable to calculate textLength when display is none.

// Rendering options group
    const optionEnter = optionGroup
        .selectAll("g")
        .data(options.members)
        .enter()
        .append("g")
        .on("click", handleOptionClick);

// Rendering background
    optionEnter
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.optionHeight)
        .attr("y", function (d, i) {
            return i * options.optionHeight;
        })
        .attr("class", "option")
        .style("stroke", options.hoverColor)
        .style("stroke-dasharray", (d, i) => {
            let stroke = [
                0,
                options.width,
                options.optionHeight,
                options.width,
                options.optionHeight
            ];
            if (i === 0) {
                stroke = [
                    options.width + options.optionHeight,
                    options.width,
                    options.optionHeight
                ];
            } else if (i === options.members.length - 1) {
                stroke = [0, options.width, options.optionHeight * 2 + options.width];
            }
            return stroke.join(" ");
        })
        .style("stroke-width", 1)
        .style("fill", options.bgColor);

// Rendering option text
    optionEnter
        .append("text")
        .attr("x", options.padding)
        .attr("y", function (d, i) {
            return (
                i * options.optionHeight +
                options.optionHeight / 2 +
                options.fontSize / 3
            );
        })
        .text(function (d) {
            return d.label;
        })
        .attr("font-size", options.fontSize - 2)
        .attr("fill", color)
        .each(wrap);

// Rendering option surface to take care of events
    optionEnter
        .append("rect")
        .attr("width", options.width)
        .attr("height", options.optionHeight)
        .attr("y", function (d, i) {
            return i * options.optionHeight;
        })
        .style("fill", "transparent")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

//once the textLength gets calculated, change opacity to 1 and display to none
    optionGroup.attr("display", "none").attr("opacity", 1);

//
    d3.select("body").on("click", function () {
        d3.selectAll('.dropdownOptG').attr("display", "none");
        d3.selectAll(".dropdownSvg").attr("height", "100%")
    });

// Utility Methods
    function handleMouseOver() {
        d3.select(d3.event.target.parentNode)
            .select(".option")
            .style("fill", options.hoverColor);

        d3.select(d3.event.target.parentNode)
            .select("text")
            .style("fill", options.hoverTextColor);
    }

    function handleMouseOut() {
        d3.select(d3.event.target.parentNode)
            .select(".option")
            .style("fill", options.bgColor);

        d3.select(d3.event.target.parentNode)
            .select("text")
            .style("fill", color);
    }

    function handleOptionClick(d) {
        d3.event.stopPropagation();
        selectedOption = d;
        activeText.text(selectedOption.label).each(wrap);
        typeof options.changeHandler === 'function' && options.changeHandler.call(this, d);
        optionGroup.attr("display", "none");
        d3.select(optionGroup.node().parentNode.parentNode).attr("height", "100%")
    }

    function handleSelectClick() {
        console.log("handleSelectClick")
        d3.event.stopPropagation();
        const visibility = optionGroup.attr("display") === "block" ? "none" : "block";
        if (visibility === "block") {
            d3.select(d3.select(this).node().parentNode.parentNode.parentNode).attr("height", 940)
        } else {
            d3.select(d3.select(this).node().parentNode.parentNode.parentNode).attr("height", "100%")
        }

        optionGroup.attr("display", visibility);
    }

// wraps words
    function wrap() {
        console.log("wrap")
        const width = options.width;
        const padding = options.padding;
        const self = d3.select(this);
        let textLength = self.node().getComputedTextLength();
        let text = self.text();
        const textArr = text.split(/\s+/);
        let lastWord = "";
        while (textLength > width - 2 * padding && text.length > 0) {
            lastWord = textArr.pop();
            text = textArr.join(" ");
            self.text(text);
            textLength = self.node().getComputedTextLength();
        }
        self.text(text + " " + lastWord);

        // providing ellipsis to last word in the text
        if (lastWord) {
            textLength = self.node().getComputedTextLength();
            text = self.text();
            while (textLength > width - 2 * padding && text.length > 0) {
                text = text.slice(0, -1);
                self.text(text + "...");
                textLength = self.node().getComputedTextLength();
            }
        }
    }
}

function getAttrFromName(name) {
    switch (name) {
        case "Engagement":
            return "engagement";
        case "Emotional Valence":
            return "emotionalValence";
        case "Stress":
            return "stress";
        case "Sleepiness":
            return "sleepiness";
        case "Focus":
            return "focus";
        case "Memory Load":
            return "memoryLoad";
        case "Heart Rate":
            return "heartRate";
        case "HRV":
            return "hrv";
        case "Mouse Activity":
            return "mouseMoves";
        case "Actions Per Minute":
            return "apm";
        case "Fatigue":
            return "fatigue";
    }
}

function highlightLineChart(timeStamp) {
    var height = 133.84976;
//TODO This is being called too many  times during timeupdate; we should check for timeStamp change before updating!
    var chartList = ["CHART1", "CHART2"];
    chartList.forEach(function (id) {
        var g = d3.select("#" + id).select("g");
        var line = d3.select("#" + id).select(".dataLine");
        var data = d3.select("#" + id).select(".dataLine").datum();
        var range = [0, 100];
        var percentage = "%";
        var metricName = d3.select("#" + id.toLowerCase() + "Dropdown").select("g").select("g").text().slice(0, -1).trim()
        if (metricName == "Emotional Valence") {
            range = [-1, 1];
            percentage = "";
        } else if (metricName == "Creep Score" || metricName == "Gold" || metricName == "Actions Per Minute" || metricName == "HRV") {
            range = [d3.min(data), d3.max(data)];
            percentage = "";
        } else if (metricName == "HRV") {
            range = [d3.min(data), d3.max(data)];
            percentage = "ms";
        } else if (metricName == "Heart Rate") {
            range = [d3.min(data), d3.max(data)];
            percentage = "bpm";
        }
        let domain = currentXScale.domain();
        let slicedData = data.slice(parseInt(domain[0]), parseInt(domain[1]));
        let x = currentXScale(timeStamp);
        let y = d3.scaleLinear().domain([d3.max(slicedData), d3.min(slicedData)]).range([0, height])(data[timeStamp]);

        if (d3.select("#circle" + id).empty()) {

            g.append("circle")
                .attr("id", "circle" + id)
                .style("opacity", 1)
                .attr("r", 7)
                .attr("fill", "rgb(11,49,11)")
                .attr("stroke", line.style("stroke"))
                .attr("stroke-width", 3)
                .attr("cx", x)
                .attr("cy", y);
            let coord = plotHighlightCircles(line, d3.select("#circle" + id), true);
            console.log("coord = "+coord)
            console.log("range = "+range)
            let val = (d3.scaleLinear().domain([d3.min(data), d3.max(data)]).range(range)(data[timeStamp])).toFixed(0)
            g.append("text")
                .text(function () {
                    return val + percentage;
                })
                .attr("x", coord[0] - 15)
                .attr("y", coord[1] - 15)
                .attr("class", "inspection")
                .attr("id", "circleText" + id)
                .style('font-family', 'Arial')
                .style('fill', line.style("stroke"));
        } else {
            let upDown = 1;
            if (((data[timeStamp] - d3.min(data)) / (d3.max(data) - d3.min(data))) > 0.8) {
                upDown = -2;
            }
            d3.select("#circle" + id)
                .attr("cx", x)
                .attr("cy", y);
            d3.select("#circleText" + id)
                .text(function () {
                    return (d3.scaleLinear().domain([d3.min(data), d3.max(data)]).range(range)(data[timeStamp])).toFixed(0) + percentage;
                })
                .attr("x", x - 15)
                .attr("y", y - upDown * 15);
        }
    });
}

module.exports = {
    cleanPlots: function () {
        cleanPlots();
    },
    plotLineChart: function (svgId, svgDatum, sr, name, width, height, xDomain, yDomain, color) {
        plotLineChart(svgId, svgDatum, sr, name, width, height, xDomain, yDomain, color)
    },
    plotRtLineChart: function (svgId, svgDatum, sr, xmin, xmax, ymin, ymax) {
        plotRtLineChart(svgId, svgDatum, sr, xmin, xmax, ymin, ymax)
    },
    plotPpgLiveAnimation: function (svgId, svgDatum, sr, hr, xmin, xmax, ymin, ymax) {
        plotPpgLiveAnimation(svgId, svgDatum, sr, hr, xmin, xmax, ymin, ymax)
    },
    largestTriangleThreeBucket: function (d, t, x, y) {
        largestTriangleThreeBucket(d, t, x, y)
    },
    renderFoundDevices: function (d) {
        renderFoundDevices(d)
    },
    plotScrollZoomBar: function (s, d, l, lc, w, h) {
        plotScrollZoomBar(s, d, l, lc, w, h)
    },
    plotProgressScrollZoomBar: function (s, d, m, l, lc, w, h,xxD) {
        plotProgressScrollZoomBar(s, d, m, l, lc, w, h,xxD)
    },
    getScale: function () {
        return currentXScale;
    }, getWideScale: function () {
        return xRAW_wide;
    }, giefZoom: function () {
        return zoom;
    },
    plotHighlightCircles: function (path, circle, plotCircles) {
        return plotHighlightCircles(path, circle, plotCircles)
    },
    plotProgressChart: function (svgId, svgDatum, sr, name, width, height, xDomain, yDomain) {
        plotProgressChart(svgId, svgDatum, sr, name, width, height, xDomain, yDomain)
    },
    emitter: function () {
        return em;
    },
    svgDropDown: function (opts, metric, container, color) {
        return svgDropDown(opts, metric, container, color)
    },
    highlightLineChart: function (ts) {
        return highlightLineChart(ts)
    }
}