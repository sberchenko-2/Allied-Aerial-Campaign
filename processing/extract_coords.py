"""
Used to extract takeoff + target coordinates from the THOR dataset into json
"""
import json
import pandas as pd
import math

# Load in dataset
src_dir = "C:/Users/sberc/Documents/My Files/UW/Classes/Computer Science/CSE 442/UW-Solar-Visualization"
df = pd.read_csv(f"{src_dir}/data/THOR_WWII_DATA_CLEAN.csv", encoding='latin-1')

# Convert to lists
takeoff_longitude = list(df["TAKEOFF_LONGITUDE"])
takeoff_latitude = list(df["TAKEOFF_LATITUDE"])
target_longitude = list(df["LONGITUDE"])
target_latitude = list(df["LATITUDE"])
base_names = list(df["TAKEOFF_BASE"])
theatres = list(df["THEATER"])

# Initialize arrays
takeoff = []
target = []

# Fill in arrays, get rid of any nulls and wierd outliers - the dataset isn't perfect :( 
rows = len(takeoff_longitude)
for i in range(rows):
    take_lon = takeoff_longitude[i]
    take_lat = takeoff_latitude[i]
    targ_lon = target_longitude[i]
    targ_lat = target_latitude[i]
    base_name = base_names[i]
    theatre = theatres[i]

    # Get rid of an entry if any coords are NaN (most of the takeoff coords are NaN)
    if math.isnan(take_lon) or math.isnan(take_lat) or math.isnan(targ_lon) or math.isnan(targ_lat):
        continue
    
    # Set NaN / unknown values
    if type(base_name) != type(""):
        base_name = "Unknown"
    
    if type(theatre) != type(""):
        theatre = "Unknown"

    # I'm pretty sure the Allies didn't fly 300+ missions out of the poles ◔_◔
    if take_lat > 4000 or targ_lat > 4000:
        continue

    # Nor was there ever a mission leaving from Tunisia to bomb Japan @_@
    if abs(targ_lat - 32.9) <= 0.1 and abs(targ_lon - 132.07) <= 0.1 and \
       abs(take_lat - 31.87) <= 0.1 and abs(take_lon - 24.40) <= 0.1:
        continue
    
    # Add coords to arrays
    takeoff.append({
        "longitude": take_lon,
        "latitude": take_lat,
        "base_name": base_name,
        "theatre": theatre
    })
    target.append({
        "longitude": targ_lon,
        "latitude": targ_lat
    })

print(f"Originally had {rows} datapoints, after cleaning only have {len(target)}")

# Convert arrays to json objects and save them
with open(f"{src_dir}/data/takeoff_locations.json", "w") as f:
    json.dump(takeoff, f)

with open(f"{src_dir}/data/target_locations.json", "w") as f:
    json.dump(target, f)
