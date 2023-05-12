import React from 'react';
import './App.css';
import {useState, useEffect} from "react";
import Map, {Marker} from 'react-map-gl';
import { Interface } from "./interface";
import 'mapbox-gl/dist/mapbox-gl.css';

function emptyEarthquakes(): Interface{
    return {
			features: []
    }
}

function App(){
  const [data, setData] = useState<Interface>(emptyEarthquakes());

	const onEarthquakeClick = (coordinates: number[]) => {
		console.log(coordinates);
	}
  const getData=()=> {
    fetch('earthquakes.geojson'
      ,{
        headers : { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )
    .then(response => {
      return response.json();
    }).then(data => {
      setData(data);
      console.log(data.features);
    }).catch((e: Error) => {
      console.log(e.message);
    });
  }
  useEffect(() => {
    getData()
  },[])
  return (
	<div>
    <div className="map">
  <Map
    initialViewState={{
    latitude: 37.8,
    longitude: -122.4,
    zoom: 2
    }}
    style={{width: '75vw', height: 600}}
    mapStyle="mapbox://styles/mapbox/streets-v9"
    mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
  >
		{data.features && data.features.map(earthquakeMarker =>
			<Marker key={earthquakeMarker.id} longitude={earthquakeMarker.geometry.coordinates[0]} latitude={earthquakeMarker.geometry.coordinates[1]} color="red" />
		)}
  </Map>
	</div>
	<div className="earthquakes">
	<table className="table table-striped table-bordered">
			<thead>
					<tr>
							<th>Place</th>
					</tr>
			</thead>
			<tbody>
					{data.features && data.features.map(earthquake =>
							<tr onClick={() => onEarthquakeClick(earthquake.geometry.coordinates)} key={earthquake.id}>
									<td>{earthquake.properties.place}</td>
							</tr>
					)}
			</tbody>
	</table>
    </div>
	</div>
  );
  
}

export default App;
