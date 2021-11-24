import Windy from './windy';
import CanvasBound from './canvasBound'
import MapBound from './mapBound';
import Layer from "./layer";
import {CanvasLayer} from './L.CanvasLayer';

export class VelocityLayer extends L.Layer implements ILayer{

  private _canvasLayer: any = null;
  private _windy: Windy = null;
  private _context: any = null;
  private _displayTimeout: any = 0;
  // private _mouseControl: any  = null;
  private _data: any  = null;

  id: string;
  type: string;
  title: string;
  catelog: { label: string; value: string; }[];
  tag: string[];
  visible: boolean;
  sortable?: boolean;
  opacity: number;
  dataSet: { label: string; value: string; }[];
  imgUrl?: string;
  legendColor?: string;
  icon?: string;
  iconUrl?: string;
  status:"loading"|"loaded"|"error"
  lyrOpts:any = null
  dataIndexDef:Array<{
      name:string,
      time08:string
  }>
  times:Array<string>
  group: Array<{ name: string, order: number }>
  enable: boolean

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
  }) {
    super(lyrOpts)
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
    this.lyrOpts = lyrOpts
    this.group = group
    this.enable = enable
  }

  async fetchData(idx:number = 0):Promise<any>{
    const url = this.lyrOpts.url.replace(/index.json$/ig,this.dataIndexDef[idx].name)
    return await (await fetch(url)).json()
  }

  async setTimeData(time:string = this.times[0]){
      try{
          const idx = this.times.indexOf(time)
          this._data = await this.fetchData(idx)
          if(this._windy){
            this._windy.setData(this._data)
            this._startWindy();
          }
      }catch(e){
          console.error(e)
      }
  }

  onAdd(map: any) {

    (async()=>{
      try{
        this.status = "loading"
        // get index file and times
        this.dataIndexDef = await (await fetch(this.lyrOpts.url)).json()
        this.times = this.dataIndexDef.map(i=>i.time08)

        await this.setTimeData()

        //! will envoke this.onDrawLayer() by delegate()
        this._canvasLayer = new CanvasLayer().delegate(this);
        this._canvasLayer.addTo(map);
        
        this.fireEvent("loaded")
        this.status = "loaded"
      }catch(e){
        this.status = "error"
        this.fireEvent("error",e)
      }
    })()
    
    return this
  }

  onRemove(map: any) {
    this._destroyWind();
    return this
  }

  onDrawLayer(overlay: any, params: any) {
    
    !this._windy && this._initWindy();

    if (this._displayTimeout) clearTimeout(this._displayTimeout);

    this._displayTimeout = setTimeout(()=>{
      this._startWindy()
    },150)

  }

  _startWindy() {
    
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvasLayer._canvas, topLeft);
    
    var bounds = this._map.getBounds();
    var size = this._map.getSize();

    // bounds, width, height, extent
    this._windy.start(
      new Layer(
        new MapBound(
          bounds.getNorthEast().lat,
          bounds.getNorthEast().lng,
          bounds.getSouthEast().lat,
          bounds.getSouthWest().lng
        ),
        new CanvasBound(0, 0, size.x, size.y)
      )

    );
  }
  
  getEvents(){
      return {
        dragstart:this._clearWind,
        dragend:this._clearAndRestart,
        zoomstart:this._clearWind,
        zoomend:this._clearAndRestart,
        resize:this._clearAndRestart
      }
  }

  _initWindy() {
    this._windy = new Windy({
      ...this.lyrOpts.layerOption,
      ...{ 
        canvas: this._canvasLayer._canvas,
        data:this._data
      }
    });

    // prepare context global var, start drawing
    this._context = this._canvasLayer._canvas.getContext('2d');
    this._canvasLayer._canvas.classList.add("velocity-overlay");
    (<any>this).onDrawLayer();

    (<any>this._map).on(this.getEvents(),this)

    // this._initMouseHandler();
  }

  // _initMouseHandler() {
    // if (!this._mouseControl && this.options.displayValues) {
    //   var options = this.options.displayOptions || {};
    //   options['leafletVelocity'] = this;
    //   // this._mouseControl = L_controlVelocity();
    //   this._mouseControl.setWindy(this._windy);
    //   this._mouseControl.setOptions(this.options.displayOptions);
    //   this._mouseControl.addTo(this._map);
    // }
  // }

  _clearAndRestart() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._windy) this._startWindy();
  }

  _clearWind() {
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  }

  _destroyWind() {
    
    this._displayTimeout && clearTimeout(this._displayTimeout);
    this._windy && this._windy.stop();
    this._context && this._context.clearRect(0, 0, 3000, 3000);
    
    // if (this._mouseControl)
    //   this._map.removeControl(this._mouseControl);
    // this._mouseControl = null;

    this._windy = null;
    this._map.removeLayer(this._canvasLayer);
    (<any>this._map).off(this.getEvents(),this)
  }
}
