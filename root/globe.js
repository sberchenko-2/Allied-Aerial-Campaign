// Draws a globe on the given svg element
// 
// Takes configuration from the config variable which includes:
//   - width:           the width of the globe
//   - height:          the height of the globe
//
//   - map_url:         url to load the globe's map from
//   - target_locals:   json file containing latitude / longitude coords for target markers
//   - takeoff_locals:  json file containing latitude / longitude coords for takeoff markers
//
//   - scroll_sens:     scrolling sensitivity
//   - max_zoom:        relative max zoom
//   - min_zoom:        relative min zoom
function CreateGlobe(svg, config) {
    // Set config vars
    const width          = config.width,
          height         = config.height,
          map_url        = config.map_url,
          target_locals  = config.target_locals,
          takeoff_locals = config.takeoff_locals,
          scroll_sens    = config.scroll_sens,
          max_zoom       = config.max_zoom,
          min_zoom       = config.min_zoom;
    
    // D3 const vars
    const takeoffMarkers  = svg.append('g').attr("id", "takeoff_markers"),
          targetMarkers   = svg.append('g').attr("id", "target_markers"),
          planePaths      = svg.append('g').attr("id", "plane_paths"), 
          projection      = d3.geoOrthographic(),
          initialScale    = projection.scale(),
          path            = d3.geoPath().projection(projection),
          center          = [width/2, height/2];

    // Marker data
    var takeoff_locations = [],
        target_locations  = [],
        plane_path_data   = [];
    
    // Draw globe
    drawGlobe();

    // Enable dragging
    svg.call(d3.drag().on('drag', (event, d) => {
        const rotate = projection.rotate()
        const k = scroll_sens / projection.scale()

        projection.rotate([
            rotate[0] + event.dx * k,
            rotate[1] - event.dy * k
        ])

        drag_path = d3.geoPath().projection(projection)
        svg.selectAll("path").attr("d", drag_path)

        drawMarkers();
    }));

    // Enable zooming
    svg.call(d3.zoom().on('zoom', (event, d) => {
        if (event.transform.k <= min_zoom) {
            event.transform.k = min_zoom;
        } else if (event.transform.k >= max_zoom) {
            event.transform.k = max_zoom;
        } else {
            projection.scale(initialScale * event.transform.k)
            zoom_path = d3.geoPath().projection(projection)
            svg.selectAll("path").attr("d", zoom_path)
            drawMarkers();
        }
    }))

    // Updates the data being displayed on the globe
    function updateMarkers(takeoff_markers, target_markers, path_data) {
        console.log("updating markers");

        // Remove old DOM elements
        planePaths.selectAll("path").remove();
        targetMarkers.selectAll("circle").remove();
        takeoffMarkers.selectAll("circle").remove();

        // Update data arrays and draw new markers
        takeoff_locations = takeoff_markers;
        target_locations = target_markers;
        plane_path_data = path_data;
        drawMarkers();
    }

    // Draws the globe onto the svg
    function drawGlobe() {
        // Files to load
        var files = [
            target_locals,
            takeoff_locals,
            map_url,
        ];

        // Load files then draw data
        Promise.all(files.map(url => d3.json(url))).then(function(values) {
            let targetData = values[0];
            let takeoffData = values[1];
            let worldData = values[2];

            svg.selectAll(".segment")
                .data(topojson.feature(worldData, worldData.objects.countries).features)
                .enter().append("path")
                .attr("class", "segment")
                .attr("d", path)
                .style("stroke", "#888")
                .style("stroke-width", "1px")
                .style("fill", (d, i) => '#e5e5e5')
                .style("opacity", ".6");
            
            target_locations = targetData;
            takeoff_locations = takeoffData;

            for (let i = 0; i < target_locations.length; i++) {
                plane_path_data[i] = {
                    type: "LineString",
                    coordinates: [
                        [takeoff_locations[i].longitude, takeoff_locations[i].latitude],
                        [target_locations[i].longitude, target_locations[i].latitude]
                    ]
                }
            }
            
            drawMarkers();
        });
    }
  
    // Draws the markers and paths onto the globe
    function drawMarkers() {
        let start = Date.now();

        // Propagate path data to paths
        const plane_paths = planePaths.selectAll("path")
            .data(plane_path_data);

        // Draw paths
        plane_paths
            .enter()
            .append("path")
            .attr("d", path)
            .merge(plane_paths)
            .style("stroke", "red")
            .style("fill", "none")
            .style("stroke-width", 3);

        console.log("drawing paths took " + (Date.now() - start) + "ms");
        let marker_start = Date.now();

        // Scale marker size by current zoom
        var marker_size = 3 * (projection.scale() / initialScale);
        var max_size = 5;
        marker_size = marker_size >= max_size ? max_size : marker_size;

        // Propagate marker data to markers
        const target_markers = targetMarkers.selectAll('circle')
            .data(target_locations);
        
        const takeoff_markers = takeoffMarkers.selectAll('circle')
            .data(takeoff_locations);

        // Draw markers
        target_markers
            .enter()
            .append('circle')
            .merge(target_markers)
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('fill', d => {
                const coordinate = [d.longitude, d.latitude];
                gdistance = d3.geoDistance(coordinate, projection.invert(center));
                return gdistance > 1.57 ? 'none' : 'black';
            })
            .attr('r', marker_size);

        takeoff_markers
            .enter()
            .append('circle')
            .merge(takeoff_markers)
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('fill', d => {
                const coordinate = [d.longitude, d.latitude];
                gdistance = d3.geoDistance(coordinate, projection.invert(center));
                return gdistance > 1.57 ? 'none' : 'steelblue';
            })
            .attr('r', marker_size);
        
        console.log("marker update took " + (Date.now() - marker_start) + "ms");
        marker_start = Date.now();
  
        // Ensures that the markers and paths are drawn on top of the map
        planePaths.each(function () {
            this.parentNode.appendChild(this);
        });      

        targetMarkers.each(function () {
            this.parentNode.appendChild(this);
        });
        takeoffMarkers.each(function () {
            this.parentNode.appendChild(this);
        });

        console.log("move-to-front update took " + (Date.now() - marker_start) + "ms");
        console.log("total draw update took " + (Date.now() - start) + "ms");
        console.log("target_markers has " + document.getElementById("target_markers").childElementCount + " children");
        console.log("takeoff_markers has " + document.getElementById("takeoff_markers").childElementCount + " children");
        console.log("plane_paths has " + document.getElementById("plane_paths").childElementCount + " children");
        console.log(" ");
    }

    return updateMarkers;
}