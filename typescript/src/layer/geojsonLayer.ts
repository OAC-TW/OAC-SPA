const leafletPip = require("@mapbox/leaflet-pip")

export class GeojsonLayer extends L.GeoJSON implements ILayer {

	id: string
	type: string
	title: string
	catelog: { label: string; value: string }[]
	tag: string[]
	visible: boolean
	opacity: number
	dataSet: { label: string; value: string }[]
	legendColor: string
	status: "loading" | "loaded" | "error"
	icon?: string
	iconUrl?: string
	lyrOpts: any
	group: Array<{ name: string, order: number }>
	enable: boolean
	sortable?: boolean
	template?: string
	appendProp?: string
	data: any

	private _Geojson: L.GeoJSON

	// 保存上一次 highLight path
	private _lastHighLightPathCollection: Array<{
		path: Path
		lastStyle: L.PathOptions
	}> = new Array()

	constructor({
		id,
		type,
		title,
		catelog,
		tag,
		visible,
		sortable,
		opacity,
		dataSet,
		group,
		enable,
		data,
		template,
		appendProp,
		...lyrOpts
	}) {
		super()
		this.id = id
		this.type = type
		this.title = title
		this.catelog = catelog
		this.tag = tag
		this.visible = visible
		this.sortable = sortable
		// this.opacity = lyrOpts?.pathOptions?.opacity
		this.dataSet = dataSet
		this.lyrOpts = lyrOpts
		this.group = group
		this.enable = enable
		this.data = data
		this.template = template
		this.appendProp = appendProp

		const pathOptions = lyrOpts?.pathOptions || lyrOpts?.layerOption;
		this.icon = pathOptions?.icon || lyrOpts?.icon;
		this.iconUrl = pathOptions?.iconUrl;

		this.legendColor = pathOptions?.color?.match(/\d+/g).join(",") // ${}
		this.opacity = pathOptions?.opacity || 1.0;
	}

	async fetchData() {
		let url = this.lyrOpts?.url;
		return (url) ? await (await fetch(url)).json() : null;
	}

	/** @override */
	setStyle(opts: L.PathOptions) {
		if (!opts) return this;
		if ("opacity" in opts || "fillOpacity" in opts) {
			let o = opts.opacity || opts.fillOpacity || 0
			o = o > 1 ? o / 100 : o
			opts.opacity = o
			opts.fillOpacity = o
		}
		if ("color" in opts || "fillColor" in opts) {
			opts.color = opts.color || opts.fillColor
			opts.fillColor = opts.color || opts.fillColor
		}
		super.setStyle(opts)
		return this
	}

	/** @override */
	onAdd(map) {
		(async () => {
			try {
				this.status = "loading"

				if (!this.data) this.data = await this.fetchData()
				let data = this.data

				if (data?.hasOwnProperty("crs")) {
					const reproject = require('reproject')
					const epsg = require('epsg')
					const crs = data.crs.properties.name;
					switch (true) {
						case /3857/g.test(crs):
							data = reproject.toWgs84(data, undefined, epsg)
							break;
						case /3826/g.test(crs):
							data = reproject.toWgs84(data, undefined, epsg)
							break;
					}
				}

				// this._Geojson = L.geoJSON(data) as L.GeoJSON
				this.addData(data);
				this._Geojson = this as L.GeoJSON; // for compatible old code

				// add reference
				this.addReference();

				this.setStyle(this.lyrOpts?.pathOptions)
				super.addTo(map)

				this.status = "loaded"
				this.fireEvent("loaded")
			} catch (e) {
				console.log('[GeojsonLayer][onAdd]err', this, e)
				this.status = "error"
				this.fireEvent("error", e)
			}
		})()
		super.onAdd(map);
		return this
	}

	/** @override */
	onRemove(map) {
		super.onRemove(map);
		console.log('[GeojsonLayer][onRemove]', this)
		// this._Geojson.off("click",this.handleQueryClick)
		return this
	}

	setFilter(filterFn: (geoJsonFeature: GeoJSON.Feature<GeoJSON.Geometry, any>) => boolean) {
		// console.log('[GeojsonLayer][setFilter]', this, filterFn, this.lyrOpts?.pathOptions);
		this.options.filter = filterFn;
		if (!this.data) return;
		this.clearLayers();
		this.addData(this.data);
		this.setStyle(this.lyrOpts?.pathOptions);
		this.addReference(); // add reference
	}

	addReference() {
		super.getLayers().forEach((v, idx) => {
			v.feature.properties.__leafletID = v._leaflet_id;
			Object.assign(v.feature.properties, { _isVue: true }); // hacky for no Vue proxy
			//console.log('[GeojsonLayer][onAdd]', this, v)
		});
	}

	/** 高亮圖層 */
	highLightPath(pathCollection: Array<Path>) {
		pathCollection.length && pathCollection.forEach(path => {
			this._lastHighLightPathCollection.push({
				path: path,
				lastStyle: Object.assign({}, path.options),
			})
			//path.bringToFront()
			path.setStyle({
				color: "yellow",
				fillColor: path.options.color,
				opacity: 1,
				weight: 5
			})
		})
		return this._lastHighLightPathCollection
	}

	/** 清除高亮圖層 */
	deHighLightPath() {
		if (this._lastHighLightPathCollection.length) {
			this._lastHighLightPathCollection.forEach(path => {
				path.path.setStyle(path.lastStyle)
				path.path.redraw()
			})
			this._lastHighLightPathCollection.length = 0

			// 重排序 : 因移除後重新加回會使目標圖層跑至地圖最上，集合中紀錄的索引位置才是其原本真正位置
			//this._map.eachLayer((lyr:any)=>lyr instanceof GeojsonLayer && lyr.bringToFront())
		}
	}

	getFeaturePropertiesBylatlng(latlng: L.LatLng, map, radius = 1) {

		let pathCollection = []

		const matched_polygons = leafletPip.pointInLayer([latlng.lng, latlng.lat], this)
		pathCollection.push(...matched_polygons)

		// const match_polylines = L.GeometryUtil.layersWithin(this._map,,latlng,10)
		this.eachLayer((path: L.Path) => {
			if (path instanceof L.Polyline) {
				path.getLatLngs().forEach(t => {
					let cnt = 0
					while (t[cnt + 1]) {
						if (!(t[cnt] instanceof L.LatLng)) break
						let dst = L.GeometryUtil.distanceSegment(map, latlng, t[cnt], t[cnt + 1]);
						if (dst <= radius) {
							pathCollection.push(path)
							console.log("is polyline", dst)
							break
						}
						cnt++
					}
				})
			}
		})

		return pathCollection

	}

}
