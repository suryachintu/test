//
// Configuration
//

// ms to wait after dragging before auto-rotating
var rotationDelay = 3000
// scale of the globe (not the canvas element)
var scaleFactor = 0.9
// autorotation speed
var degPerSec = 6
// start angles
var angles = { x: 40, y: 40, z: 0}
// colors
var colorWater = '#2c3e50'
var colorLand = '#2ecc71'
var colorGraticule = colorWater
var colorCountry = '#fff'


//
// Handler
//

function enter(country) {
  var country = countryList.find(function(c) {
    return c.id === country.id
  })
  current.text(country && country.name || '')
}

function leave(country) {
  current.text('')
}

//
// Variables
//

var current = d3.select('#current')
var canvas = d3.select('#globe')
var context = canvas.node().getContext('2d')
var water = {type: 'Sphere'}
var projection = d3.geoOrthographic().precision(0.1)
var graticule = d3.geoGraticule10()
var path = d3.geoPath(projection).context(context)
var v0 // Mouse position in Cartesian coordinates at start of drag gesture.
var r0 // Projection rotation as Euler angles at start.
var q0 // Projection rotation as versor at start.
var lastTime = d3.now()
var degPerMs = degPerSec / 1000
var width, height
var land, countries
var countryList
var autorotate, now, diff, roation
var currentCountry

//
// Functions
//

function setAngles() {
  var rotation = projection.rotate()
  rotation[0] = angles.y
  rotation[1] = angles.x
  rotation[2] = angles.z
  projection.rotate(rotation)
}

function scale() {
  width = document.documentElement.clientWidth
  height = document.documentElement.clientHeight
  canvas.attr('width', width).attr('height', height)
  projection
    .scale((scaleFactor * Math.min(width, height)) / 2)
    .translate([width / 2, height / 2])
  render()
}

function startRotation(delay) {
  autorotate.restart(rotate, delay || 0)
}

function stopRotation() {
  autorotate.stop()
}

function dragstarted() {
  console.log("drag")
  v0 = versor.cartesian(projection.invert(d3.mouse(this)))
  r0 = projection.rotate()
  q0 = versor(r0)
  stopRotation()
}

function dragged() {
  var v1 = versor.cartesian(projection.rotate(r0).invert(d3.mouse(this)))
  var q1 = versor.multiply(q0, versor.delta(v0, v1))
  var r1 = versor.rotation(q1)
  projection.rotate(r1)
  render()
}

function dragended() {
  startRotation(rotationDelay)
}

function render() {
  context.clearRect(0, 0, width, height)
  fill(water, colorWater)
//  stroke(graticule, colorGraticule)
  fill(land, colorLand, currentCountry, colorCountry)
  if (currentCountry) {
//    fill(currentCountry, colorCountry)
  }
}

function fill_country(obj, color){
  context.beginPath()
  path(obj)
  context.fillStyle = color
  context.fill()
}

function fill(obj, color, currentCountry, colorCountry) {
//  context.beginPath()
//  path(obj)
//  context.fillStyle = color
//  context.fill()
    context.beginPath();
    path({type: "Sphere"});
    context.lineWidth = 0;
    context.strokeStyle = "transparent";
    context.stroke();
    context.fillStyle = "rgba(1, 1, 1, 1)";
    context.fill();

    projection.clipAngle(180);

    context.beginPath();
    path(obj);
    context.fillStyle = "rgba(89, 18, 18, 0.8)";
    context.fill();

    context.beginPath();
    path(graticule);
    context.lineWidth = .5;
    context.strokeStyle = "rgba(119,119,119,0)";
    context.stroke();

    projection.clipAngle(90);

    context.beginPath();
    path(obj);
    context.fillStyle = "#d63031";
    context.fill();
    context.lineWidth = 0;
    context.strokeStyle = "transparent";
    context.stroke();

    if (currentCountry){
        context.beginPath()
        path(currentCountry)
        context.fillStyle = colorCountry
        context.fill()
    }
}

function stroke(obj, color) {
  context.beginPath()
  path(obj)
  context.strokeStyle = color
  context.stroke()
}

function rotate(elapsed) {
  now = d3.now()
  diff = now - lastTime
  if (diff < elapsed) {
    rotation = projection.rotate()
    rotation[0] += diff * degPerMs
    projection.rotate(rotation)
    render()
  }
  lastTime = now
}

function loadData(cb) {
  d3.json('https://unpkg.com/world-atlas@1/world/110m.json', function(error, world) {
    if (error) throw error
    d3.tsv('https://gist.githubusercontent.com/mbostock/4090846/raw/07e73f3c2d21558489604a0bc434b3a5cf41a867/world-country-names.tsv', function(error, countries) {
      if (error) throw error
      cb(world, countries)
    })
  })
}

// https://github.com/d3/d3-polygon
function polygonContains(polygon, point) {
  var n = polygon.length
  var p = polygon[n - 1]
  var x = point[0], y = point[1]
  var x0 = p[0], y0 = p[1]
  var x1, y1
  var inside = false
  for (var i = 0; i < n; ++i) {
    p = polygon[i], x1 = p[0], y1 = p[1]
    if (((y1 > y) !== (y0 > y)) && (x < (x0 - x1) * (y - y1) / (y0 - y1) + x1)) inside = !inside
    x0 = x1, y0 = y1
  }
  return inside
}

function mousemove() {
  var c = getCountry(this)
  if (!c) {
    if (currentCountry) {
      leave(currentCountry)
      currentCountry = undefined
      render()
    }
    return
  }
  if (c === currentCountry) {
    return
  }
  currentCountry = c
  render()
  enter(c)
}

function getCountry(event) {
  var pos = projection.invert(d3.mouse(event))
  return countries.features.find(function(f) {
    return f.geometry.coordinates.find(function(c1) {
      return polygonContains(c1, pos) || c1.find(function(c2) {
        return polygonContains(c2, pos)
      })
    })
  })
}


//
// Initialization
//

setAngles()

canvas
  .call(d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
   )
  .on('mousemove', mousemove)

loadData(function(world, cList) {
  land = topojson.feature(world, world.objects.land)
  countries = topojson.feature(world, world.objects.countries)
  countryList = cList

  window.addEventListener('resize', scale)
  scale()
  autorotate = d3.timer(rotate)
})


//d3.select("canvas").call(d3.zoom().scaleExtent([1, 8]).on("zoom", zoom));
//
//function zoom() {
//  stopRotation();
//  var transform = d3.event.transform;
//  context.save();
//  context.clearRect(0, 0, width, height);
//  context.translate(transform.x, transform.y);
//  context.scale(transform.k, transform.k);
//  render();
//  context.restore();
////  autorotate.start();
//
////  context.restore();
//}
