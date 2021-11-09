// Draws a globe on the given svg element
// 
// Takes configuration from the config variable which includes:
//   - width:           the width of the globe
//   - height:          the height of the globe
//
//   - map_url:         url to load the globe's map from
//   - marker_file:     json file containing latitude / longitude coords
//
//   - scroll_sens:     scrolling sensitivity
//   - max_zoom:        relative max zoom
//   - min_zoom:        relative min zoom
//
//   - draw_graticule:  whether or not to draw graticule
function CreateGlobe(svg, config) {
    // Set config vars
    const width          = config.width,
          height         = config.height,
          map_url        = config.map_url,
          marker_file    = config.marker_file,
          scroll_sens    = config.scroll_sens,
          max_zoom       = config.max_zoom,
          min_zoom       = config.min_zoom;
          draw_graticule = config.draw_graticule
    
    // D3 const vars
    const markerGroup  = svg.append('g'),
          projection   = d3.geoOrthographic(),
          initialScale = projection.scale(),
          path         = d3.geoPath().projection(projection),
          center       = [width/2, height/2];
    
    // Draw globe
    drawGlobe();
    if (draw_graticule) {
        drawGraticule()
    }

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

    // Draws the globe onto the svg
    function drawGlobe() {
        // Files to load
        var files = [
            marker_file,
            map_url,
        ];

        // Load files then draw data
        Promise.all(files.map(url => d3.json(url))).then(function(values) {
            let locationData= values[0];
            let worldData = values[1];

            svg.selectAll(".segment")
                .data(topojson.feature(worldData, worldData.objects.countries).features)
                .enter().append("path")
                .attr("class", "segment")
                .attr("d", path)
                .style("stroke", "#888")
                .style("stroke-width", "1px")
                .style("fill", (d, i) => '#e5e5e5')
                .style("opacity", ".6");
                locations = locationData;
                drawMarkers();  
        });
    }
  
    // Draws the markers onto the globe
    function drawMarkers() {
        const markers = markerGroup.selectAll('circle')
            .data(locations);
        markers
            .enter()
            .append('circle')
            .merge(markers)
            .attr('cx', d => projection([d.longitude, d.latitude])[0])
            .attr('cy', d => projection([d.longitude, d.latitude])[1])
            .attr('fill', d => {
                const coordinate = [d.longitude, d.latitude];
                gdistance = d3.geoDistance(coordinate, projection.invert(center));
                return gdistance > 1.57 ? 'none' : 'steelblue';
            })
            .attr('r', 7);
  
        markerGroup.each(function () {
            this.parentNode.appendChild(this);
        });
    }

    // Draws the graticule onto the globe
    function drawGraticule() {
        const graticule = d3.geoGraticule()
            .step([10, 10]);
  
        svg.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path)
            .style("fill", "#fff")
            .style("stroke", "#ccc");
    }     
}