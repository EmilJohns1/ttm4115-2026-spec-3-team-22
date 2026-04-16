type MapCoordinate = {
  latitude: number;
  longitude: number;
};

/**
 * Builds the Leaflet/OpenStreetMap HTML payload rendered inside the order WebView.
 */
export function createOrderMapHtml(
  packageLocation: MapCoordinate,
  deliveryLocation: MapCoordinate,
): string {
  const centerLatitude =
    (packageLocation.latitude + deliveryLocation.latitude) / 2;
  const centerLongitude =
    (packageLocation.longitude + deliveryLocation.longitude) / 2;

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html,
      body,
      #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }

      body {
        background: #f8fafc;
      }

      #map {
        filter: saturate(0.92) contrast(1.02);
      }

      .marker-wrap {
        position: relative;
        width: 52px;
        height: 62px;
      }

      .marker-core {
        position: absolute;
        top: 0;
        left: 0;
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
      }

      .marker-wrap-current .marker-core {
        background: linear-gradient(135deg, #5f8df8 0%, #3b72eb 100%);
      }

      .marker-wrap-delivery {
        width: 48px;
        height: 58px;
      }

      .marker-wrap-delivery .marker-core {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #0cb34b 0%, #04943b 100%);
        box-shadow: 0 10px 22px rgba(4, 148, 59, 0.3);
      }

      .marker-tip {
        position: absolute;
        left: 50%;
        bottom: 0;
        width: 14px;
        height: 14px;
        transform: translateX(-50%) rotate(45deg);
        border-radius: 2px;
      }

      .marker-tip-current {
        background: #3b72eb;
        box-shadow: 0 8px 16px rgba(37, 99, 235, 0.25);
      }

      .marker-tip-delivery {
        background: #04943b;
        box-shadow: 0 8px 16px rgba(4, 148, 59, 0.28);
      }

      .marker-icon {
        width: 22px;
        height: 22px;
        color: #ffffff;
      }

      .marker-wrap-delivery .marker-icon {
        width: 21px;
        height: 21px;
      }

      .marker-pulse {
        position: absolute;
        top: -6px;
        left: -6px;
        width: 64px;
        height: 64px;
        border-radius: 999px;
        border: 2px solid rgba(96, 149, 255, 0.45);
        animation: marker-pulse 1.9s ease-out infinite;
      }

      .marker-pulse-secondary {
        animation-delay: 0.6s;
      }

      @keyframes marker-pulse {
        0% {
          transform: scale(0.9);
          opacity: 0.55;
        }
        80% {
          transform: scale(1.5);
          opacity: 0;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .leaflet-tooltip.map-label {
        border: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #0f172a;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.02em;
        padding: 8px 16px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
      }

      .leaflet-tooltip.map-label-current {
        color: #4b79ec;
      }

      .leaflet-tooltip.map-label::before {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const packageLocation = [${packageLocation.latitude}, ${packageLocation.longitude}];
      const deliveryLocation = [${deliveryLocation.latitude}, ${deliveryLocation.longitude}];

      const map = L.map("map", {
        zoomControl: false,
        attributionControl: false,
        center: [${centerLatitude}, ${centerLongitude}],
        zoom: 14,
      });

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const droneSvg = '<svg class="marker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4"/><path d="M12 11v10"/></svg>';
      const destinationSvg = '<svg class="marker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-4.2 7-10a7 7 0 1 0-14 0c0 5.8 7 10 7 10z"/><circle cx="12" cy="11" r="2.5"/></svg>';

      const currentIcon = L.divIcon({
        className: "",
        html: '<div class="marker-wrap marker-wrap-current"><div class="marker-pulse"></div><div class="marker-pulse marker-pulse-secondary"></div><div class="marker-core">' + droneSvg + '</div><div class="marker-tip marker-tip-current"></div></div>',
        iconSize: [52, 62],
        iconAnchor: [26, 62],
      });

      const deliveryIcon = L.divIcon({
        className: "",
        html: '<div class="marker-wrap marker-wrap-delivery"><div class="marker-core">' + destinationSvg + '</div><div class="marker-tip marker-tip-delivery"></div></div>',
        iconSize: [48, 58],
        iconAnchor: [24, 58],
      });

      const packageMarker = L.marker(packageLocation, {
        icon: currentIcon,
      }).addTo(map);
      packageMarker
        .bindTooltip("Drone", {
          permanent: false,
          direction: "top",
          offset: [0, -42],
          className: "map-label map-label-current",
        })
        .openTooltip();

      const destinationMarker = L.marker(deliveryLocation, {
        icon: deliveryIcon,
      }).addTo(map);
      destinationMarker
        .bindTooltip("Delivery Location", {
          permanent: false,
          direction: "top",
          offset: [0, -34],
          className: "map-label",
        })
        .openTooltip();

      let areLabelsVisible = true;

      const setLabelsVisible = (visible) => {
        if (visible) {
          packageMarker.openTooltip();
          destinationMarker.openTooltip();
          return;
        }

        packageMarker.closeTooltip();
        destinationMarker.closeTooltip();
      };

      map.on("click", () => {
        areLabelsVisible = !areLabelsVisible;
        setLabelsVisible(areLabelsVisible);
      });
    </script>
  </body>
</html>
`;
}
