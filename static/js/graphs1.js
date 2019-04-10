queue()    
	.defer(d3.json, "/test/projects1")
	.defer(d3.json, "static/geojson/map_end.geojson")
	.defer(d3.json, "/savoir/skills")
    .await(makeGraphs);
var savoirData1 = [], savoirData2 = [], savoirData3 = []; 

function makeGraphs(error, projectsJson, statesJson, skillsJson) {
	//Clean projectsJson data
	for(var i=0;i<statesJson['features'].length;i++){
		var posCount = statesJson['features'][i]['geometry']['coordinates'][0].length;
		var halfCount = parseInt(posCount / 2);
		for(var j=0;j<halfCount;j++){
			var temp = statesJson['features'][i]['geometry']['coordinates'][0][j];
			statesJson['features'][i]['geometry']['coordinates'][0][j] = statesJson['features'][i]['geometry']['coordinates'][0][posCount - j - 1];
			statesJson['features'][i]['geometry']['coordinates'][0][posCount - j - 1] = temp;
		}
	}
	var donorschooseProjects = projectsJson;
	var skillsProjects = skillsJson;
	var dateFormat = d3.time.format("%Y-%m-%d");
	var skillArray = ["savoir", "savoir faire", "savoir etre", "savoir", "savoir etre", "savoir etre"];
	var totalCount = 0;
	donorschooseProjects.forEach(function(d) {
		totalCount ++;
		if(d["Year"] == null || d["Year"] == ""){
			d["Year"] = "2014";
		}
		d["Year"] = d["Year"] + "-1-1";
		d["Year"] = dateFormat.parse(d["Year"]);
		var ind = parseInt(Math.random() * 100) % 6;
		d['skill'] = skillArray[ind];
		switch(d['Average_salary_ranges']){
			case "45 k€ et plus":
				d['salary'] = 45; 
				break;
			case "de 34 k€ à 37 k€":
				d['salary'] = 35; 
				break;
			case "de 38 k€ à 44 k€":
				d['salary'] = 42; 
				break;
			case "moins de 33 k€":
				d['salary'] = 33; 
				break;
			default:
				d['salary'] = 30; 
		}
	});
	var ind1 = 0, ind2 = 0, ind3 = 0;
	savoirData1[0] = [];
	savoirData2[0] = [];
	savoirData3[0] = [];
	skillsProjects.forEach(function(d){
		
		if(d['Savoir'] != "" && d['Savoir'] != null){
			savoirData1[0][ind1] = {axis: d['Savoir'], value: Math.random()};
			ind1 ++;
		}
		if(d['Savoir_Etre'] != "" && d['Savoir_Etre'] != null){
			savoirData2[0][ind2] = {axis: d['Savoir_Etre'], value: Math.random()};
			ind2 ++;
		}
		if(d['Savoir_faire'] != "" && d['Savoir_faire'] != null){
			savoirData3[0][ind3] = {axis: d['Savoir_faire'], value: Math.random()};
			ind3 ++;
		}	
	});
	
	function fnRedrawRadar(d){
		
		for(var i=0;i<savoirData1[0].length;i++){
			savoirData1[0][i].value = Math.random();
		}
		for(var i=0;i<savoirData2[0].length;i++){
			savoirData2[0][i].value = Math.random();
		}
		for(var i=0;i<savoirData3[0].length;i++){
			savoirData3[0][i].value = Math.random();
		}
		fnDrawRadarChart(savoirData1, "#radar-chart1");
		fnDrawRadarChart(savoirData2, "#radar-chart2");
		fnDrawRadarChart(savoirData3, "#radar-chart3");
		return;
	}
	//sfilter instance
	var ndx = crossfilter(donorschooseProjects);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["Year"]; });
    var skillDim = ndx.dimension(function(d) { return d["skill"]; });
	var regionDim = ndx.dimension(function(d) { return d["Regions"]; });
	var averageDim = ndx.dimension(function(d) { return d['salary']; });
	var jobDim = ndx.dimension(function(d) { return d['Job']; });
	//Calculate metrics
	var all = ndx.groupAll();
	var numProjectsByDate = dateDim.group(); 
    var numProjectsByRegion = regionDim.group().reduceSum(function(d) {
		return 1;
	});
	var skillProjects = skillDim.group();
	var jobProjects =jobDim.group().reduceSum(function(d){ return 1;});
	var totalProjects = ndx.groupAll().reduceSum(function(d) {return 1;});
	var averageProjects = ndx.groupAll().reduceSum(function(d) {
		return d['salary'];
	});
	
	var max_Region = numProjectsByRegion.top(1)[0].value;
	var minDate = dateDim.bottom(1)[0]["Year"];
	var maxDate = dateDim.top(1)[0]["Year"];
	maxDate.setMonth(2);

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
	var jobProjectsND = dc.rowChart("#job-chart");
	var usChart = dc.geoChoroplethChart("#us-chart");
	var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	var averageND = dc.numberDisplay("#total-donations-nd");
	
	jobProjectsND
		.width(800)
		.height(600)
		.dimension(jobDim)
		.group(jobProjects)
		.xAxis().ticks(4);	

	numberProjectsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){fnRedrawRadar(d); return d;})
		.group(totalProjects)
		.formatNumber(d3.format("d"));

	averageND
		.formatNumber(d3.format(".2f"))
		.valueAccessor(function(d){
			var count = ndx.groupAll().reduceCount().value();
			if(count == 0 ) count = 1;
			return d / count; })
		.group(averageProjects)
		.formatNumber(d3.format(".2f"));

	timeChart
		.width(450)
		.height(160)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);
	resourceTypeChart
		.width(450)
		.height(200)
		.dimension(skillDim)
		.group(skillProjects)
		.xAxis().ticks(4);	
	usChart.width(500)
		.height(330)
		.dimension(regionDim)
		.group(numProjectsByRegion)
		.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
		.colorDomain([0, max_Region])
		.overlayGeoJson(statesJson["features"], "Regions", function (d) {
			return d.properties.name;
		})
		// .projection(d3.geo.albersUsa()
    	// 			.scale(600)
		// 			.translate([340, 150]))
		.projection(d3.geo.mercator()
			.center([35,44])
			.scale(1400)
			.rotate([20,0]))
		.title(function (p) {
			return "Région: " + p["key"];
			// 		+ "\n"
			// 		+ "Total Jobs: " + Math.round(p["value"]) + " $";
		})

    dc.renderAll();

};