require("leaflet-filelayer")()

export class FileLayer extends L.Layer implements ILayer{
    
    id: string
    type: string
    title: string
    catelog: { label: string; value: string }[]
    tag: string[]
    visible: boolean
    sortable?: boolean
    opacity: number
    dataSet: { label: string; value: string }[]
    imgUrl?: string
    legendColor?: string
    icon?: string
    iconUrl?: string
    status:"loading"|"loaded"|"error"
    lyrOpts:any

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
        this.lyrOpts = lyrOpts
    }

    
    async fetchData(){
        return await (await fetch(this.lyrOpts.url)).blob()
    }


    /**@override  */
    onAdd(map:L.Map){
        (async ()=>{
            const blob = await this.fetchData()
            const file = new File([blob],"kml.kml")
            const loader = L.FileLayer.fileLoader(
                map,{
                    layerOptions:{
                        style:{
                            color:"red",
                            fillOpacity:"red"
                        }
                    },
                    addToMap: true,
                    fileSizeLimit:  1000000
                }
            )
            loader.on("data:loaded", e=>console.log("[res]",e))
            loader.loadData(file, "fifows_typhoon.kml")

        })()
        return this
    }

}
