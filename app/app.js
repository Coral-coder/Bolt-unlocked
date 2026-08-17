/* Bolt Weather Radar — NGI HTML5 app
 *
 * Data sources (all free, no API key, CORS-enabled):
 *   - Radar tiles: RainViewer  https://www.rainviewer.com/api.html
 *   - Current conditions: US National Weather Service  https://api.weather.gov
 *   - Base map: CARTO dark basemap (OpenStreetMap data)
 *
 * US-only for conditions (NWS). Radar is global.
 * Runs as a plain web page, so it also works in the NGI simulator and, when
 * hosted on GitHub Pages, auto-updates on every push (see docs/DEPLOY.md).
 */
(function () {
  "use strict";

  var VERSION = "1.0.0"; // keep in sync with app/version.json + gmapp.json

  var CFG = {
    radarColor: 4,               // RainViewer color scheme (4 = Universal Blue)
    radarOpacity: 0.72,
    frameMs: 500,                // ms per radar frame while animating
    condRefreshMs: 10 * 60 * 1000, // re-pull conditions every 10 min
    radarRefreshMs: 5 * 60 * 1000, // re-pull radar frames every 5 min
    updateCheckMs: 30 * 60 * 1000, // check version.json every 30 min
    defaultCoords: { lat: 39.8283, lon: -98.5795 } // geographic center of US
  };

  var el = function (id) { return document.getElementById(id); };
  var map, baseLayer, radarLayers = [], frames = [], frameIdx = 0,
      playing = true, animTimer = null, radarHost = "";

  document.getElementById("version").textContent = "v" + VERSION;

  // ---- helpers -------------------------------------------------------------
  function toast(msg, ok) {
    var t = el("toast");
    t.textContent = msg;
    t.className = "toast" + (ok ? " ok" : "");
    clearTimeout(toast._h);
    toast._h = setTimeout(function () { t.className = "toast hidden"; }, 6000);
  }

  function fmtClock(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (e) { return "—"; }
  }

  function cToF(c) { return c == null ? null : Math.round(c * 9 / 5 + 32); }

  function getJSON(url, headers) {
    return fetch(url, { headers: headers || {} }).then(function (r) {
      if (!r.ok) throw new Error(url + " → HTTP " + r.status);
      return r.json();
    });
  }

  // ---- map + radar ---------------------------------------------------------
  function initMap(lat, lon) {
    map = L.map("map", { zoomControl: true, attributionControl: true })
           .setView([lat, lon], 8);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    baseLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO · Radar: RainViewer · Wx: NWS' }
    ).addTo(map);
    L.circleMarker([lat, lon], {
      radius: 6, color: "#37d67a", weight: 2, fillColor: "#37d67a", fillOpacity: 0.9
    }).addTo(map);
  }

  function radarTileUrl(path) {
    // {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
    return radarHost + path + "/256/{z}/{x}/{y}/" + CFG.radarColor + "/1_1.png";
  }

  function loadRadar() {
    return getJSON("https://api.rainviewer.com/public/weather-maps.json")
      .then(function (data) {
        radarHost = data.host;
        var past = (data.radar && data.radar.past) || [];
        var now = (data.radar && data.radar.nowcast) || [];
        var next = past.concat(now);
        if (!next.length) { toast("No radar frames available"); return; }

        // Tear down old layers
        radarLayers.forEach(function (l) { map.removeLayer(l); });
        radarLayers = [];
        frames = next;

        frames.forEach(function (f) {
          var layer = L.tileLayer(radarTileUrl(f.path), {
            opacity: 0, zIndex: 300, maxZoom: 19, tileSize: 256
          });
          layer.addTo(map);
          radarLayers.push(layer);
        });

        el("frame").max = String(frames.length - 1);
        frameIdx = Math.max(0, past.length - 1); // start at "now"
        showFrame(frameIdx);
        startAnim();
      })
      .catch(function (e) { toast("Radar error: " + e.message); });
  }

  function showFrame(i) {
    if (!radarLayers.length) return;
    frameIdx = (i + radarLayers.length) % radarLayers.length;
    radarLayers.forEach(function (l, j) {
      l.setOpacity(j === frameIdx ? CFG.radarOpacity : 0);
    });
    el("frame").value = String(frameIdx);
    var f = frames[frameIdx];
    el("frame-time").textContent = f ? fmtClock(f.time * 1000) : "—";
  }

  function startAnim() {
    stopAnim();
    if (!playing) return;
    animTimer = setInterval(function () { showFrame(frameIdx + 1); }, CFG.frameMs);
  }
  function stopAnim() { if (animTimer) { clearInterval(animTimer); animTimer = null; } }

  el("play").addEventListener("click", function () {
    playing = !playing;
    el("play").textContent = playing ? "⏸" : "▶";
    if (playing) startAnim(); else stopAnim();
  });
  el("frame").addEventListener("input", function (ev) {
    playing = false; el("play").textContent = "▶"; stopAnim();
    showFrame(parseInt(ev.target.value, 10));
  });

  // ---- current conditions (NWS) -------------------------------------------
  function loadConditions(lat, lon) {
    var pt = lat.toFixed(4) + "," + lon.toFixed(4);
    return getJSON("https://api.weather.gov/points/" + pt)
      .then(function (p) {
        var rel = p.properties.relativeLocation && p.properties.relativeLocation.properties;
        if (rel) {
          el("loc-name").textContent = rel.city + ", " + rel.state;
          el("loc-sub").textContent = "";
        }
        return getJSON(p.properties.observationStations);
      })
      .then(function (st) {
        var f = st.features && st.features[0];
        if (!f) throw new Error("no station");
        el("station").textContent = f.properties.stationIdentifier;
        return getJSON("https://api.weather.gov/stations/" +
                       f.properties.stationIdentifier + "/observations/latest");
      })
      .then(function (o) { renderConditions(o.properties); })
      .catch(function (e) {
        el("loc-name").textContent = "Weather unavailable";
        toast("Conditions error: " + e.message +
              (lat === CFG.defaultCoords.lat ? " (NWS is US-only)" : ""));
      });
  }

  function windToMph(val, unitCode) {
    if (val == null) return null;
    if (unitCode && unitCode.indexOf("m_s") > -1) return Math.round(val * 2.23694);
    return Math.round(val * 0.621371); // default km/h
  }

  function renderConditions(p) {
    var tF = cToF(p.temperature && p.temperature.value);
    var feels = cToF((p.heatIndex && p.heatIndex.value != null) ? p.heatIndex.value
                     : (p.windChill && p.windChill.value != null) ? p.windChill.value
                     : (p.temperature && p.temperature.value));
    var wind = windToMph(p.windSpeed && p.windSpeed.value,
                         p.windSpeed && p.windSpeed.unitCode);
    var hum = p.relativeHumidity && p.relativeHumidity.value;

    el("temp").textContent = (tF == null ? "--" : tF) + "°";
    el("cond-text").textContent = p.textDescription || "—";
    el("feels").textContent = (feels == null ? "--" : feels) + "°";
    el("wind").textContent = (wind == null ? "--" : wind) + " mph";
    el("humidity").textContent = (hum == null ? "--" : Math.round(hum)) + "%";
    el("updated").textContent = "Updated " + fmtClock(p.timestamp);
  }

  // ---- auto-update from GitHub --------------------------------------------
  // The app is served from GitHub Pages (RemoteHigh), so a page reload pulls the
  // latest build. We poll version.json and reload when it changes.
  function checkForUpdate() {
    getJSON("version.json?_=" + Date.now())
      .then(function (v) {
        if (v && v.version && v.version !== VERSION) {
          toast("New version " + v.version + " — updating…", true);
          setTimeout(function () { location.reload(true); }, 2500);
        }
      })
      .catch(function () { /* offline; ignore */ });
  }

  // ---- boot ----------------------------------------------------------------
  function start(lat, lon, usedDefault) {
    initMap(lat, lon);
    loadConditions(lat, lon);
    loadRadar();
    if (usedDefault) toast("Using default location — enable GPS/location for local weather");

    setInterval(function () { loadConditions(lat, lon); }, CFG.condRefreshMs);
    setInterval(loadRadar, CFG.radarRefreshMs);
    setInterval(checkForUpdate, CFG.updateCheckMs);
  }

  function boot() {
    if (!navigator.geolocation) {
      start(CFG.defaultCoords.lat, CFG.defaultCoords.lon, true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) { start(pos.coords.latitude, pos.coords.longitude, false); },
      function () { start(CFG.defaultCoords.lat, CFG.defaultCoords.lon, true); },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
