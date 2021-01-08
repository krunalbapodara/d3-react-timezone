import React, { useState } from 'react';
// import Playbook from './components/playbook/playbook';
import TimeZoneMap from './components/d3 map/timezoneMap';
import { timeZoneData } from './components/d3 map/envData';

function App() {
  const [tz, setTz] = useState({});
  return (
    <TimeZoneMap timeZoneMap={timeZoneData} selectedTimeZone={tz} setData={(d) => setTz(d)} />
  );
}

export default App;
