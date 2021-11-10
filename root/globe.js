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
    const map_url        = config.map_url,
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
          tgt_tooltip     = "base_tooltip",
          tkf_tooltip     = "base_tooltip",
          path_tooltip    = "base_tooltip";

    // Plotting data
    var takeoff_locations = [],
        target_locations  = [],
        plane_path_data   = [];

    // Globe's variables
    var show_paths = true,
        show_trgts  = true,
        show_tkofs  = true;
    
    // Draw globe and enable interaction
    drawGlobe();
    enableDragging();
    enableZooming();

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
            console.log(worldData)

            // Add background
            svg.append('path')
                .datum({
                    type: 'Sphere'
                })
                .style('cursor', 'grab')
                .attr('fill', 'lightblue')
                .attr('d', path);

            svg.selectAll(".path")
                .data(worldData.features)
                .enter().append("path")
                .attr("class", "path")
                .attr("d", path)
                .style("stroke", "#888")
                .style("stroke-width", "1px")
                .style("fill", function (d, i) { return '#e5e5e5'})
                .style("opacity", "0.6")
                .style('cursor', 'grab')
                ;
            
            target_locations = targetData;
            takeoff_locations = takeoffData;

            for (let i = 0; i < target_locations.length; i++) {
                plane_path_data[i] = {
                    type: "LineString",
                    coordinates: [
                        [takeoff_locations[i].longitude, takeoff_locations[i].latitude],
                        [target_locations[i].longitude, target_locations[i].latitude]
                    ],
                    ac_attacking: takeoff_locations[i].ac_attacking,
                    ac_name:      takeoff_locations[i].ac_name,
                    total_tons:   takeoff_locations[i].total_tons,
                    msn_date:     takeoff_locations[i].msn_date,
                }
            }
            
            updateGraph();
        });
    }

    // Enables dragging the globe to rotate it
    function enableDragging() {
        svg.call(d3.drag().on('drag', (event, d) => {
            const rotate = projection.rotate()
            const k = scroll_sens / projection.scale()

            projection.rotate([
                rotate[0] + event.dx * k,
                rotate[1] - event.dy * k
            ])

            drag_path = d3.geoPath().projection(projection)
            svg.selectAll("path").attr("d", drag_path)

            updateGraph();
        }));
    }

    // Enables zooming in / out of the globe
    function enableZooming() {
        svg.call(d3.zoom().on('zoom', (event, d) => {
            if (event.transform.k <= min_zoom) {
                event.transform.k = min_zoom;
            } else if (event.transform.k >= max_zoom) {
                event.transform.k = max_zoom;
            } else {
                projection.scale(initialScale * event.transform.k)
                zoom_path = d3.geoPath().projection(projection)
                svg.selectAll("path").attr("d", zoom_path)
                updateGraph();
            }
        }))
    }

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
        
        updateGraph();
    }

    // Draws the paths onto the globe
    function drawPaths() {
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
            .style("stroke-width", 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                let trgt = event.currentTarget;

                // Show tooltip
                let tooltip_text = "Mission Date: " + d.msn_date + 
                                   "<br/>Number of Aircraft Involved: " + d.ac_attacking + 
                                   "<br/>Type of Aircraft Used: " + d.ac_name + 
                                   "<br/>Tons of Ordinance Dropped: " + d.total_tons;
                set_tooltip_pos(path_tooltip, event.pageX, event.pageY)
                set_tooltip_html(path_tooltip, tooltip_text);
                show_tooltip(path_tooltip);

                d3.select(trgt).transition()
                    .duration('50')
                    .style("stroke", "black");  
                trgt.parentNode.appendChild(trgt);
            })
            .on('mouseout', (event, d) => {
                // Hide tooltip
                hide_tooltip(path_tooltip)

                d3.select(event.currentTarget).transition()
                    .duration('50')
                    .style("stroke", "red");
            });

        // Ensures that the markers and paths are drawn on top of the map
        planePaths.each(function () {
            this.parentNode.appendChild(this);
        });
    }
  
    // Draws the markers onto the globe
    function drawMarkers() {
        // Scale marker size by current zoom
        var marker_size = 3 * (projection.scale() / initialScale);
        var max_size = 3;
        marker_size = marker_size >= max_size ? max_size : marker_size;

        // Draw target markers
        if (show_trgts) {
            // Propagate marker data to markers
            const target_markers = targetMarkers.selectAll('circle')
            .data(target_locations);

            // Draw markers
            target_markers
                .enter()
                .append('circle')
                .merge(target_markers)
                .attr('cx', d => projection([d.longitude, d.latitude])[0])
                .attr('cy', d => projection([d.longitude, d.latitude])[1])
                .attr('fill', d => {
                    let c = path({type: 'Point', coordinates: [d.longitude, d.latitude]});
                    return !c ? 'none' : 'black';
                })
                .attr('r', marker_size)

                .attr('stroke-width', 2)
                .on('mouseover', (event, d) => {
                    let trgt = event.currentTarget;

                    // Show tooltip
                    let tooltip_text = "Target Type: " + d.tgt_type;
                    set_tooltip_pos(tgt_tooltip, event.pageX, event.pageY)
                    set_tooltip_html(tgt_tooltip, tooltip_text);
                    show_tooltip(tgt_tooltip);

                    d3.select(trgt).transition()
                        .duration('250')
                        .style("stroke", "white")
                        .attr("r", marker_size + 2)
                    trgt.parentNode.appendChild(trgt);
                })
                .on('mouseout', (event, d) => {
                    let trgt = event.currentTarget;

                    // Hide tooltip
                    hide_tooltip(tgt_tooltip);

                    d3.select(trgt).transition()
                        .duration('250')
                        .style("stroke", "none")
                        .attr("r", marker_size);
                    trgt.parentNode.appendChild(trgt);
                });

            // Ensures that the markers and paths are drawn on top of the map
            targetMarkers.each(function () {
                this.parentNode.appendChild(this);
            });
        }
        
        // Draw takeoff markers
        if (show_tkofs) {
            // Propagate marker data to markers
            const takeoff_markers = takeoffMarkers.selectAll('circle')
                .data(takeoff_locations);
            
            // Draw markers
            takeoff_markers
                .enter()
                .append('circle')
                .merge(takeoff_markers)
                .attr('cx', d => projection([d.longitude, d.latitude])[0])
                .attr('cy', d => projection([d.longitude, d.latitude])[1])
                .attr('fill', d => {
                    let c = path({type: 'Point', coordinates: [d.longitude, d.latitude]});
                    return !c ? 'none' : 'steelblue';
                })
                .attr('r', marker_size)

                .style('cursor', 'pointer')
                .style("stroke-width", 2)
                .on('mouseover', (event, d) => {
                    let trgt = event.currentTarget;

                    // Show tooltip
                    let tooltip_text = "Base Name: " + d.base_name;
                    set_tooltip_pos(tkf_tooltip, event.pageX, event.pageY)
                    set_tooltip_html(tkf_tooltip, tooltip_text);
                    show_tooltip(tkf_tooltip);

                    d3.select(trgt).transition()
                        .duration('250')
                        .style("stroke", "white")
                        .attr("r", marker_size + 2)
                    trgt.parentNode.appendChild(trgt);
                })
                .on('mouseout', (event, d) => {
                    let trgt = event.currentTarget;

                    // Hide tooltip
                    hide_tooltip(tkf_tooltip)

                    d3.select(trgt).transition()
                        .duration('250')
                        .style("stroke", "none")
                        .attr("r", marker_size);
                    trgt.parentNode.appendChild(trgt);
                });
            
            // Ensures that the markers and paths are drawn on top of the map
            takeoffMarkers.each(function () {
                this.parentNode.appendChild(this);
            });
        }
    }

    // Update graph's display
    function updateGraph() {
        let start = Date.now();

        if (show_paths) {
            drawPaths();
        }
        let path_time = Date.now() - start;

        let section_start = Date.now();
        drawMarkers();
        let marker_time = Date.now() - section_start;

        console.log("drawing paths took " + path_time + "ms");
        console.log("drawing markers took " + marker_time + "ms");
        console.log("update cycle took " + (Date.now() - start) + "ms");
        console.log(" ");
    }

    function set_show_paths(val) {
        show_paths = val;

        if (!show_paths) {
            planePaths.selectAll("path").remove();
        } else {
            updateGraph();
        }
    }

    function set_show_tkofs(val) {
        show_tkofs = val;

        if (!show_tkofs) {
            takeoffMarkers.selectAll("circle").remove();
        } else {
            updateGraph();
        }
    }

    function set_show_trgts(val) {
        show_trgts = val;

        if (!show_trgts) {
            targetMarkers.selectAll("circle").remove();
        } else {
            updateGraph();
        }
    }

    return {
        updateMarkers: updateMarkers,
        set_show_paths: set_show_paths,
        set_show_tkofs: set_show_tkofs,
        set_show_trgts: set_show_trgts
    };
}