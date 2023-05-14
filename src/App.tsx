import React from 'react';
import './App.css';
import {useState, useMemo, useEffect} from "react";
import Map, {Source, Layer, MapLayerMouseEvent, MapRef, Popup} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type GeoJSON from 'geojson';
import ControlPanel from './control-panel';
import * as d3 from 'd3-geo'


function emptyEarthquakes(): GeoJSON.FeatureCollection<GeoJSON.Geometry>{
    return {
			type: "FeatureCollection",
			features: []
    }
}

function emptyCountries(): GeoJSON.FeatureCollection<GeoJSON.Geometry>{
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
	const [countries, setCountries] = useState(emptyCountries());
	const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
	const [country, setCountry] = useState<string>("Any")


	const countryChange= (new_country: string) => {
		setCountry(new_country);
		const country_data = countries.features.find((country: GeoJSON.Feature) => country.properties && country.properties.ADMIN === new_country)
		if(data && country_data) {
			data.features.map((d: GeoJSON.GeoJsonProperties) => {
				if(d){
					const point_in_polygon = d3.geoContains(country_data.geometry, d.geometry.coordinates);
					if (point_in_polygon && country_data.properties) {
						d.properties.country = country_data.properties.ADMIN;
					}
				}
				return d
			});
			setData(data);
			if(mapRef && mapRef.current && mapRef.current) {
				const earthquake_source = mapRef.current.getSource("earthquakes")
				if (earthquake_source.type === "geojson") {
					earthquake_source.setData(data);
				}
			}
		}
	}
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
    fetch('countries.geojson'
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
      setCountries(json);
    }).catch((e: Error) => {
      console.log(e.message);
    });
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
		}).then(earthquake_json=> {
			earthquake_json.features = earthquake_json.features.map((d: GeoJSON.GeoJsonProperties) => {
				if (d) {
					d.properties.hide = false
					d.properties.year = new Date(d.properties.time).getFullYear();
					d.properties.month = new Date(d.properties.time).getMonth();
					d.properties.day = new Date(d.properties.time).getDay();
				}
				return d;
			});
			setData(earthquake_json);
	}).catch((e: Error) => {
		console.log(e.message);
	});
  }
	const filter = useMemo(() => {
		if (["Any", ""].includes(country)) {
			return ['==', 'hide', false];
		}
		return ['==', 'country', country];
	}, [country]);
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
    style={{width: '100vw', height: 600}}
    mapStyle="mapbox://styles/mapbox/streets-v9"
    mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
		ref={mapRef}
  >
    <Source id="earthquakes" type="geojson" data={data}>
			<Layer {...layerStyle} filter={filter}/>
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
	{countries && (
		<ControlPanel countries={countries} onChange={(value: string) => countryChange(value)} />
	)}
	</div>
	</div>
  );
  
}

export default App;
