
function createPareto(pid, plabel, data){
    var chart = new CanvasJS.Chart(pid, {
        title:{
            text: plabel
        },
        axisY: {
            title: "TF-IDF",
            lineColor: "#4F81BC",
            tickColor: "#4F81BC",
            labelFontColor: "#4F81BC"
        },
        axisY2: {
            title: "Percent",
            suffix: "%",
            lineColor: "#C0504E",
            tickColor: "#C0504E",
            labelFontColor: "#C0504E"
        },
        data: [{
            type: "column",
            dataPoints: data
        }]
    });
    chart.render();

	var dps = [];
	var yValue, yTotal = 0, yPercent = 0;

	for(var i = 0; i < chart.data[0].dataPoints.length; i++)
		yTotal += chart.data[0].dataPoints[i].y;

	for(var i = 0; i < chart.data[0].dataPoints.length; i++){
		yValue = chart.data[0].dataPoints[i].y;
		yPercent += (yValue / yTotal * 100);
		dps.push({label: chart.data[0].dataPoints[i].label, y: yPercent});
	}
	
	chart.addTo("data",{type:"line", yValueFormatString: "0.##\"%\"", dataPoints: dps});
	chart.data[1].set("axisYType", "secondary", false);
	chart.axisY[0].set("maximum", yTotal);
	chart.axisY2[0].set("maximum", 100);
}