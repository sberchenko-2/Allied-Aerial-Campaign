// Contains util functions for tooltips

// Shows the tooltip with the given id
function show_tooltip(id) {
    let tooltip = document.getElementById(id);
    tooltip.style.visibility = "visible";
}

// Hides the tooltip with the given id
function hide_tooltip(id) {
    let tooltip = document.getElementById(id);
    tooltip.style.visibility = "hidden";
}

// Sets the position of the tooltip
function set_tooltip_pos(id, left, top) {
    let tooltip = document.getElementById(id);
    tooltip.style.left = left + "px";
    tooltip.style.top  = top  + "px";
}

// Sets the html of the tooltip
function set_tooltip_html(id, html) {
    let tooltip = document.getElementById(id);
    tooltip.innerHTML = html;
}