queue()
   .defer(d3.json, "/donorsUS/projects") /*sending a root and hopefully return data as json*/
   .defer(d3.json, "static/geojson/us-states.json")
   .await(makeGraphs);/* when data is back, calls makeGraphs function*/

function makeGraphs(error, projectsJson, statesJson)/*projectsJson is the data now in Json format. see's no errors and has the 55000 rows of data  */
{

   //Clean projectsJson data
   var donorsUSProjects = projectsJson; /*storing the json data to a variable name donorsUSProject   */
   var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");/*cleaning up the data and formatting it to European dat format   */
   donorsUSProjects.forEach(function (d)/* loop through the records  */
   {
       d["date_posted"] = dateFormat.parse(d["date_posted"]);/* setting the "date posted" to european format by parsing it with the dateFormant above */
       d["date_posted"].setDate(1);
       d["total_donations"] = +d["total_donations"]; /*converting to a number as the data coming in is always string format. so we convert to numbers to be able to sum numbers   */
   });


   //Create a Crossfilter instance
   var ndx = crossfilter(donorsUSProjects);/*crossfilter joins all data together to have some relationship. we pass in the data that came back in */

   //Define Dimensions
   var dateDim = ndx.dimension(function (d)
   {
       return d["date_posted"];
   });
   var resourceTypeDim = ndx.dimension(function (d)
   {
       return d["resource_type"];
   });
   var povertyLevelDim = ndx.dimension(function (d)
   {
       return d["poverty_level"];
   });
   var stateDim = ndx.dimension(function (d)
   {
       return d["school_state"];
   });
   var totalDonationsDim = ndx.dimension(function (d)
   {
       return d["total_donations"];
   });

   var fundingStatus = ndx.dimension(function (d)
   {
       return d["funding_status"];
   });

   var primaryfocusareaDim = ndx.dimension(function (d)
   {
       return d["primary_focus_area"];
   });


   //Calculate metrics
   var numProjectsByDate = dateDim.group();
   var numProjectsByResourceType = resourceTypeDim.group();
   var numProjectsByPovertyLevel = povertyLevelDim.group();
   var numProjectsByFundingStatus = fundingStatus.group();
   var numProjectByFocusarea = primaryfocusareaDim.group();
   /* total sum of donations*/
   var totalDonationsByState = stateDim.group().reduceSum(function (d) {
       return d["total_donations"];
   });

   /*total sum by each state*/
   var stateGroup = stateDim.group();


   var all = ndx.groupAll();
   var totalDonations = ndx.groupAll().reduceSum(function (d)
   {
       return d["total_donations"];
   });

   var max_state = totalDonationsByState.top(1)[0].value;

   //Define values (to be used in charts)
   var minDate = dateDim.bottom(1)[0]["date_posted"];
   var maxDate = dateDim.top(1)[0]["date_posted"];

   //Charts /* 6 charts, 6 Div IDs*/
   var timeChart = dc.barChart("#time-chart");
   var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
   var povertyLevelChart = dc.rowChart("#poverty-level-row-chart");
   var numberProjectsND = dc.numberDisplay("#number-projects-nd");
   var totalDonationsND = dc.numberDisplay("#total-donations-nd");
   var fundingStatusChart = dc.pieChart("#funding-chart");
   var primaryfocusAreaChart = dc.rowChart("#primary-focus-area-row-chart");
   var usaChart = dc.geoChoroplethChart("#us-chart");

   selectField = dc.selectMenu('#menu-select')
       .dimension(stateDim)
       .group(stateGroup);


   numberProjectsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d)
       {
           return d;
       })
       .group(all);

   totalDonationsND
       .formatNumber(d3.format("d"))
       .valueAccessor(function (d)
       {
           return d;
       })
       .group(totalDonations)
       .formatNumber(d3.format(".3s"));

   /*setting up properties of the timeChart  */
   timeChart
       .width(800)
       .height(200)
       .margins({top: 10, right: 50, bottom: 30, left: 50})
       .dimension(dateDim)
       .group(numProjectsByDate)
       .transitionDuration(500)
       .x(d3.time.scale().domain([minDate, maxDate]))/*oldest date to the most recent date  */
       .elasticY(true)
       .xAxisLabel("Year")
       .yAxis().ticks(4);


   resourceTypeChart
       .ordinalColors(['#D7D727','#0067E7','#D79327','#D7329F','#2BD7E7','#D72227'] )
       .width(300)
       .height(250)
       .dimension(resourceTypeDim)
       .group(numProjectsByResourceType)
       .xAxis().ticks(4);

   povertyLevelChart
       .ordinalColors(['#0067E7','#D79327','#2BD7E7','#D72227'] )
       .width(300)
       .height(250)
       .dimension(povertyLevelDim)
       .group(numProjectsByPovertyLevel)
       .xAxis().ticks(4);

   primaryfocusAreaChart
       .ordinalColors(['#D7329F','#D72227','#D79327','#D7D727','#2BD7E7','#0067E7','#00672A'] )
       .width(300)
       .height(250)
       .dimension(primaryfocusareaDim)
       .group(numProjectByFocusarea)
       .xAxis().ticks(4);

   fundingStatusChart
       .ordinalColors(['#0067E7','#D72227','#D79327'] )
       .height(220)
       .radius(90)
       .innerRadius(40)/*this give its donut shape */
       .transitionDuration(1500)
       .dimension(fundingStatus)
       .group(numProjectsByFundingStatus);

   usaChart.width(1000)
        .height(330)
        .dimension(stateDim)
        .group(totalDonationsByState)
        .colors(['#2BD7E7', '#D79327', '#9ED2FF', '#D7329F', '#6BBAFF', '#00672A', '#36A2FF', '#1E96FF', '#0089FF', '#D72227'])
        .colorDomain([0, max_state])
        .overlayGeoJson(statesJson["features"], "state", function (d) {
            return d.properties.name;
        })
        .projection(d3.geo.albersUsa()
            .scale(600)
            .translate([340, 150]))


   dc.renderAll(); /*renderall responsable to run the whole thing */
}