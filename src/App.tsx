import React, {Component} from 'react';
import './App.css';
import Map, {Marker} from 'react-map-gl';


class App extends Component {
  render() {
    return (
      <div className="App">
		<Map
		  initialViewState={{
			latitude: 37.8,
			longitude: -122.4,
			zoom: 14
		  }}
		  style={{width: 800, height: 600}}
		  mapStyle="mapbox://styles/mapbox/streets-v9"
		  mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
		>
		  <Marker longitude={-122.4} latitude={37.8} color="red" />
		</Map>
      </div>
    );
  }
}

export default App;
