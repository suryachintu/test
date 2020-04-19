var width = 400,
    height = 400,
    speed = -1e-2,
    start = Date.now();

var sphere = {type: "Sphere"};

var projection = d3.geoOrthographic()
    .scale(width / 2.1)
    .translate([width / 2, height / 2])
    .precision(.5);

var graticule = d3.geoGraticule10();

var canvas = d3.select("body").append("canvas")
    .attr("width", width)
    .attr("height", height);

var context = canvas.node().getContext("2d");

var path = d3.geoPath()
    .projection(projection)
    .context(context);

d3.json("world-110m-simple.json", function(error, topo) {
  if (error) throw error;

  var land = topojson.feature(topo, topo.objects.land),
      grid = graticule;

  d3.timer(function() {
    context.clearRect(0, 0, width, height);

    projection.rotate([speed * (Date.now() - start), -15]).clipAngle(90);

    context.beginPath();
    path({type: "Sphere"});
    context.lineWidth = 0;
    context.strokeStyle = "transparent";
    context.stroke();
    context.fillStyle = "rgba(1, 1, 1, 1)";
    context.fill();


    projection.clipAngle(180);

    context.beginPath();
    path(land);
    context.fillStyle = "rgba(89, 18, 18, 0.8)";
    context.fill();

    context.beginPath();
    path(grid);
    context.lineWidth = .5;
    context.strokeStyle = "rgba(119,119,119,0)";
    context.stroke();

    projection.clipAngle(90);

    context.beginPath();
    path(land);
    context.fillStyle = "#d63031";
    context.fill();
    context.lineWidth = 0;
    context.strokeStyle = "transparent";
    context.stroke();

   });
});

d3.select(self.frameElement).style("height", height + "px");