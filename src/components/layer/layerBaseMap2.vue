<template lang="pug">

.baseMap
	slot(name='header')
	.baseMap__current(key='current')

		el-image.baseMap__current__image(
			fit='cover',
			:alt='currentName',
			:src='currentImgPath',
		)

		.baseMap__current__slider
			el-slider(
				:value="currentOpacity"
				@input="handleBaseLayerOpacity($event)"
				:step='10'
				:show-tooltip='false'
			)
			
			//- .button
			//- 	span
			//- 		strong {{ currentName }}
			el-tag.currentName(
				type='primary',
				title='當前底圖',
			)
				strong {{ currentName }}

	.baseMap__list(
		key="list"
	)
		//- baseLayers
		el-radio-group(
			:value="currentID" ,
			@input="handleBaseLayerVisibility($event)",
		)
			el-radio(
				v-for="(lyr,index) in allLayerList",
				:key="`${index}`",
				:label="`${lyr.id}`",
				border,
			)
				el-image(
					fit="cover" ,
					:alt='`選擇${lyr.title}`',
					:src='require(`@/assets/basemap/${lyr.imgUrl}`)',
				)
				strong {{ lyr.title }}

		//- el-button(
		//- 	style='width:100%;',
		//- 	round,
		//- 	plain,
		//- 	:size="size",
		//- 	icon='el-icon-arrow-down',
		//- 	title='取消選擇底圖',
		//- 	@click='SET_CARD_VISIBLE({ key: "baseMap", bool: false })',
		//- 	type="danger",
		//- ) 取消

</template>

<script>
import { mapGetters, mapMutations } from 'vuex';

export default {
	name: 'baseLayer',
	data: () => ({}),
	computed: {
		size() {
			return this.$store.getters.isMobile ? 'mini' : 'small';
		},
		allLayerList() {
			return this.$store.state.layer.baseLayer;
		},
		currentLayer() {
			return this.allLayerList.find((l) => l.visible);
		},
		currentName() {
			let name = this.currentLayer.title;
			// 黑底底圖直接操作 DOM 改背景顏色
			document.querySelector('#viewDiv').style.backgroundColor = /黑底/g.test(
				name,
			)
				? '#2a2a2a'
				: 'transparent';
			return name;
		},
		currentID() {
			return this.currentLayer.id;
		},
		currentImgPath() {
			return require('@/assets/basemap/' + this.currentLayer.imgUrl);
		},
		currentOpacity() {
			return Number(Number(this.currentLayer.opacity * 100).toFixed(0));
		},
	},
	methods: {
		...mapMutations({
			UPDATE_BASELAYER_OPTIONS: 'layer/UPDATE_BASELAYER_OPTIONS',
			SET_CARD_VISIBLE: 'SET_CARD_VISIBLE',
		}),
		handleBaseLayerVisibility(id) {
			//- update map instance
			this.$LayerIns.setVisible(id);
			//- update state snapshot
			this.UPDATE_BASELAYER_OPTIONS({
				id: id,
				payload: {
					visible: true,
				},
			});
		},
		handleBaseLayerOpacity(opacity) {
			console.log('baseMap opacity chaged : ', opacity);
			//- update map instance
			this.$LayerIns.setOpts(this.currentID, { opacity });
			//- update state snapshot
			this.UPDATE_BASELAYER_OPTIONS({
				id: this.currentID,
				payload: {
					opacity: opacity,
				},
			});
		},
	},
};
</script>

<style lang="scss" scoped>
$baseWidth: 4rem;

.currentName {
	text-align: center;
}
.button {
	background-color: #eeeef9;
	border-color: #bcbbe8;
	color: #5856c5;
	padding: 9px 15px;
	// border-radius: 20px;
	border: 1px solid #dcdfe6;
	text-align: center;
	box-sizing: border-box;
	outline: none;
	margin: 0;
	font-weight: 500;
	display: inline-block;
	line-height: 1;
	white-space: nowrap;
}

.baseMap {
	display: flex;
	flex-direction: column;
	height: 100%;

	&__current {
		margin: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		// border-top: 1px solid rgba(192, 196, 204, 0.5);
		border-bottom: 1px solid rgba(192, 196, 204, 0.5);
		padding-bottom: 0.5rem;

		&__image {
			flex: 0 0 $baseWidth;
			height: $baseWidth;
			border-radius: 100%;
		}
		&__slider {
			margin: 0 1rem;
			box-sizing: border-box;
			flex: 1 1 auto;
			display: flex;
			flex-direction: column;
		}
	}

	&__list {
		padding: 1rem;
		align-items: center;
		display: block;
		height: 100vh;
		overflow-y: auto;

		/deep/ {
			.el-radio-group {
				width: 100%;
				display: flex;
				flex-direction: column;
			}
			.el-radio {
				padding: 0.5rem 1rem;
				margin: 0.5rem 0 !important;
				height: auto;
				display: flex;
				align-items: center;
				&__label {
					flex: 1 1 auto;
					display: flex;
					align-items: center;
					justify-content: flex-start;
					img {
						border-radius: 100%;
						width: $baseWidth * 1.2;
						height: $baseWidth * 1.2;
						margin-right: 0.5rem;
					}
				}
			}
		}
	}
}
</style>
