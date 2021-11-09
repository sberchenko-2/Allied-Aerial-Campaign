"""
Used to extract takeoff + target coordinates from the THOR dataset
"""
import json
import pandas as pd
import math

# Load in dataset
src_dir = "C:/Users/sberc/Documents/My Files/UW/Classes/Computer Science/CSE 442/UW-Solar-Visualization"
df = pd.read_csv(f"{src_dir}/data/THOR_WWII_DATA_CLEAN.csv", encoding='latin-1')

# Select relevant columns
df = df[["TAKEOFF_LONGITUDE", "TAKEOFF_LATITUDE", "LONGITUDE", "LATITUDE"]]

# Convert to lists
takeoff_longitude = list(df["TAKEOFF_LONGITUDE"])
takeoff_latitude = list(df["TAKEOFF_LATITUDE"])
target_longitude = list(df["LONGITUDE"])
target_latitude = list(df["LATITUDE"])

# Initialize arrays
takeoff = []
target = []

# Fill in arrays, get rid of any nulls and wierd outliers ( the dataset isn't perfect :( )
rows = len(takeoff_longitude)
for i in range(rows):
    take_lon = takeoff_longitude[i]
    take_lat = takeoff_latitude[i]
    targ_lon = target_longitude[i]
    targ_lat = target_latitude[i]

    if math.isnan(take_lon) or math.isnan(take_lat) or math.isnan(targ_lon) or math.isnan(targ_lat):
        continue

    # I'm pretty sure the Allies didn't fly 300+ missions out of the poles ◔_◔
    if take_lat > 4000 or targ_lat > 4000:
        continue
    
    takeoff.append({
        "longitude": take_lon,
        "latitude": take_lat
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
