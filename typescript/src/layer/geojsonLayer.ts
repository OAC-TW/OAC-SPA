const leafletPip = require("@mapbox/leaflet-pip")
const uuidv4 = require('uuid/v4')

export class GeojsonLayer extends L.GeoJSON implements ILayer{
    
    id: string
    type: string
    title: string
    catelog: { label: string; value: string }[]
    tag: string[]
    visible: boolean
    opacity: number
    dataSet: { label: string; value: string }[]
    legendColor: string
    status:"loading"|"loaded"|"error"
    lyrOpts:any
    group: string
    enable: boolean
    sortable?: boolean

    private _Geojson:L.GeoJSON

    // 保存上一次 highLight path
    private _lastHighLightPathCollection:Array<{
        path:Path
        lastStyle:L.PathOptions
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
        ...lyrOpts
    }){
        super()
        this.id = id
        this.type = type
        this.title = title
        this.catelog = catelog
        this.tag = tag
        this.visible = visible
        this.sortable = sortable
        this.opacity = lyrOpts.pathOptions.opacity
        this.dataSet = dataSet
        this.lyrOpts = lyrOpts
        this.group = group
        this.enable = enable
        
        const {pathOptions} = this.lyrOpts
        this.legendColor = pathOptions.color.match(/\d+/g).join(",") // ${}

        this.opacity = pathOptions.opacity
    }

    async fetchData(){
        return await (await fetch(this.lyrOpts.url)).json()
    }

    /** @override */
    bringToFront(){
        this._Geojson && this._Geojson.bringToFront()
        return this
    }
    /** @override */
    bringToBack(){
        this._Geojson && this._Geojson.bringToBack()
        return this
    }
    /** @override */
    setStyle(opts:L.PathOptions){
        if("opacity" in opts || "fillOpacity" in opts){
            let o = opts.opacity || opts.fillOpacity || 0
            o = o>1 ? o/100 : o
            opts.opacity = o
            opts.fillOpacity = o
        }
        if("color" in opts || "fillColor" in opts){
            opts.color = opts.color || opts.fillColor
            opts.fillColor = opts.color || opts.fillColor
        }
        this._Geojson.setStyle(opts)
        return this
    }

    /** @override */
    onAdd(map){
        (async()=>{
            try{
                this.status = "loading"

                let data = await this.fetchData()

                if(data.hasOwnProperty("crs") && /3857/g.test(data.crs.properties.name)){
                    const reproject = require('reproject')
                    const epsg = require('epsg')
                    data = reproject.toWgs84(data, undefined, epsg)
                }

                this._Geojson = L.geoJSON(data) as L.GeoJSON

                this.setStyle(this.lyrOpts.pathOptions)
                this._Geojson.addTo(map)
                
                this.status = "loaded"
                this.fireEvent("loaded")
            }catch(e){
                this.status = "error"
                this.fireEvent("error",e)
            }
        })()
        return this
    }

    /** @override */
    onRemove(map){
        this._Geojson.removeFrom(map)
        this._Geojson.off("click",this.handleQueryClick)
        return this
    }

    
    /** 高亮圖層 */
    highLightPath(pathCollection:Array<Path>){
        pathCollection.length && pathCollection.forEach(path=>{
            this._lastHighLightPathCollection.push({
                path:path,
                lastStyle: Object.assign({}, path.options),
            })
            //path.bringToFront()
            path.setStyle({
                color:"yellow",
                fillColor:path.options.color,
                opacity:1,
                weight: 5
            })
        })
        return this._lastHighLightPathCollection
    }

    /** 清除高亮圖層 */
    deHighLightPath(){
        if(this._lastHighLightPathCollection.length){
            this._lastHighLightPathCollection.forEach(path => {
                path.path.setStyle(path.lastStyle)
                path.path.redraw()
            })
            this._lastHighLightPathCollection.length = 0

            // 重排序 : 因移除後重新加回會使目標圖層跑至地圖最上，集合中紀錄的索引位置才是其原本真正位置
            //this._map.eachLayer((lyr:any)=>lyr instanceof GeojsonLayer && lyr.bringToFront())
        } 
    }

    getFeaturePropertiesBylatlng(latlng:L.LatLng, map, radius = 1){

        let pathCollection = []

        const matched_polygons = leafletPip.pointInLayer([latlng.lng,latlng.lat],this._Geojson)
        pathCollection.push(...matched_polygons)
        
        // const match_polylines = L.GeometryUtil.layersWithin(this._map,,latlng,10)
        this._Geojson.eachLayer((path:L.Path)=>{
            if(path instanceof L.Polyline){
                path.getLatLngs().forEach(t=>{
                    let cnt = 0
                    while(t[cnt+1]){
                        if(!(t[cnt] instanceof L.LatLng)) break
                        let dst = L.GeometryUtil.distanceSegment(map, latlng, t[cnt], t[cnt+1]);
                        if(dst <= radius) {
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
