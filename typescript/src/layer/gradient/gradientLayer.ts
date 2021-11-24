import { GradientCanvas } from './gradient'

function parseColorScale(lyrOpts) {
	if (lyrOpts && lyrOpts.layerOption && lyrOpts.layerOption.colorScaleValue) {
		let opt = lyrOpts.layerOption;
		if (opt.maxIntensity || opt.minIntensity) return;
		let { colorScaleLabel,colorScaleValue } = opt;
		opt.maxIntensity = Number(colorScaleLabel[0]);
		opt.minIntensity = Number(colorScaleLabel[colorScaleLabel.length-1]);
		opt.colorScale = Object.assign([],colorScaleValue).reverse();
	}
	return lyrOpts
}

export class GradientLayer extends L.Layer implements ILayer{
    
    id: string
    type: string
    title: string
    catelog: { label: string; value: string }[]
    tag: string[]
    visible: boolean
    sortable?: boolean
    opacity: number
    dataSet: { label: string; value: string }[]
    status:"loading"|"loaded"|"error"
    icon?: string
    iconUrl?: string
    group: Array<{ name: string, order: number }>
    enable: boolean

    protected _canvas:HTMLCanvasElement = null
    protected _frame:any = null
    protected _builder:any = null
    protected _context:CanvasRenderingContext2D = null

    lyrOpts:any = null
    dataIndexDef:Array<{
        name:string,
        time08:string,
        min_intensity:number,
        max_intensity:number
    }>
    times:Array<string>

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
        this.opacity = opacity
        this.dataSet = dataSet
        this.icon = lyrOpts?.layerOption?.icon
        this.iconUrl = lyrOpts?.layerOption?.iconUrl
        this.lyrOpts = parseColorScale(lyrOpts)
        this.group = group
        this.enable = enable
    }

    async fetchData(idx:number = 0):Promise<Array<{data:any,header:any}>>{
        const url = this.lyrOpts.url.replace(/index.json$/ig,this.dataIndexDef[idx].name)
        return await (await fetch(url)).json()
    }

    async setTimeData(time:string = this.times[0]){
        try{
            const idx = this.times.indexOf(time)
            const data = await this.fetchData(idx)
            
            if(Array.isArray(data)){ // format A
                console.log("[data typeof format A]",data)
                this.lyrOpts.data = {
                    d: {'v': data[0].data},
                    la1: data[0].header.la1,
                    la2: data[0].header.la2,
                    lo1: data[0].header.lo1,
                    lo2: data[0].header.lo2,
                    nx: data[0].header.nx,
                    ny: data[0].header.ny,
                }
            }else{ // format B
                console.log("[data typeof format B]",data)
                this.lyrOpts.data = data
            }

            !this._builder && this._init()
            this._builder.setData(this.lyrOpts.data)
            this.needRedraw()
        }catch(e){
            console.error(e)
        }
    }

    setOption(opts:{
        minIntensity:number,
        maxIntensity:number
        colorScale?:Array<string>
    }){
        console.log("[GradientLayer setOption]",opts)
        !this._builder && this._init()
        this._builder.setOptions(opts)
    }

    /** @override */
    onAdd(map){
        (async ()=>{
            try{
                this.status = "loading"
                this._canvas = L.DomUtil.create("canvas", "gradient-overlay") as HTMLCanvasElement

                let size = map.getSize()
                this._canvas.width = size.x
                this._canvas.height = size.y
        
                map.getPane("overlayPane").appendChild(this._canvas)
                
                map.on(this.getEvents(),this)
                
                // get index file and times
                this.dataIndexDef = await (await fetch(this.lyrOpts.url)).json()
                this.times = this.dataIndexDef.map(i=>i.time08)
                
                await this.setTimeData()
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
        
        map.getPane("overlayPane").removeChild(this._canvas)
        map.off("mousemove", this.onMouseMove);

        this._canvas = null
        
        map.off(this.getEvents(),this)
        
        if(this._frame) L.Util.cancelAnimFrame(this._frame)
        
        /** 清除創建的windy實例 */
        this._builder.stop()
        this._builder = null

        return this
    }

    /** @override */
    getEvents(){
        return {
            resize: this._resizeHandler,
            zoomstart:this._zoomStartHandler,
            zoomend:this.needRedraw,
            moveend: this.draw
        }
    }
    
    draw():void {
        if(this._frame) return
        /** @see https://developer.mozilla.org/zh-TW/docs/Web/API/Window.requestAnimationFrame */
        this._frame = L.Util.requestAnimFrame(()=>{
            this._start()
            this._frame = null
        }, this)
    }

    /**
     * redraw canvas by requestAnimFrame 
     * @see https://developer.mozilla.org/zh-TW/docs/Web/API/Window.requestAnimationFrame 
     */
    needRedraw():void {
        /** clear canvas */
        if(this._context) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
        if(this._frame) return
        this._frame = L.Util.requestAnimFrame(()=>{
            this._start()
            this._frame = null
        }, this)
    }

    protected _init(){
        this._builder = new GradientCanvas({
            ...{
                canvas: this._canvas,
                map: this._map,
                displayValues:false,
                reverseY: true
            },
            ...this.lyrOpts.layerOption
        })
//console.log("[GradientCanvas]", this._builder)
        this._context = this._canvas.getContext("2d")
    }

    private _start(){

        !this._builder && this._init()

        const tl = this._map.containerPointToLayerPoint([0, 0])
        L.DomUtil.setPosition(this._canvas, tl)

        let bounds = this._map.getBounds()

        let size = this._map.getSize() // bounds, width, height, extent

        this._builder.start([
            [0, 0],
            [size.x, size.y]
        ], size.x, size.y, [
            [bounds.getSouthWest().lng, bounds.getSouthWest().lat],
            [bounds.getNorthEast().lng, bounds.getNorthEast().lat]
        ])
    }

    private _resizeHandler(resizeEvent){
        this._canvas.width = resizeEvent.newSize.x
        this._canvas.height = resizeEvent.newSize.y
    }

    private _zoomStartHandler(){
        this._builder.stop()
        if(this._context) this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)
    }
    
    /** 取得指標位置的資訊 */
    onMouseMove(cb:(evt:any)=>void){
        this._map.on("mousemove",(e:any)=>{
            console.log("mouse move",e)
            if(e.type === "Point"){
                const pos = this._map.containerPointToLatLng(L.point(e.containerPoint.x, e.containerPoint.y));
                const gridValue = this._builder.interpolatePoint(pos.lng, pos.lat);
            }
        })
    }

}

export class WavePeriodGradientLayer extends GradientLayer{
    constructor(opts){
        super(opts)
        if (this.lyrOpts.layerOption) {
            this.lyrOpts.layerOption.maxIntensity *= 100
            this.lyrOpts.layerOption.minIntensity *= 100
        }
    }
    async setTimeData(time:string = this.times[0]){
        try{
            console.log("[WavePeriod]",time)
            const idx = this.times.indexOf(time)
            const data = await this.fetchData(idx) as any
            console.log("[WavePeriod]",data)

            this.lyrOpts.data = {
                d: {'v': data.d["週期"]},
                la1: data.la1,
                la2: data.la2,
                lo1: data.lo1,
                lo2: data.lo2,
                nx: data.nx,
                ny: data.ny,
            }
            !this._builder && this._init()
            this._builder.setData(this.lyrOpts.data)
            this.needRedraw()
        }catch(e){
            console.error(e)
        }
    }
    /**@override */
    setOption(opts:{
        minIntensity:number,
        maxIntensity:number
        colorScale?:Array<string>
    }){
        opts.maxIntensity*= 100
        opts.minIntensity*= 100
        console.log("[ WavePeriodGradientLayer @override setOpts ]",opts)
        !this._builder && this._init()
        this._builder.setOptions(opts)
    }
}

export class WaveHeightGradientLayer extends GradientLayer{
    constructor(opts){
        super(opts)
        if (this.lyrOpts.layerOption) {
            this.lyrOpts.layerOption.maxIntensity *= 100
            this.lyrOpts.layerOption.minIntensity *= 100
        }
    }
    async setTimeData(time:string = this.times[0]){
        try{
            console.log("[WaveHeight]",time)
            const idx = this.times.indexOf(time)
            const data = await this.fetchData(idx) as any
            console.log("[WaveHeight]",data)
            
            this.lyrOpts.data = {
                d: {'v': data.d["浪高"]},
                la1: data.la1,
                la2: data.la2,
                lo1: data.lo1,
                lo2: data.lo2,
                nx: data.nx,
                ny: data.ny,
            }
            !this._builder && this._init()
            this._builder.setData(this.lyrOpts.data)
            this.needRedraw()
        }catch(e){
            console.error(e)
        }
    }
    /** @override cm to m */
    setOption(opts:{
        minIntensity:number,
        maxIntensity:number
        colorScale?:Array<string>
    }){
        opts.minIntensity*=100
        opts.maxIntensity*=100
        console.log("[ WaveHeightGradientLayer @override setOpts ]",opts)
        !this._builder && this._init()
        this._builder.setOptions(opts)
    }
}
