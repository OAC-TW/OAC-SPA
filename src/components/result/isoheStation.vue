<template lang="pug">

	.popup(v-if="data")
		pageHeader(
			:useBack="false" 
			:title="`${data.title}觀測站`"
		)
			el-link(
				:href="data.opendataLinkUrl" 
				target="_blank" 
				rel="noopener"
				icon="el-icon-question"
				style="float:right;margin:0.5rem 0;"
				title="查看資料來源"
			)
			
		//- 圖表 或 水平捲
		template(v-if="dirScrollBarVisibility")
			.scroll
				.scroll__wrapper(ref="bsScroll")
					.scroll__content
						.scroll__item(
							v-for="(v,index) in data.data" 
							:key="v.Date_Time"
						)
							strong {{v.Date_Time}}
							h3 {{getAngle(v[selectedWave])}}
		template(v-else)
			component(
				key="chart" 
				v-bind="historyChartOptions"
			)
		small 在圖表上移動到特定時間，下方表格會呈現對應的資料
		//- 項目卡片
		.cardGrid
			//- tideData
			template(v-if="data.type==='tide' && dataModel")
				el-card.dataCard(shadow="hover")
					.dataCard__row
						h3 潮位
						h3.caption 
							big {{dataModel.TideValue}}
					.dataCard__row
						small 觀測時間 {{dataModel.Date_Time}}
						el-tag(type="info" size="mini") 公尺
			//- windData
			template(v-if="data.type==='wind' && dataModel")
				el-card.dataCard(shadow="hover")
					.dataCard__row
						h3 平均風速 
						h3.caption 
							big {{dataModel.WS_AVG}}
					.dataCard__row
						small 觀測時間 {{dataModel.Date_Time}}
						el-tag(type="info" size="mini") 公尺/秒
			//- historyData / wave | 波浪海流
			template(v-if="data.type==='wave' && dataModel")
				el-card.dataCard(
					v-for="(v,k) in wave_enmu_name"
					@click.native="mouseEnterIndex = -1;selectedWave = k"
					:key="k"
					shadow="hover"
					:class="{'dataCard--actived':(k===selectedWave)}"
				)
					//- 當前隨圖表變動的
					template(v-if="k===selectedWave")
						.dataCard__row
							h3 {{wave_enmu_name[selectedWave]}}
							h3.caption 
								big {{wave_enmu_unit[selectedWave] ? dataModel[selectedWave] : getAngle(dataModel[selectedWave])}} 
						.dataCard__row
							small 觀測時間 {{dataModel.Date_Time}}
							el-tag(type="info" size="mini" v-if="wave_enmu_unit[selectedWave]") {{wave_enmu_unit[selectedWave]}}
					//- 不隨圖表變動的 預設第一筆
					template(v-else)
						.dataCard__row
							h3 {{v}}
							h3.caption 
								big {{wave_enmu_unit[k] ? data.data[0][k] : getAngle(data.data[0][k])}} 
						.dataCard__row
							small 觀測時間 {{data.data[0].Date_Time}}
							el-tag(type="info" size="mini" v-if="wave_enmu_unit[k]") {{wave_enmu_unit[k]}}

</template>

<script>

import pageHeader from "@/components/common/pageHeader"

import {VeLine} from 'v-charts'
import echarts from 'echarts'
import BScroll from 'better-scroll'


export default {
	name:"popup",
	components:{
		pageHeader,
		VeLine,
		BScroll
	},
	data:()=>({
		BScrollInstance:null,
		mouseEnterIndex:-1,
		// 波浪海流觀測資料
		wave_enmu_unit:{
			HS:"公尺",
			TP:"秒",
			// MDIR:"度",
			Tmean:"秒",
			Velocity:"公尺/秒",
			// Vmdir:"度",
		},
		wave_enmu_name:{
			HS: "波高",
			TP: "尖峰週期",
			MDIR: "波向",
			Tmean: "平均週期",
			Velocity: "流速",
			Vmdir: "流向"
		},
		selectedWave: "HS"
	}),
	props:{
		data: {
			type:Object // {title,type,data,opendataLinkUrl}
		}
	},
	watch:{
		dirScrollBarVisibility:{
			handler(bool){
				if(bool){
					this.$nextTick(()=>{
                        this.BScrollInstance = new BScroll(this.$refs.bsScroll,{
                            scrollX: true,
							probeType: 3, // listening scroll hook
							stopPropagation:true,
							tap:'tap'
						})
                        this.BScrollInstance.on("scroll",(e)=>{
                            console.log(this.BScrollInstance)
                            this.BScrollInstance.getCurrentPage()
                        })
					})
				}else{
					this.BScrollInstance && this.BScrollInstance.destroy()
				}
			}
		}
	},
	computed:{
		dirScrollBarVisibility(){
			return /MDIR|Vmdir/g.test(this.selectedWave) && this.data.type==='wave'
		},
		dataModel(){
			return this.mouseEnterIndex > -1 ? this.data.data[this.mouseEnterIndex] : this.data.data[0]
		},
		/** 圖表 @see https://echarts.apache.org/zh/option.html#legend.tooltip */
		historyChartOptions(){
			let option = {
				is:"ve-line",
				height:"240px",
				tooltip: {
					trigger: 'axis',
					formatter:arr=> `<strong>${arr[0].axisValueLabel}</strong>`,
					position: (pt,params)=>{
						this.mouseEnterIndex = params[0].dataIndex
						return [pt[0], '10%']
					}
				},
				xAxis: {
					type: 'category',
					inverse:true,
					data: []
				},
				yAxis: {
					type: 'value'
				},
				dataZoom: [{
					type: 'inside',
					start: 0,
					end: 50
				}, {
					start: 0,
					end: 50,
				}],
				series: [
					{
						name: 'simulation',
						type: 'line',
						smooth: true,
						symbol: 'none',
						sampling: 'average',
						itemStyle: {
							color: 'rgb(255, 70, 131)'
						},
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
								offset: 0,
								color: 'rgb(255, 158, 68)'
							}, {
								offset: 1,
								color: 'rgb(255, 70, 131)'
							}])
						},
						data: []
					}
				]
			}
			
			// this.data {title,type,data,opendataLinkUrl}
			const DATA = this.data.data
			switch(this.data.type){
				case "tide":
					option.xAxis.data = DATA.map(i=> i.Date_Time)
					option.series[0].name = "潮位"
					option.series[0].data = DATA.map(i=> i.TideValue)
					break 
				case "wave":
					option.xAxis.data = DATA.map(i=> i.Date_Time)
					option.series[0].name = this.wave_enmu_name[this.selectedWave]
					option.series[0].data = DATA.map(i=> i[this.selectedWave])
					break 
				case "wind":
					option.xAxis.data = DATA.map(i=> i.Date_Time)
					option.series[0].name = "風速"
					option.series[0].data = DATA.map(i=> i.WS_AVG) // WS_AVG
					break 
			}
			return option
		}
	},
	mounted(){
		console.log("isoheStation",this.data)
	},
	methods:{
		getAngle(deg){
			const aEnum = [
				["北",384.76,11.25],
				["北東北",11.26,33.75],
				["東北",33.76,56.25],
				["東東北",56.26,78.75],
				["東",78.76,101.25],
				["東東南",101.26,123.75],
				["東南",123.76,146.25],
				["南東南",146.26,168.75],
				["南",168.76,191.25],
				["南西南",191.26,213.75],
				["西南",213.76,236.25],
				["西西南",236.26,258.75],
				["西",258.76,281.25],
				["西西北",281.26,303.75],
				["西北",303.76,326.25],
				["北西北",326.26,348.75],
			]
			let textDeg = '-'
			if(typeof deg === "number"){
				deg = deg%360
				let finded = aEnum.find(i=>deg<=i[2] && deg>=i[1])
				textDeg = finded ? finded[0] : textDeg
			}
			return textDeg
		}
	}
}
</script>

<style lang="scss" scoped>

.popup{
	margin: 0 auto;
	max-width:900px;
	min-width: 300px;
}

.caption {
	color:$primary;
	display: inline;
	margin: 0 0.5rem;
}


/deep/ {
	.el-tag,.el-card{
		border-radius: 1rem;
	}
	.el-tag{
		margin-left: 0.5rem;
	}
	.el-card{
		background-color: #fff;
		&__body{
			line-height: 150%;
		}
	}
}

.scroll{
	width: 100%;
	overflow: hidden;
	&__wrapper{
		white-space: nowrap;
	}
	&__content{
		display: inline-block;
	}
	&__item{
		display: inline-block;
		padding: 1rem;
		margin: 0.5rem;
		border-radius: 1rem;
		border: 1px solid $info;
	}
}

.cardGrid{
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	margin: 0 -0.5rem;
}

.dataCard{
	flex: 1 1 300px;
	cursor: pointer;
	margin: 0.5rem;
	&--actived{
		background-color: rgba($primary,0.1);
		border: 1px solid $primary;
	}
	@media screen and (max-width:768px){
		flex: 1 1 300px;
		&--actived{
			position: sticky;
			bottom: 1rem;
			background-color: $primary;
			color: #ffffff;
			.caption{ color: #ffffff; }
		}
	}
	&__row {
		&>*{
			margin: 0;
		}
		display:flex;
		justify-content:space-between;
		align-items: center;
	}
}

</style>