import React from 'react';
import './App.css';
import {useState, useCallback, useEffect} from "react";
import Map, {Marker, Source, Layer, MapLayerMouseEvent, MapRef, PointLike} from 'react-map-gl';
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
	const mapRef = React.useRef<MapRef | null>(null)
  const [data, setData] = useState(emptyEarthquakes());

	const onEarthquakeClick = (coordinates: number[]) => {
      console.log(coordinates)
	}
	const onClick= (e: MapLayerMouseEvent) => {
				if (mapRef.current !== null) {
					const features = mapRef.current.queryRenderedFeatures(
						e.point,
						{ layers: ['point'] }
					)
					console.log(features)
					if(features[0] && features[0].geometry.type === 'Point') {
						mapRef.current.flyTo({
								zoom: 7,
								center: [
									features[0].geometry.coordinates[0],
									features[0].geometry.coordinates[1]
								]
							})
					}
				}
	};
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
		onClick={onClick}
    style={{width: '75vw', height: 600}}
    mapStyle="mapbox://styles/mapbox/streets-v9"
    mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
		ref={mapRef}
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
