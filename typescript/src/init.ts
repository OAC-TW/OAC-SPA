import 'leaflet'
import "leaflet/dist/leaflet.css"

export class Init {

	map: L.Map
	currentLocationMarkLayer: L.Marker

	constructor(container: string | HTMLElement, mapOption: L.MapOptions = {}) {

		this.map = L.map(container, {
			...mapOption,
			...{
				attributionControl: false,
				zoomControl: false,
				preferCanvas: true
			}
		})

	}

	addMark(latlng: L.LatLng): L.Marker {
		let latlngText = `目前位置 經度 ${latlng.lng.toFixed(5)} 緯度 ${latlng.lat.toFixed(5)}`;
		if (!this.currentLocationMarkLayer) {
			this.currentLocationMarkLayer = L.marker(latlng, {
				icon: L.icon({
					iconSize: [25, 41],
					iconAnchor: [10, 41],
					popupAnchor: [2, -40],
					iconUrl: "data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA0ODYuMyA0ODYuMyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDg2LjMgNDg2LjM7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPgo8Zz4KCTxwYXRoIHN0eWxlPSJmaWxsOiNDRDJBMDA7IiBkPSJNMjQzLjE1LDB2MTA0LjRjNDQuMTEsMCw4MCwzNS44OCw4MCw4MGMwLDQ0LjExLTM1Ljg5LDgwLTgwLDgwdjIyMS45bDE0Ni40My0xODQuMSAgIGMyNi4yOS0zMy4yNSw0MC4xOS03My4yMSw0MC4xOS0xMTUuNThDNDI5Ljc3LDgzLjcyLDM0Ni4wNSwwLDI0My4xNSwweiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0Q4RDdEQTsiIGQ9Ik0zMjMuMTUsMTg0LjRjMC00NC4xMi0zNS44OS04MC04MC04MHYxNjBDMjg3LjI2LDI2NC40LDMyMy4xNSwyMjguNTEsMzIzLjE1LDE4NC40eiIvPgoJPHBhdGggc3R5bGU9ImZpbGw6I0ZGMzUwMTsiIGQ9Ik0xNjMuMTUsMTg0LjRjMC00NC4xMiwzNS44OS04MCw4MC04MFYwQzE0MC4yNSwwLDU2LjUzLDgzLjcyLDU2LjUzLDE4Ni42MiAgIGMwLDQyLjM3LDEzLjksODIuMzMsNDAuMjMsMTE1LjYyTDI0My4xNSw0ODYuM1YyNjQuNEMxOTkuMDQsMjY0LjQsMTYzLjE1LDIyOC41MSwxNjMuMTUsMTg0LjR6Ii8+Cgk8cGF0aCBzdHlsZT0iZmlsbDojRkZGRkZGOyIgZD0iTTE2My4xNSwxODQuNGMwLDQ0LjExLDM1Ljg5LDgwLDgwLDgwdi0xNjBDMTk5LjA0LDEwNC40LDE2My4xNSwxNDAuMjgsMTYzLjE1LDE4NC40eiIvPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=",
				})
			})
			this.currentLocationMarkLayer.bindPopup(latlngText)
			this.map.addLayer(this.currentLocationMarkLayer)
		} else {
			this.currentLocationMarkLayer.setPopupContent(latlngText)
			this.currentLocationMarkLayer.setLatLng(latlng)
		}
		return this.currentLocationMarkLayer
	}
	removeMark() {
		if (this.currentLocationMarkLayer) {
			this.map.removeLayer(this.currentLocationMarkLayer);
			this.currentLocationMarkLayer = null;
		}
	}

	/** 定位到當前位置 */
	async toCurrentLocation() {

		let location: GeolocationPosition = await new Promise((res, rej) => {
			navigator.geolocation.getCurrentPosition(loc => res(loc), err => rej(err))
		})
		let latlng = new L.LatLng(location.coords.latitude, location.coords.longitude)

		this.map.flyTo(latlng, 15)
		this.addMark(latlng).addTo(this.map).openPopup()

	}

	/** 掛載 含座標資訊 的 DOM */
	mountCoordDom(container: HTMLElement): (evt: L.LeafletMouseEvent) => void {
		let textLabel = document.createElement("strong")
		textLabel.style.cssText = `
            color: #fff;
            margin-left: 0.5rem;
        `

		let updateCoord = ({ lat, lng }) => {
			textLabel.innerHTML = `
<small>
	<span>經度</span> ${lng.toFixed(3)}
	<span>緯度</span> ${lat.toFixed(3)}
</small>`
		}
		updateCoord(this.map.getCenter()) // init
		let moveFn = (evt: L.LeafletMouseEvent) => updateCoord({
			lat: evt.latlng.lat,
			lng: evt.latlng.lng
		});
		this.map.on("mousemove", moveFn)

		container.appendChild(textLabel)
		return moveFn;
	}
	unmountCoordDom(ref: (evt: L.LeafletMouseEvent) => void) {
		this.map.off("mousemove", ref);
	}

	/** 掛載 比例尺 的 DOM */
	mountScaleDom(container: HTMLElement): L.Control.Scale {
		let scale = L.control.scale({
			position: "bottomright",
			imperial: false
		}).addTo(this.map);
		let scaleDom = scale.getContainer()

		let rule = scaleDom.querySelector(".leaflet-control-scale-line") as HTMLElement
		rule.style.cssText = ` 
background: transparent;
color: #fff;
border-color: #fff;`

		container.appendChild(scaleDom)
		return scale;
	}
	unmountScaleDom(ref: L.Control.Scale) {
		if (ref) this.map.removeControl(ref);
	}

}
