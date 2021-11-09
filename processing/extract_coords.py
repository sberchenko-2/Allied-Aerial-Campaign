"""
Used to extract takeoff + target coordinates from the THOR dataset into json
"""
import json
import pandas as pd
import math
import string

# Load in dataset
src_dir = "C:/Users/sberc/Documents/My Files/UW/Classes/Computer Science/CSE 442/UW-Solar-Visualization"
df = pd.read_csv(f"{src_dir}/data/THOR_WWII_DATA_CLEAN.csv", encoding='latin-1')

# Convert to lists
takeoff_longitude = list(df["TAKEOFF_LONGITUDE"])
takeoff_latitude = list(df["TAKEOFF_LATITUDE"])
target_longitude = list(df["LONGITUDE"])
target_latitude = list(df["LATITUDE"])
base_names = list(df["TAKEOFF_BASE"])
theaters = list(df["THEATER"])
tgt_types = list(df["TGT_TYPE"])
ac_attackings = list(df["AC_ATTACKING"])
ac_names = list(df["AIRCRAFT_NAME"])
total_tons = list(df["TOTAL_TONS"])
msn_dates = list(df["MSNDATE"])

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
    theater = theaters[i]
    tgt = tgt_types[i]
    ac_attacking = ac_attackings[i]
    ac_name = ac_names[i]
    total_ton = total_tons[i]
    msn_date = msn_dates[i]

    # Get rid of an entry if any coords are NaN (most of the takeoff coords are NaN)
    if math.isnan(take_lon) or math.isnan(take_lat) or math.isnan(targ_lon) or math.isnan(targ_lat):
        continue
    
    # Set NaN / unknown values
    if type(base_name) != type(""):
        base_name = "Unknown"
    
    if type(theater) != type(""):
        theater = "Unknown"

    if type(tgt) != type(""):
        tgt = "Unidentified Target" 
    
    if math.isnan(ac_attacking):
        ac_attacking = "Unknown"
    
    if type(ac_name) != type(""):
        ac_name = "Unknown"
    
    if math.isnan(total_ton):
        total_ton = "Unknown"
    
    if type(msn_date) != type(""):
        msn_date = "Unknown"

    # I'm pretty sure the Allies didn't fly 300+ missions out of the poles ◔_◔
    if take_lat > 4000 or targ_lat > 4000:
        continue

    # Nor was there ever a mission leaving from Tunisia to bomb Japan @_@
    if abs(targ_lat - 32.9) <= 0.1 and abs(targ_lon - 132.07) <= 0.1 and \
       abs(take_lat - 31.87) <= 0.1 and abs(take_lon - 24.40) <= 0.1:
        continue
    
    # Make strings look nice
    tgt = string.capwords(tgt)
    
    base_name = string.capwords(base_name)
    base_name = base_name.replace("Raf ", "RAF ")

    org = ac_name
    ac_name = string.capwords(ac_name)
    for e in org:
        if e.isdigit():
            ac_name = org
            break

    # Add coords to arrays
    takeoff.append({
        "longitude": take_lon,
        "latitude": take_lat,
        "base_name": base_name,
        "theater": theater,
        "ac_attacking": ac_attacking,
        "ac_name": ac_name,
        "total_tons": total_ton,
        "msn_date": msn_date,
    })
    target.append({
        "longitude": targ_lon,
        "latitude": targ_lat,
        "tgt_type": tgt,
    })

print(f"Originally had {rows} datapoints, after cleaning only have {len(target)}")

# Convert arrays to json objects and save them
with open(f"{src_dir}/data/takeoff_locations.json", "w") as f:
    json.dump(takeoff, f)

with open(f"{src_dir}/data/target_locations.json", "w") as f:
    json.dump(target, f)
