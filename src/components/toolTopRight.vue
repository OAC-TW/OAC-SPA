<template lang="pug">
div
	a.strong(
		href='./',
		style='margin-bottom: 1rem; display: block; font-size: 1.2rem; white-space: nowrap; color: rgb(255 255 255); text-shadow: rgb(0 0 0) 1px 1px 1px; text-decoration: none'
	) 海域遊憩活動一站式資訊平臺

	transition-group.tool(name='slide-fade-up', tag='div')
		el-button(
			:title='activedLyr ? activedLyr.title : "海情海象資訊"',
			:type='activedLyr ? "primary" : ""',
			key='海情/海象資訊',
			@click='openDrawer("海情/海象資訊")',
			circle
		)
			.tool__btn
				strong.tool__label.tool__label--actived(v-if='activedLyr') {{ activedLyr.title }}
				strong.tool__label(v-else) 海情海象資訊
				font-awesome-icon(
					:icon='activedLyr ? activedLyr.icon : "bars"',
					fixed-width,
					size='2x'
				)

		template(v-if='!isMobile || collapse')
			el-button(
				@click='openDrawer("礙航/射擊通報")',
				key='礙航/射擊通報',
				title='礙航/射擊通報',
				circle
			)
				.tool__btn
					strong.tool__label 礙航/射擊通報
					font-awesome-icon(icon='exclamation-triangle', fixed-width, size='2x')
					//- minus-circle exclamation-circle times-circle

			el-button(@click='openDrawer("相關連結")', key='相關連結', title='相關連結', circle)
				.tool__btn
					strong.tool__label 相關連結
					font-awesome-icon(icon='link', fixed-width, size='2x')

			el-button(@click='openDrawer("活動佈告欄")', key='活動佈告欄', title='活動佈告欄', circle)
				.tool__btn
					strong.tool__label 活動佈告欄
					font-awesome-icon(icon='bullhorn', fixed-width, size='2x')

			el-button(@click='openDrawer("活動申請")', key='活動申請', title='活動申請', circle)
				.tool__btn
					strong.tool__label 活動申請
					font-awesome-icon(icon='concierge-bell', fixed-width, size='2x')

			el-button(@click='openDrawer("使用條約")', key='使用條約', title='使用條約', circle)
				.tool__btn
					strong.tool__label 使用條約
					font-awesome-icon(icon='info', fixed-width, size='2x')

			el-button(
				v-if='isAndroid || isIOS',
				@click='openAddToHomeScreen',
				key='安裝說明',
				title='安裝說明',
				circle
			)
				.tool__btn
					strong.tool__label 安裝說明
					font-awesome-icon(icon='mobile-alt', fixed-width, size='2x')

			a.link.el-button.el-button--default.is-circle(
				key='意見回饋',
				title='意見回饋',
				href='https://docs.google.com/forms/d/e/1FAIpQLScf7at41snW4-ZczKN3p2hR8M9VKj_Af82BWEsZg6uPfwnY3Q/viewform',
				target='_blank',
				rel='noopener'
			)
				.tool__btn
					strong.tool__label 意見回饋
					font-awesome-icon(icon='envelope', fixed-width, size='2x')

			a.link.el-button.el-button--default.is-circle(
				key='使用說明',
				title='使用說明',
				href='./res/109_12_一站式_使用說明_V1.1.pdf',
				target='_blank',
				rel='noopener'
			)
				.tool__btn
					strong.tool__label 使用說明
					font-awesome-icon(:icon='["fab", "readme"]', fixed-width, size='2x')

		el-button(
			v-if='isMobile',
			@click='collapse = !collapse',
			style='color: #fff',
			key='collapse',
			type='text'
		)
			font-awesome-icon(
				:icon='collapse ? "chevron-up" : "chevron-down"',
				fixed-width,
				size='2x'
			)
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import addToHome from '@/components/addToHome';

import info from '@/components/info';
import layerWeatherDetail from '@/components/layer/layerWeatherDetail';
import hinderPanel from '@/components/panel/hinderPanel';

export default {
	name: 'toolTopRight',
	data: () => ({
		collapse: false,
	}),
	props: {
		openTitle: {
			type: String,
		},
	},
	watch: {
		openTitle: function (newVal, oldVal) {
			//console.log('[openTitle]changed: ', newVal, ' | was: ', oldVal, this.openTitle)
			if (newVal && newVal !== '') {
				this.openDrawer(newVal, true);
			}
		},
	},
	components: {},
	computed: {
		...mapGetters(['isAndroid', 'isIOS', 'isMobile']),
		...mapGetters({
			weatherLayer: 'layer/weatherLayer',
		}),
		activedLyr() {
			const { id } = this.$store.state.layer.activedWeatherLyr;
			return this.weatherLayer.find((l) => l.id === id);
		},
	},
	mounted() {
		if (this.isMobile) this.openAddToHomeScreen();
		if (this.openTitle) this.openDrawer(this.openTitle, true);
	},
	methods: {
		openAddToHomeScreen() {
			localStorage.setItem('neverShowAddToScreen', false);
			const dialog = this.$dialog({
				style: { maxWidth: '500px' },
				props: {
					['close-on-click-modal']: false,
					title: '加至主畫面說明',
				},
			});
			dialog.open({ ...addToHome, store: this.$store });
		},
		async openDrawer(title, autoExpand) {
			let props = {};
			switch (title) {
				case '礙航/射擊通報':
					props = {
						modal: false,
						size: this.isMobile ? '100%' : '40vw',
					};
					break;
				default:
					props = {
						modal: false,
						size: this.isMobile ? '100%' : '400px',
					};
			}
			const drawerIns = this.$drawer({
				props: Object.assign(props, {
					title,
				}),
				on: {
					close: () => {
						console.log('drawer close');
					},
				},
			});
			if (title === '海情/海象資訊') {
				drawerIns.open({ ...layerWeatherDetail, store: this.$store });
			} else if (title === '礙航/射擊通報') {
				// TODO: no hardcoded
				const rawData = [
					...(await (
						await fetch(
							'./hinder-test/6c28f8cba7c7122045c79df035820ed9_export.json'
						)
					).json()),
					...(await (
						await fetch(
							'./hinder-test/7bba239a72f586d7456b0a80a1dfa204_export.json'
						)
					).json()),
					...(await (
						await fetch(
							'./hinder-test/36bc13641c1e47f5d93529c754b8e2df_export.json'
						)
					).json()),
					...(await (
						await fetch(
							'./hinder-test/fd43399d27c7c6ae7d33ce8f4d7e403e_export.json'
						)
					).json()),
				];
				drawerIns.open(
					{ ...hinderPanel, store: this.$store },
					{
						props: {
							data: rawData,
							drawLayerID: 'a3fdd57a-950b-4f54-b145-82e43296a155',
							autoExpand: autoExpand,
						},
					}
				);
			} else {
				drawerIns.open(
					{ ...info, store: this.$store },
					{
						props: {
							value: title,
						},
					}
				);
			}
		},
	},
};
</script>

<style lang="scss" scoped >
@mixin activeStyle {
	color: #fff;
	background: $primary;
	text-shadow: none;
	transition: 0.2s ease all;
	max-width: 200px;
}

.tool {
	background: rgba(0, 0, 0, 0.5);
	border-radius: 2rem;
	position: absolute;
	right: 0;
	left: auto;

	display: flex;
	flex-direction: column;
	width: 1.5rem;
	align-items: center;
	justify-content: center;

	& > * {
		padding: 0.5rem !important;
		margin: 0 !important;
		&:not(:nth-last-child(1)) {
			box-shadow: 0 0 6px 3px rgba(0, 0, 0, 0.2);
			margin-bottom: 0.5rem !important;
		}
	}
	&__btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		&:hover {
			.tool__label {
				@include activeStyle;
				visibility: visible;
			}
		}
		&--unfocus {
			opacity: 0.7;
			.tool__label {
				visibility: hidden;
			}
		}
	}

	&__label {
		color: darken($info, 30);
		background: lighten($info, 20);
		position: absolute;
		right: 170%;
		padding: 0.25rem 0.5rem;
		border-radius: 1rem;
		box-shadow: 0 0 6px 3px rgba(0, 0, 0, 0.2);
		font-size: 1.3rem;
		&--actived {
			@include activeStyle;
		}
	}
}
</style>
