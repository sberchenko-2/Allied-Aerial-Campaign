# Overview

This repository serves as my submission for [CSE 442 A3](https://courses.cs.washington.edu/courses/cse442/21au/a3.html). The final visualization can be viewed [here](https://sberchenko-2.github.io/Allied-Aerial-Campaign/).

# Development Process

I worked on this project by myself and began by firstly selecting the dataset I wanted to explore. I searched through Kaggle and [Awesome-Public-Datasets](https://github.com/awesomedata/awesome-public-datasets) until I found the [World War II THOR Dataset](https://data.world/datamil/world-war-ii-thor-data). This dataset documents the Allies’ aerial bombings during World War II, primarily by the RAF and USAAF. 

After deciding on the THOR dataset, I spent some time exploring the data and experimenting with various visualization techniques. 

I decided that the main aspect of the THOR dataset I wanted to focus on was the various paths that bombing operations had been flown on. Although I didn’t have one central question, there were several aspects I wanted to explore, such as:

-	Did Allied bombing runs tend to avoid certain airspaces?
-	Where did the Allies locate most of their major airbases?
-	Which regions under Axis control had the most ordinance dropped on it?

However, I later realized that showcasing the full scale of the Allied aerial campaign wasn’t possible due to limitations in the THOR dataset. Although the dataset contains entries for over 175,000 bombing operations, less than 3,000 of those entries contain key information such as the takeoff location. Additionally, the dataset has a large focus on the Mediterranean theater of operations while lacking key areas such as the Soviet front or the major bombings of the Reich. 

However, since there isn’t a better dataset to visualize the Allied aerial campaign and I had already dedicated a large amount of time to the THOR dataset, I decided to forge ahead. Consequentially, I decided to focus solely on visualizing the paths, takeoff locations, and target locations that the Allies bombed during WWII. 

In order to accomplish this, I determined that the best way to display the data would be on a graph, due to the geographical nature of the bombing-flight paths. Furthermore, to accurately display the paths of the bombing operations I decided to plot the data onto a 3D globe so that the paths wouldn’t be distorted by a flat projection. Additionally, to ensure that the viewer could easily interpret the visualization I resolved to display the paths on an accurate map of WWII borders, rather than on modern-day borders. 

Besides just viewing the different flight paths though, I wanted to allow the viewer to explore the THOR dataset fully and dynamically. Consequentially, I decided that when the user hovered over a marker or path additional information would be displayed via a tooltip. After exploring through the THOR dataset some more, I curated the available information into a small subset that would be of interest to a viewer including:

-	Mission date
-	Takeoff base name
-	Target type
-	Number of planes involved in operation
-	Type of aircraft used
-	Tons of ordinance dropped

Once I’d formulated my initial design, I began programming to get a first prototype set up. This initial stage involved the completion of the following features:

-	3D globe & map interaction (dragging, zooming)
-	Projecting markers + paths onto the globe
-	Extracting and cleaning data from THOR
-	Hover effects for markers + paths
-	Tooltip integration

These first features took around 10ish hours to complete and code up (when factoring in the time to setup GitHub pages as well). Do note that the 3D globe and map interaction was built based on guidance from two different D3 examples – shown [here](https://observablehq.com/@jnschrag/draggable-globe-in-d3) and [here](https://bl.ocks.org/atanumallick/8d18989cd538c72ae1ead1c3b18d7b54).

Afterwards, I showed the initial prototype to some of my roommates to receive feedback. I then drafted up the next set of features / changes I wanted to incorporate and worked on getting a secondary prototype completed. This involved adding in:

-	Legend + Title
-	Showing historical borders for countries
-	Coloring countries based on Allied / Axis / Neutral

I got the GeoJSON for the historical borders from Historical-Basemaps. However, there were several errors and inconsistencies within the GeoJSON that I had to spend extensive time trying to fix. Additionally, coloring countries based on whether they were part of the Allies or Axis turned out to be a more challenging task than I thought. Since different territories were occupied at different points in the war and several countries swapped from supporting one side to the another, there are probably some inaccuracies in the map. Please understand that I am a CS student and not a historian. Any mistakes in the geography / borders in the map are due to my ignorance and are not intended to cause offense or harm. 

These additional features took around 5ish hours to integrate. By this point, the due date of the project had arrived, and I focused on cleaning up the code and finalizing the overall style. Additional features that I would have liked to add if time permitted include:

-	Filter which paths are shown (based on mission date, ordinance, etc.)
-	Smoother dragging
-	Click on a country to show relevant information
-	Always display country names on the map, rather than just on hover
