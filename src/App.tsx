import React from 'react';
import './App.css';
import {useState, useEffect} from "react";
import Map, {Source, Layer, MapLayerMouseEvent, MapRef, Popup} from 'react-map-gl';
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

interface PopupInfo {
	longitude: number
	latitude: number
	title: string
	magnitude: number | null
	timestamp: number
}

function App(){
	const mapRef = React.useRef<MapRef | null>(null)
  const [data, setData] = useState(emptyEarthquakes());
	const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

	const onClick= (e: MapLayerMouseEvent) => {
				if (mapRef.current !== null) {
					const features = mapRef.current.queryRenderedFeatures(
						e.point,
						{ layers: ['point'] }
					)
					console.log(features)
					const feature = features && features[0]
					if(feature && feature.geometry.type === 'Point') {
						const long = feature.geometry.coordinates[0];
						const lat = feature.geometry.coordinates[1];
						const zoom = mapRef.current.getZoom() > 7 ? mapRef.current.getZoom() : 7
						mapRef.current.flyTo({
								zoom: zoom,
								center: [long, lat]
							});
						if(feature.properties) {
							setPopupInfo({
								longitude: long,
								latitude: lat,
								title: feature.properties.title,
								magnitude: feature.properties.mag,
								timestamp: feature.properties.time
							});
						}
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
		{popupInfo && (
          <Popup
            anchor="bottom"
            longitude={Number(popupInfo.longitude)}
            latitude={Number(popupInfo.latitude)}
            onClose={() => setPopupInfo(null)}
          >
						<h4>{popupInfo.title}</h4>
						<div>
						Magnitude: {popupInfo.magnitude}
						</div>
						<div>
						Timestamp: {popupInfo.timestamp}
						</div>
          </Popup>

		)}
    
  </Map>
	</div>
	</div>
  );
  
}

export default App;
