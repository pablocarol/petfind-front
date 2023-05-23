mapboxgl.accessToken =
  "pk.eyJ1IjoicGNhcm9sIiwiYSI6ImNsZ2R4Nm16eTBxZGMzZ3N4Z3V6ZDc1dnEifQ.llpR-WeBQC34egTCueR_tQ";

function setBatteryValue() {
  fetch("http://165.232.73.173/getBattery").then(
      (response) => response.json()).then((percent) => {
        document.getElementById("battery_percent").innerHTML = percent;
      }); 
}

document.addEventListener("DOMContentLoaded", function () {
  setBatteryValue();
  setInterval(function(){
    setBatteryValue(); 
   }, 15000);
  loadMapLastLocation();
});

async function loadMapLastLocation() {
  const data = await fetch("http://165.232.73.173/getLastLocation").then(
    (response) => response.json()
  );

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: data,
    zoom: 13,
  });

  new mapboxgl.Marker({ color: "red" }).setLngLat(data).addTo(map);
}

function getInitialZoom(minLat, maxLat, minLng, maxLng) {
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;

  const zoomLat = Math.floor(Math.log2(360 / latDiff));
  const zoomLng = Math.floor(Math.log2(360 / lngDiff));

  const zoomLevel = Math.min(zoomLat, zoomLng);
  return zoomLevel;
}

function getInitialZoomAndCenter(data) {
  const lats = data.map((coord) => coord[1]);
  const lngs = data.map((coord) => coord[0]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const initialZoom = getInitialZoom(minLat, maxLat, minLng, maxLng);

  return [[centerLng, centerLat], initialZoom];
}

async function loadMapByDate() {
  const dateIni = document.getElementById("date-ini").value;
  const dateEnd = document.getElementById("date-end").value;

  const apiUrl = `http://165.232.73.173/getLocationsByDate?dateIni=${dateIni}T00:00:00.000Z&dateEnd=${dateEnd}T00:00:00.000Z`;
  const data = await fetch(apiUrl).then((response) => response.json());

  const [mapCenter, initialZoom] = getInitialZoomAndCenter(data);

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: mapCenter,
    zoom: initialZoom,
  });

  var points = {
    type: "FeatureCollection",
    features: data.map((coord, index) => {
      if (index === 0) {
        return {
          type: "Feature",
          properties: {
            pointType: "start",
          },
          geometry: {
            type: "Point",
            coordinates: coord,
          },
        };
      } else if (index === data.length - 1) {
        return {
          type: "Feature",
          properties: {
            pointType: "end",
          },
          geometry: {
            type: "Point",
            coordinates: coord,
          },
        };
      } else {
        return {
          type: "Feature",
          properties: {
            pointType: "mid",
          },
          geometry: {
            type: "Point",
            coordinates: coord,
          },
        };
      }
    }),
  };

  map.on("load", function () {
    map.addLayer({
      id: "line-layer",
      type: "line",
      source: {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: data,
          },
        },
      },
      paint: {
        "line-color": "#888",
        "line-width": 2,
      },
    });
    map.addLayer({
      id: "circle-layer",
      type: "circle",
      source: {
        type: "geojson",
        data: points,
      },
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "match",
          ["get", "pointType"],
          "start",
          "#00b31b",
          "end",
          "#fc0303",
          "mid",
          "#036ffc",
          "#ccc",
        ],
      },
    });
  });
}
