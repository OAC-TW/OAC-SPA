## 海域遊憩活動一站式資訊平臺

## Project setup
```
npm install
```

### Compiles Typescript
```
npm run tsc -- -w
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### MSDeploy
* 建立 `./deployConfig.json` 並[配置](https://www.npmjs.com/package/msdeploy)部署相關設定
```
{
    "ComputerName": "",
    "UserName": "",
    "Password": "",
    "dest": "",
    "dist": "",
    ...
}
```
```
npm run deploy
```

### URL參數

* `?loc=23.830576,121.20172,7&cate=law&uuid=df595e60-6287-4623-8317-4b8d6f82e2e5&panel=礙航/射擊通報`
	* `loc=<$latitude>,<$longitude>,<$level>`
		* `<$latitude>` 緯度, 10進制, 有小數點
		* `<$longitude>` 經度, 10進制, 有小數點
		* `<$level>` 縮放層級, 整數
	* `cate=<$catelog>`
		* `<$catelog>` 分類內部值, 查`layerDef.json` >> `catelog`
	* `uuid=<$layer_uuid>`
		* `<$layer_uuid>` 圖層UUID, 查`layerDef.json` >> `layers` >> 圖層 >> `uuid`
	* `panel=<$panel_title>`
		* 待抽出?
		* `/src/components/toolTopRight.vue` >> `@click="openDrawer('礙航/射擊通報')"`
		* `src/components/info.vue` >> `template(v-if="value==='相關連結'")`, `template(v-else-if="value==='活動佈告欄'")`  ...

### About

* PWA & vue.config.js ( webpack compile setting )
    * workbox (injectManifest) [workbox api](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) 取得預緩存清單
    * 圖標素材 及 `manifest.json` 使用 `FaviconsWebpackPlugin`
        * `publicPath`影響會注入到`html <head>`的路徑
        * `start_url`、`scope` 路徑是相對於`manifest.json`所在位置
        
    * `./src/sw-manifest.js` workbox-webpack-plugin 會替換內容中 `self.__WB_MANIFEST` 為預緩存清單
    * `./src/sw.js` 工作線程，使用`copy-webpack-plugin`複製、注入以 `git-describe` 產生的 cahce Name (含版本號)

    * 其他參考
        * [leaflet TS、ES MODULE](https://cli.vuejs.org/config/)
        * [leaflet UML](https://leafletjs.com/examples/extending/class-diagram.html)
        * 緩存圖磚[地圖相關PWA專案範例](https://github.com/reyemtm/pwa-maps)
        * [esri-leaflet 可載入 arcgis 圖層](http://esri.github.io/esri-leaflet)
        * [unsafely-treat-insecure-origin-as-secure](https://stackoverflow.com/questions/40696280/unsafely-treat-insecure-origin-as-secure-flag-is-not-working-on-chrome)

* ~~`./public/legend.json`~~ 廢除, 移至`layerDef.json`
    ```typescript
        type A = {
            type:"color"|"text"
            colorScaleLabel:Array<Array<string>> // 顏色尺度-數值(降冪)
            colorScaleValue:Array<Array<string>> // 顏色尺度-顏色(降冪)
        }
        type B = {
            type:"text"
            colorScaleName:string // 顏色尺度 對應文字(不限排序)
        }
        Array<{   
            layerName:string // 圖層名稱正規字串
            label:string // 標籤名稱+單位
            layerName:string // 圖層名稱正規字串
        } & ( A | B )>
    ```
* ~~`./public/layerCatelog.json`~~ 廢除, 移至`layerDef.json`
    ```typescript
        Array<{
            catelog:{label:String,value:String} // 分類名稱定義
            layer: Array<String> // 屬於該分類的圖層名稱
        }>
    ```
* `./public/layerDef.json`
    ```typescript
		type geojson = {
			type: "geojson",
			pathOptions:{
				opacity:number
				color:string
				weight:number
				... // see geojson.ts
			},
		}
		type gradient = {
			type: "gradient",
			layerOption: {
				interpolateType: "nearestneighbor"| string // 預設使用雙線性內插
				... // see gradient.ts

				type: string // 圖例類型
				label: string // 圖例單位(顯示)
				colorScaleLabel: Array<string> // 顏色對應的數值
				colorScaleValue: Array<string> // 顏色定義
				colorScaleLabelName: Array<string> // 數值的顯示名稱
			}
		}
		type velocity = {
			type: "velocity",
			layerOption: {
				velocityScale: number
				lineWidth: number
				particleAge: number
				particleMultiplier: number
				... // see windy.ts
			}
		}
		// 底圖
		baseLayers:Array<{
			type:"wmts"
			title:string
			url:string
			imgUrl:string
			opacity:number
			maxZoom:number
		}> 
		// 一般圖層
		layers:Array<{
			title:string
			uuid:string
			url:string
			enable:boolean // 是否啟用(使用者看不到)
			visible:boolean // 是否預設顯示(使用者可自行打開)
			tag: Array<string> // ["A", "B", "C", "D"] from layerTags
			catelog: Array<string> // ["situation", "weather"] from "catelog"
			extra:string // 額外的UI顯示設定(dev)
		} & (geojson|gradient)> 
		// 分類
		catelog:Array<{
			label:string // 顯示名稱
			value:string // 內部值
		}>
    ```

* 參考 `src/@types/index.d.ts`
    * `typescript/init.ts` leaflet map 初始化，提供建立地圖的方法
    * `typescript/layer.ts` leaflet layer 圖層及擴展，含 圖層排序、增加、可見度、樣式設定

* `src/main.js` 
    * 配置引用宣告
    * 組件全局宣告

* `src/store.js` Vuex 狀態配置 : 自動匹配 `./components` 中任意資料夾的 `*.js` 作為狀態，並以路徑的資料夾名稱做為狀態的命名空間
* `src/sw.js` service worker主程式, 匯入workbox打包後的檔案列表`sw-manifest.js`, 並存入快取, (目前)其他資源直接bypass
* `src/custom.scss` 主題顏色變數、全局樣式
* `src/element-variables.scss` element-ui 樣式

### State 
* [ Vuex API ](https://vuex.vuejs.org/zh/guide/modules.html)
* root `./src/main.js`
* layer `./src/result/layerState.js`
* result `./src/result/resultState.js`

#### Todo
- [ ] strange UI : 
    * top-right buttons integerate all relative links
    * isoheStation.vue : show charts each item
- [ ] better velocity from cs8425
- [ ] check all event listener unbind
- [ ] try use scss in typescript : `declare module.*scss`
- [ ] `leaflet-filelayer`line:214 `_convertToGeoJSON()` not convert File to string (use in `typescript/layer/fileLayer.ts`)
``` js
const loader = L.FileLayer.fileLoader(...)
loader.loadData(file ,"filename.kmz") // file in leaflet-filelayer wasn't converted string
// change leaflet-filelayer`line:214
_convertToGeoJSON: function _convertToGeoJSON(content, format) {
    return new Promise((res,rej)=>{
        content.text().then(str=>{
            const parsed = (new window.DOMParser()).parseFromString(str, 'text/xml')
            // Format is either 'gpx' or 'kml'
            const geojson = toGeoJSON[format](parsed);
            res(this._loadGeoJSON(geojson))
        })
    })
}
```
