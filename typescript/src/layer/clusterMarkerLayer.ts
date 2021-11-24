
import { library, icon, parse as faParse } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
library.add(fas, fab, far)

// from https://github.com/FortAwesome/vue-fontawesome/blob/2.x/src/components/FontAwesomeIcon.js#L6
function normalizeIconArgs(icon) {
	if (icon === null) {
		return null
	}

	if (Array.isArray(icon) && icon.length === 2) {
		return { prefix: icon[0], iconName: icon[1] }
	}

	if (typeof icon === 'string') {
		return { prefix: 'fas', iconName: icon }
	}
}

abstract class BaseCluster extends L.Layer implements ILayer {

	id: string
	type: string
	title: string
	catelog: { label: string; value: string }[]
	tag: string[]
	visible: boolean
	opacity: number
	dataSet: { label: string; value: string }[]
	status: "loading" | "loaded" | "error"
	icon?: string
	iconUrl?: string
	perIcon?: string
	lyrOpts: any
	group: Array<{ name: string, order: number }>
	enable: boolean

	markerClusterGroup: L.MarkerClusterGroup
	divIcon: ((highlight?: Boolean, data?: any) => L.DivIcon)

	constructor({
		id,
		type,
		title,
		visible,
		tag,
		catelog,
		opacity,
		dataSet,
		group,
		enable,
		...lyrOpts
	}) {
		super()
		this.catelog = catelog
		this.id = id
		this.type = type
		this.tag = tag
		this.title = title
		this.visible = visible
		this.opacity = 1
		this.icon = lyrOpts?.layerOption?.icon
		this.iconUrl = lyrOpts?.layerOption?.iconUrl
		this.perIcon = lyrOpts?.layerOption?.perIcon
		this.lyrOpts = lyrOpts
		this.dataSet = dataSet
		this.group = group
		this.enable = enable

		this.divIcon = this.getIconVM();
		this.markerClusterGroup = L.markerClusterGroup({
			iconCreateFunction: cluster => this.divIcon(),
			showCoverageOnHover: false,
			spiderLegPolylineOptions: { opacity: 0 },
			maxClusterRadius: 35, //80
		})
	}

	getIconVM() {
		if (!!this.perIcon) {
			// const perIcon = this.perIcon;
			// const icon0 = this.icon;
			return (highlight?: Boolean, data?: any) => { // data undefined if is Cluster marker
				const icon = (data || {})[this.perIcon] || this.icon;
				return this.getIconGen(icon)(highlight);
			};
		}
		return this.getIconGen(this.icon);
	}
	getIconGen(icon: string) {
		if (typeof icon === 'string' && icon.startsWith('url:')) {
			return (highlight?: Boolean) => this.getImgIconVM(icon, highlight);
		}
		return this.getFontIconVM(icon);
	}
	getFontIconVM(iconName: string) {
		const html = icon(normalizeIconArgs(iconName)).html[0];
		return (highlight?: Boolean) => {
			const domClass = (highlight) ? ' is-highlight' : '';
			return L.divIcon({
				html: `<div class='leaflet-mark-icon${domClass}'>${html}</div>`,
			});
		};
	}
	getImgIconVM(iconName: string, highlight?: Boolean) {
		const url = iconName.replace(/^(url:)/, '');
		const div = document.createElement('div');
		div.classList.add('leaflet-mark-icon');
		if (highlight) div.classList.add('is-highlight');
		const img = document.createElement('img');
		img.src = url;
		img.classList.add('iconImg');
		// img.style.width = '1rem';
		div.appendChild(img);
		return L.divIcon({
			html: div,
		});
	}

	async fetchData() {
		return await (await fetch(this.lyrOpts.url)).json()
	}
	onRemove(map) {
		this.markerClusterGroup.clearLayers().removeFrom(map)
		return this
	}

	abstract onAdd(map: L.Map): this
}

export class TemplateLayer extends BaseCluster {
	data: any
	template: string

	constructor({ template, ...opts }) {
		super(opts as any)
		this.template = template;
	}

	private _pointToLayer(feature, latlng) {
		const mk = L.marker(latlng, {
			icon: this.divIcon(false, feature.properties),
		})
		mk.on("click", e => {
			this._map.fireEvent("markerClick", {
				dataType: this.template,
				layer: mk,
				data: feature.properties,
				event: e,
			})
		})
		feature.properties._marker = Object.assign(mk, { _isVue: true }); // hacky for no Vue proxy
		return mk
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"

				if (!this.data) this.data = await this.fetchData()

				const geojson = L.geoJSON(this.data, {
					pointToLayer: this._pointToLayer.bind(this)
				})

				// TODO: use GeojsonLayer
				geojson.getLayers().forEach((v, idx) => {
					v.feature.properties.__leafletID = v._leaflet_id;
					Object.assign(v.feature.properties, { _isVue: true }); // hacky for no Vue proxy
					//console.log('[TemplateLayer][onAdd]', this, v)
				});

				this.markerClusterGroup.addLayer(geojson).addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
				console.error(`[TemplateLayer]`, this, e)
			}
		})()
		return this
	}
}

export class TemplateListLayer extends TemplateLayer {
	constructor(opts) {
		super(opts)
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"
				if (!this.data) this.data = await this.fetchData()

				this.data.forEach((row, i, array) => {
					const Longitude = row.Px;
					const Latitude = row.Py;
					if (!Longitude || !Latitude) return;

					try {
						const mk = L.marker(L.latLng(Latitude, Longitude), {
							icon: this.divIcon(false, row),
						});

						mk.on("click", e => {
							this._map.fireEvent("markerClick", {
								dataType: this.template,
								layer: mk,
								data: row,
								event: e,
							})
						})
						this.markerClusterGroup.addLayer(mk)
					} catch (e) {
						console.error(`[TemplateListLayer]buggy data`, this, e, i, row)
					}
				})

				this.markerClusterGroup.addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
				console.error(`[TemplateListLayer]`, this, e)
			}
		})()
		return this
	}
}

export class IsoheStationLayer extends BaseCluster {

	data: any

	constructor(opts) {
		super(opts)
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"
				if (!this.data) this.data = await this.fetchData()
				for (const { DataSet, Name } of this.data.Stations) {
					for (const k of Object.keys(DataSet)) {
						const { Data, location } = DataSet[k]
						const { Latitude, Longitude } = location
						if (Latitude && Longitude) {
							const mk = L.marker(
								L.latLng(Latitude, Longitude), {
								icon: this.divIcon(false, Data),
							}
							)
							mk.on("click", e => {
								let result = {
									title: "",
									type: "",
									data: Data
								}
								if (/tide/ig.test(k)) {
									result.title = Name + "潮汐"
									result.type = "tide"
								} else if (/history/ig.test(k)) {
									result.title = Name + "波浪及海流"
									result.type = "wave"
								} else if (/wind/ig.test(k)) {
									result.title = Name + "風力"
									result.type = "wind"
								}
								this._map.fireEvent("markerClick", {
									dataType: "isoheStation",
									layer: mk,
									data: result,
									event: e
								})
							})
							this.markerClusterGroup.addLayer(mk)
						}
					}
				}
				this.markerClusterGroup.addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
			}
		})()
		return this
	}
}

/** 
 * TODO: 列出各縣市 1 個 ICON > 點擊後 再載入屬於該縣市的 觀光景點資訊
 */
export class ScenicSpotLayer extends BaseCluster {
	data: any
	marker: L.Marker[]
	index: Object
	currReg: string
	currTag: string

	constructor(opts) {
		super(opts)
		this.marker = [];
		this.index = {};
		this.currReg = null;
		this.currTag = null;
	}

	private _pointToLayer(feature, latlng) {

		const mk = L.marker(latlng, {
			icon: this.divIcon(false, feature.properties),
		})
		mk.on("click", e => {
			this._map.fireEvent("markerClick", {
				dataType: "scenicSpot",
				layer: mk,
				data: feature.properties,
				event: e
			})
		})

		const {
			Region,
			Town,
			Tag,
		} = feature.properties

		this.marker.push(mk);
		let reg = this.index[Region];
		if (!reg) {
			reg = {};
			this.index[Region] = reg;
		}
		if (Tag) {
			Tag.forEach((val, idx) => {
				let tagItem = reg[val];
				if (!tagItem) {
					tagItem = [];
					reg[val] = tagItem;
				}
				tagItem.push(mk);
			})
		} else {
			let tagItem = reg[Town];
			if (!tagItem) {
				tagItem = [];
				reg[Town] = tagItem;
			}
			tagItem.push(mk);
		}

		return mk
	}

	getIndex() {
		return Object.freeze(this.index);
	}

	showOnly(region, tag) {
		this.currReg = region;
		this.currTag = tag;
		if (!region) {
			this.marker.forEach(mk => {
				this.markerClusterGroup.addLayer(mk)
			})
			return;
		}

		this.markerClusterGroup.clearLayers();
		let list = [];
		let reg = this.index[region];
		if (!reg) return;
		if (!tag) {
			Object.keys(reg).forEach(regName => {
				let tagItem = reg[regName];
				tagItem.forEach(mk => {
					list.push(mk);
				})
			})
		} else {
			let tagItem = reg[tag];
			list = tagItem;
		}
		list.forEach(mk => {
			this.markerClusterGroup.addLayer(mk)
		})
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"

				if (!this.data) {
					this.data = await this.fetchData()
					this.index = {};
				}

				const geojson = L.geoJSON(this.data, {
					pointToLayer: this._pointToLayer.bind(this)
				})

				this.markerClusterGroup.addLayer(geojson).addTo(map)
				if (this.currReg) {
					this.showOnly(this.currReg, this.currTag);
				}

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
				console.error(`[ScenicSpotLayer]`, e)
			}
		})()
		return this
	}
}

export class WaterQualityLayer extends BaseCluster {

	data: any

	constructor(opts) {
		super(opts)
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"
				if (!this.data) this.data = await this.fetchData()

				this.data.forEach((station, i, array) => {
					const Longitude = station.coordinates[0];
					const Latitude = station.coordinates[1];
					station.Longitude = Longitude;
					station.Latitude = Latitude;

					const mk = L.marker(
						L.latLng(Latitude, Longitude), {
						icon: this.divIcon(false, station),
					}
					)

					mk.on("click", e => {
						this._map.fireEvent("markerClick", {
							dataType: "waterQuality",
							layer: mk,
							data: station,
							event: e,
						})
					})
					this.markerClusterGroup.addLayer(mk)
				})
				this.markerClusterGroup.addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
			}
		})()
		return this
	}
}

export class TidalLayer extends BaseCluster {

	data: any

	constructor(opts) {
		super(opts)
	}

	private _pointToLayer(feature, latlng) {

		const mk = L.marker(latlng, {
			icon: this.divIcon(false, feature.properties),
		}) as any;
		mk.lyr = this;

		const {
			locationName,
			detailfilename,
		} = feature.properties

		mk.on("click", e => {
			this._map.fireEvent("markerClick", {
				dataType: "tidal",
				layer: mk,
				data: feature.properties,
				event: e,
			})
		})

		return mk
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"

				if (!this.data) this.data = await this.fetchData()

				const geojson = L.geoJSON(this.data, {
					pointToLayer: this._pointToLayer.bind(this),
				})

				this.markerClusterGroup.addLayer(geojson).addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
			}
		})()
		return this
	}

}

export class ForecastLayer extends BaseCluster {

	data: any

	constructor(opts) {
		super(opts)
	}

	private mkMark(lat, lon, data, tab) {
		const latlng = L.latLng(lat, lon);
		const locdata = { data, tab };
		const mk = L.marker(latlng, {
			icon: this.divIcon(false, locdata),
		}) as any
		mk.lyr = this;

		mk.on("click", e => {
			this._map.fireEvent("markerClick", {
				dataType: "forecast",
				layer: mk,
				data: locdata,
				event: e,
			})
		})

		return mk
	}

	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"

				if (!this.data) {
					const ref = await this.fetchData();
					let tab = {};
					let data = ref.cwbopendata.dataset.locations.location.map(({
						locationName, lat, lon, geocode, weatherElement
					}) => {
						let out = { locationName, lat, lon, geocode, time: null };
						let timeline = [];

						let tmp = {};
						weatherElement.forEach(({ elementName, description, time }) => {
							if (!tab[elementName]) tab[elementName] = description;

							//let info = [];
							time.forEach(({ dataTime, elementValue }) => {
								if (!tmp[dataTime]) tmp[dataTime] = { dataTime };
								//if (!tmp[dataTime][elementName]) tmp[dataTime][elementName] = info;
								//info.push(elementValue);
								tmp[dataTime][elementName] = elementValue;
							});
						});
						Object.keys(tmp).sort().forEach((key) => {
							timeline.push(tmp[key]);
						});
						out.time = timeline;
						return out;
					});
					this.data = { tab, data };
					console.log("[forecast]data", this, data);
				}

				this.data.data.forEach((loc) => {
					const mk = this.mkMark(loc.lat, loc.lon, loc, this.data.tab);
					this.markerClusterGroup.addLayer(mk)
				})
				this.markerClusterGroup.addTo(map)

				this.fireEvent("loaded")
				this.status = "loaded"
			} catch (e) {
				this.fireEvent("error", e)
				this.status = "error"
			}
		})()
		return this
	}

}

export class CCTVLayer extends BaseCluster {
	data: any
	marker: L.Marker[]

	constructor(opts) {
		super(opts);
	}

	private _pointToLayer(feature, latlng): L.Marker {
		const mk = L.marker(latlng, {
			icon: this.divIcon(false, feature.properties),
		})
		mk.on("click", e => {
			this._map.fireEvent("markerClick", {
				dataType: "cctv",
				layer: mk,
				data: feature.properties,
				event: e,
			})
		})
		//mk.bindPopup(JSON.stringify(feature.properties));
		this.marker.push(mk);
		return mk;
	}

	getMarker() {
		//console.log('[CCTVLayer]marker list', this.marker);
		return Object.freeze(this.marker);
	}
	onAdd(map) {
		(async () => {
			try {
				this.status = "loading";
				if (!this.data) this.data = await this.fetchData();
				this.marker = [];
				const geojson = L.geoJSON(this.data, {
					pointToLayer: this._pointToLayer.bind(this),
				})
				this.markerClusterGroup.addLayer(geojson).addTo(map);
				this.fireEvent("loaded");
				this.status = "loaded";
				//console.log('[CCTVLayer][onAdd]marker list', this.marker);
			} catch (e) {
				this.fireEvent("error", e);
				this.status = "error";
				//console.log('[CCTVLayer][onAdd]errot', e, this.marker);
			}
		})()
		return this
	}
}

