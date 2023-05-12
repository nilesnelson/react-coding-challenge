import React from 'react';
import './App.css';
import {useState, useEffect} from "react";
import Map, {Marker, Source, Layer} from 'react-map-gl';
import { Interface } from "./interface";
import 'mapbox-gl/dist/mapbox-gl.css';
import type GeoJSON from 'geojson';

function emptyEarthquakes(): GeoJSON.FeatureCollection<GeoJSON.Geometry>{
    return {
			type: "FeatureCollection",
			features: []
    }
}

const layerStyle = {
  id: 'point',
  type: 'circle' as 'circle',
  paint: {
    'circle-radius': 10,
    'circle-color': '#007cbf'
  }
};

function App(){
  const [data, setData] = useState(emptyEarthquakes());

	const onEarthquakeClick = (coordinates: number[]) => {
      console.log(coordinates)
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
    }).then(json => {
      setData(json);
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
    <Source type="geojson" data={data}>
			<Layer {...layerStyle} />
    </Source>
    
  </Map>
	</div>
	</div>
  );
  
}

export default App;
