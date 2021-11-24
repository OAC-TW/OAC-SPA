<template lang="pug">
.tools
	//- 搜尋
	//- el-button(circle, type='primary', @click='openSearch')
	//- 	.tools__button
	//- 		font-awesome-icon(icon='search', fixed-width, size='2x')

	//- 複合搜尋(觀光景點篩選)
	//- el-button(circle, type='primary', @click='openFilter')
	//- 	.tools__button
	//- 		font-awesome-icon(icon='filter', fixed-width, size='2x')

	//- 底圖
	el-button(circle, @click='openBaseMap')
		.tools__button
			font-awesome-icon(icon='map', fixed-width, size='2x')

	//- 圖層
	el-button(
		circle,
		@click='SET_CARD_VISIBLE({ key: "layer", bool: !layerVisibility })'
	)
		.tools__button
			font-awesome-icon(icon='layer-group', fixed-width, size='2x')
	//- 搜尋結果
	el-button(
		circle,
		:disabled='!resultCount',
		@click='SET_CARD_VISIBLE({ key: "result", bool: true })'
	)
		.tools__button
			.tools__resultNum(:class='{ "tools__resultNum--active": resultCount }') {{ resultCount }}
			font-awesome-icon(icon='info', fixed-width, size='2x')
	//- 當前位置
	el-button(circle, @click='locateCurrent()')
		.tools__button
			font-awesome-icon(icon='map-marker-alt', fixed-width, size='2x')
</template> 

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import searchAndFilterLayer from '@/components/searchAndFilterLayer';
import compoundFilter from '@/components/compoundFilter';

export default {
	name: 'tools',
	props: {},
	data: () => ({}),
	computed: {
		...mapGetters({
			resultCount: 'result/resultCount',
		}),
		isMobile() {
			return this.$store.getters.isMobile;
		},
		currentTag() {
			return this.$store.state.currentTag.label;
		},
		layerVisibility() {
			return this.$store.state.layerCardVisible;
		},
		baseMapVisibility() {
			return this.$store.state.baseMapCardVisible;
		},
	},
	methods: {
		...mapMutations(['SET_CARD_VISIBLE', 'SET_CURRENT_TAG']),
		async locateCurrent() {
			try {
				await this.$InitIns.toCurrentLocation();
			} catch (e) {
				this.$alert('目前無法定位到當前位置，請檢查GPS狀態', {
					type: 'error',
				});
			}
		},
		openSearch() {
			const dialog = this.$dialog({
				style: { maxWidth: '500px' },
				props: {
					closeOnClickModal: true,
					showClose: false,
					title: '搜尋',
				},
			});
			dialog.open(
				{
					...searchAndFilterLayer,
					store: this.$store,
				},
				{
					on: {
						close: () => {
							dialog.close();
						},
					},
				}
			);
		},
		openFilter() {
			const dialog = this.$dialog({
				style: { maxWidth: '500px' },
				props: {
					//['close-on-click-modal']:false,
					//['show-close']:false,
					closeOnClickModal: true,
					showClose: false,
					title: '遊憩景點篩選',
				},
			});
			dialog.open(
				{
					...compoundFilter,
					store: this.$store,
				},
				{
					on: {
						close: () => {
							console.log('[tools.dialog]close()', dialog, this);
							dialog.close();
						},
					},
				}
			);
		},
		openBaseMap() {
			console.log('[openBaseMap]', this);
			this.SET_CARD_VISIBLE({ key: "baseMap", bool: !this.baseMapVisibility })
		},
	},
};
</script>

<style lang="scss" scoped>
.tools {
	position: absolute;

	display: flex;
	flex-direction: column;
	align-items: flex-start;

	& > * {
		margin: 0 0 1rem 0 !important;
		box-shadow: 0 0 6px 3px rgba(0, 0, 0, 0.2);
	}

	&__button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		position: relative;
	}
	&__resultNum {
		position: absolute;
		top: -100%;
		right: 100%;
		left: auto;
		bottom: auto;

		background-color: darken($info, 10);
		color: #fff;
		width: 2rem;
		height: 2rem;

		border-radius: 100%;
		padding: 0.1rem;
		font-size: 1.5rem;

		display: flex;
		align-items: center;
		justify-content: center;
		&--active {
			background-color: darken($danger, 10);
			color: #fff;
		}
	}
}
</style>
