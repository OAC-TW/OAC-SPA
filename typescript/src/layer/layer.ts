

import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet-geometryutil"

const uuidv4 = require('uuid/v4')

import { GeojsonLayer } from "./geojsonLayer"
import { 
    GradientLayer,
    WavePeriodGradientLayer,
    WaveHeightGradientLayer
} from "./gradient/gradientLayer"

import { VelocityLayer } from "./velocity/L.VelocityLayer"
import { TyphoonLayer } from "./typhoonLayer"
import { 
    clusterMarkerLayer,
    IsoheStationLayer,
    ScenicSpotLayer,
    WaterQualityLayer,
    TidalLayer,
    ForecastLayer,
} from "./clusterMarkerLayer"

export class Layer {

    catelog:any
    private _map:L.Map
    
    baseLayerColletion:baseLayerColletion = new Array()
    normalLayerCollection:normalLayerCollection = new Array()
    
    constructor(map:L.Map, catelog:any){
        this._map = map
        this.catelog = catelog
    }

    getCatelog(title) {
        const result = this.catelog.filter(i=>i.layer.some(_name=>new RegExp(_name,"g").test(title))).map(i=>i.catelog)
        if(!result.length) console.error(`無法取得${title}的分類`)
        return result
    }

    /** 設置圖層屬性 */
    setOpts(id:string,opts: L.PathOptions){
        
        let bl = this.baseLayerColletion.find(l=>l.id === id)
        let nl = this.normalLayerCollection.find(l=>l.id === id)
        const ptr = bl || nl

        try{
            if(ptr instanceof L.GeoJSON){
                ptr.setStyle(opts)
            }else if (ptr instanceof L.TileLayer ){
                let o = opts.opacity || opts.fillOpacity || 0
                ptr.setOpacity(o>1 ? o/100 : o)
            }else{
                console.error(ptr)
                throw("setStyle() Not GeoJSON || FeatureGroup")
            }
        }catch(e){
            console.error(e)
        }
        
    }

    /** 設置圖層集合中圖層的可見度 */
    setVisible(id:string,bool:boolean)
    setVisible(id:string,bool:undefined)
    setVisible(id:string,bool:any){
        if(bool === undefined){
            this.baseLayerColletion.forEach(l=>{
                if(l.id === id && !this._map.hasLayer(l)){
                    l.addTo(this._map)
                    l.visible = true
                }else{
                    this._map.removeLayer(l)
                    l.visible = false
                }
            })
        }else{
            let nl = this.normalLayerCollection.find(l=>l.id === id)
            if(!nl) return
            if(bool){
                if(!this._map.hasLayer(nl)){
                    nl.addTo(this._map)
                    nl.visible = true
                }
                // 重排序 : 因移除後重新加回會使目標圖層跑至地圖最上，集合中紀錄的索引位置才是其原本真正位置
                this.normalLayerCollection.forEach(l=> 'bringToFront' in l && l.bringToFront())
            }else{
                if(this._map.hasLayer(nl)){
                    this._map.removeLayer(nl)
                    nl.visible = false
                }
            }
        }
    }

    /** 排序一般圖層 bringToBack()最底、bringToFront()最頂 */
    reorderNormalLayer(id:string,oldIndex:number,newIndex:number){
        
        // 取得的新舊索引需反轉(視圖為反轉的)
        let rvNewIndex = this.normalLayerCollection.length-1-newIndex
        let rvOldIndex = this.normalLayerCollection.length-1-oldIndex
        console.log("rvNewIndex",rvNewIndex, this.normalLayerCollection[rvNewIndex].title)
        console.log("rvOldIndex",rvOldIndex, this.normalLayerCollection[rvOldIndex].title)

        // 偏移 <0 往下 >0 往上
        let offset = rvNewIndex-rvOldIndex
        console.log("offset", offset)

        // 要移動的目標
        // array尾 == 上層
        let ptr = this.normalLayerCollection[rvOldIndex]
        console.log(ptr)
        //console.log("[ before order ]", this.normalLayerCollection.map(l=>l.title).reverse())

        if(offset>0){
            // 依偏移量逐個交換，以更新用來記錄的集合
            let cnt = rvOldIndex
            for (let index = 0; index <Math.abs(offset); index++) {
                // console.log(`swap ${temp}-${temp+1}`)
                let ptr = this.normalLayerCollection[cnt]
                this.normalLayerCollection[cnt] = this.normalLayerCollection[cnt+1]
                this.normalLayerCollection[cnt+1] = ptr
                cnt += 1
            }
        }else if(offset<0){
            // 依偏移量逐個交換，以更新用來記錄的集合
            let cnt = rvOldIndex
            for (let index = 0; index <Math.abs(offset); index++) {
                // console.log(`swap ${cnt}-${cnt-1}`)
                let ptr = this.normalLayerCollection[cnt]
                this.normalLayerCollection[cnt] = this.normalLayerCollection[cnt-1]
                this.normalLayerCollection[cnt-1] = ptr
                cnt -= 1
            }
        }

        if (offset) {
            // 使用 bringToFront 逐個移到上層 使目標回到正確索引
            for (let idx in this.normalLayerCollection) {
                const l = this.normalLayerCollection[idx]
                "bringToFront" in l && l.bringToFront()
//console.log("[ bringToFront ]", l.title)
            }
        }
        //console.log("[ after order ]", this.normalLayerCollection.map(l=>l.title).reverse())

    }
    
    async addLayer(lyrDefs:any|Array<any>){

        if(!Array.isArray(lyrDefs)) lyrDefs = [lyrDefs]

        for (const lyrOpts of lyrDefs) {
            const mapFn = {
                "geojson":GeojsonLayer,
                "gradient":GradientLayer,
                "velocity":VelocityLayer,
                "clusterMark":clusterMarkerLayer,
                "markScenicSpot":ScenicSpotLayer,
                "markIsoheStation":IsoheStationLayer,
                "wavePeriodGradient":WavePeriodGradientLayer,
                "waveHeightGradient":WaveHeightGradientLayer,
                "typhoonLayer":TyphoonLayer,
                "markWaterQuality": WaterQualityLayer,
                "markTidalLayer": TidalLayer,
                "markForecastLayer": ForecastLayer,
            }
            const lyrIns = new mapFn[lyrOpts.type]({
                ...lyrOpts,
                id:uuidv4(),
                catelog:this.getCatelog(lyrOpts.title)
            })
            this.normalLayerCollection.push(lyrIns)
            
            if(!lyrIns.visible) continue

            lyrIns.addTo(this._map)
            try{
                await new Promise((res,rej)=>{
                    lyrIns.once("loaded",e=>res())
                    lyrIns.once("error",e=>rej(e))
                })
            }catch(e){
                console.error(`${lyrIns.title}`,e)
            }
        }
        console.log("%c added layer : ","background:green;",this.normalLayerCollection)
    }
    
    addBaseLayer(lyrDefs:any|Array<any>){
        if(!Array.isArray(lyrDefs)) lyrDefs = [lyrDefs]
        
        lyrDefs.forEach(({
            type,
            url,
            title,
            opacity,
            maxZoom,
            imgUrl
        },idx) => {
            if(type !== "wmts"){
                console.error("addBaseLayer invali type",type)
                return
            }
            
            const tileLayer = L.tileLayer(url, {
                opacity,
                maxZoom,
            }) as any
            
            tileLayer.id = uuidv4()
            tileLayer.type = type
            tileLayer.title = title
            tileLayer.visible = idx === (lyrDefs.length-1)
            tileLayer.opacity = opacity
            tileLayer.imgUrl = imgUrl

            this.baseLayerColletion.push(tileLayer)
            tileLayer.visible && tileLayer.addTo(this._map)  
        })
    }

	getLayerAt(point, y) {
		var viewportPoint = this._mapPointToDocumentPoint(point, y);

		if(!viewportPoint) return;

		var el = document.elementFromPoint(viewportPoint.x, viewportPoint.y);

		return this._getLayerFromDOMElement(el);
	}

	getLayersAt(point, y) {
		var viewportPoint = this._mapPointToDocumentPoint(point, y);

		if(!viewportPoint) return;

		var els = this._getElementsFromPoint(viewportPoint.x, viewportPoint.y);
		var out = [];
console.log("[ins.getLayersAt]", point, y, viewportPoint, els)
		for(var i = 0; i < els.length; i += 1) {
			var lay = this._getLayerFromDOMElement(els[i]);
			if(lay) out.push(lay);
		}
		return out;
	}

	_mapPointToDocumentPoint(point, y) {
		point = L.point(point, y);

		// Ignore points outside the map
		if (!this._map.getSize().contains(point)) { return; }

		var mapPos = this._map._container.getBoundingClientRect();

		return L.point(mapPos.left, mapPos.top).add(point);
	}

	_getElementsFromPoint(x, y) {
		var _container = this._map.getContainer();
		var stack = [], e;
		do {
			var el = document.elementFromPoint(x, y);
			if(e == el) break; // same element ?!
			e = el;
			stack.push([el, el.style.pointerEvents]);
			el.style.pointerEvents = 'none';
		}while(el !== _container);

		// clean up
		for(var i  = 0; i < stack.length; i += 1){
			var el = stack[i];
			el[0].style.pointerEvents = el[1];
			stack[i] = el[0];
		}

		return stack;
	}

	_getLayerFromDOMElement(el) {
		if ((!el) || el === this._map._container) {
			// Stop the search when the map container itself is reached (meaning no
			// layer at the requested point) or the container is undefined (the
			// DOM elements were traversed up to the Document, meaning the map
			// is invisible e.g. because CSS)
			return;
		}

		var id = L.stamp(el);
		if (id in this._map._targets) {

			/// TODO: Extra logic for canvas, maybe another call to getLayerAt

			return this._map._targets[id];
		}

		return this._getLayerFromDOMElement(el.parentElement);
	}

	metersPerPixel(latitude, zoomLevel) {
		var earthCircumference = 40075017;
		var latitudeRadians = latitude * (Math.PI/180);
		return earthCircumference * Math.cos(latitudeRadians) / Math.pow(2, zoomLevel + 8);
	}

    query(latlng:L.LatLng){
        let map:L.Map = this._map;
        let payload:Array<IQueryResult> = new Array()
//        let px2meter = this.metersPerPixel(latlng.lat, map.getZoom());
//console.log("[px2meter]", px2meter)

        map.eachLayer((l:any)=>{
            if(l.visible && l instanceof GeojsonLayer){
		l.deHighLightPath()

                const pathCollection = l.getFeaturePropertiesBylatlng(latlng, map, 5)
                const {id,title,catelog,tag} = l
                pathCollection.forEach(path=>{
                    payload.push({
                        layerId:id,
                        layerTitle:title,
                        layerCatelog:catelog,
                        tag,
                        dataId: uuidv4(),
                        data:path.feature.properties,
                        /** @see https://leafletjs.com/reference-1.6.0.html#map-flytobounds */
                        goTo:flyToBoundsOption=>{
                            l.deHighLightPath()
                            l.highLightPath([path])
                            map.flyToBounds(path.getBounds(),flyToBoundsOption)
                        }
                    })
                })
                l.highLightPath(pathCollection) // 高亮
            }
        })
        return payload
    }

}
