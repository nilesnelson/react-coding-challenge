import * as React from 'react';
import type GeoJSON from 'geojson';

interface Props {
  onChange: Function
  countries: GeoJSON.FeatureCollection
}

function ControlPanel(props: Props) {
  const {countries} = props;

  return (
    <div className="control-panel">
      <h3>Filter Earthquakes</h3>
      <div key={'year'} className="input">
        <label>Country    </label>
        <input
          list="countries"
          placeholder="Any"
          onChange={evt => props.onChange(evt.target.value)}
        />
        <datalist id="countries">
            <option key="any" value="Any"/>
          {countries.features && countries.features.map(feature => (
            <option key={feature.properties && feature.properties.ADMIN} value={feature.properties && feature.properties.ADMIN}/>
          ))}
        </datalist>
      </div>
    </div>
  );
}

export default React.memo(ControlPanel);
