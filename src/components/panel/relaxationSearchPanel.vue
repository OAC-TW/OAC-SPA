<template lang="pug">
div
	//- view data
	div(v-if='viewPoint')
		pageHeader(
			:title='viewPoint.CName',
			@back='goBack',
			:useBack='true',
		)
			el-button(circle, @click='flyTo(viewPoint)')
				.flyToButton
					font-awesome-icon(icon='map-marker-alt', fixed-width, size='2x')
		sightseeingSpot(
			v-bind='viewPoint',
			@flyTo='flyTo(viewPoint)',
		)
			template(slot='header') {{ '' }}


	//- filter, v-show to keep state
	div.content(v-show='!viewPoint')
		//- keyword
		el-select.search(
			style='width:100%;',
			v-model='selectedKeywordModel',
			filterable,
			placeholder='景點關鍵字...',
			placement='bottom',
			popper-class='selectItems',
			clearable,
			remote,
			:remote-method='remoteSearch'
			:loading='loading'
			:loading-text='loadingText'
		)
			el-option(
				v-for='(i, idx) in results',
				:key='i.k || idx',
				:label='i.l',
				:value='i.v',
			)
			template(slot='prefix')
				el-button(
					style='position:absolute;',
					circle,
					type='primary',
				)
					font-awesome-icon(icon='search', fixed-width, size='lg')

		hr

		//- TODO: i18n
		div(v-if='!points.length')
			p.warningText 從事水域活動前，務必先詳細閱讀當地政府相關規定，並評估自身能力及注意安全。

		//- list point
		div(v-if='points.length')
			splitPages(
				:items='points',
				:isMobile='isMobile',
				:currentPage='currentPage',
				@pageChange="currentPage = $event; $emit('resetScrollTop')",
			)
				template(
					v-slot:default='v',
				)
					div.el-card.is-hover-shadow.item(
						:key='v.itemIdx',
					)
						div.el-card__header.itemHeader
							span {{ `${v.Zone} ${v.County} - ${v.CName}` }}
						div.el-card__body
							div.columns
								div.column
									p(v-if='v.CAdd') {{ v.CAdd }}
									p(v-if='v.Opentime') {{ v.Opentime }}
								div.column.columnBtn
									div.btns
										el-button(
											type='primary',
											@click='onClick(v)',
										)
											font-awesome-icon(:icon='["fas", "info"]', fixed-width)
											span 詳細
										el-button(
											type='warning',
											@click='flyTo(v)',
										)
											font-awesome-icon(:icon='["fas", "map-marked-alt"]', fixed-width)
											span 定位

</template>

<script>
import splitPages from '@/components/common/splitPages';
import pageHeader from '@/components/common/pageHeader';
import datePicker from '@/components/common/datePicker';

import sightseeingSpot from '@/components/result/sightseeingSpot';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'relaxationSearchPanel',
	components: {
		splitPages,
		pageHeader,
		datePicker,
		sightseeingSpot,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		Layer: {
			type: Object,
		},
	},
	data: () => {
		return {
			layerToFilt: null,
			all: [],

			// search
			currentKeyword: '',
			results: [],
			loading: false,
			loadingText: '搜尋中...',

			points: [], // for listview
			viewPoint: null, // for item detail
			highlight: null, // point which highlighted
			currentPage: 1,
		};
	},
	watch: {
		Layer(newVal, oldVal) {
			console.log(`[Layer] ${oldVal} -> ${newVal}`, this);
			this.updateCache();
		},
	},
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
			navWidth: 'navWidth',
		}),
		selectedKeywordModel: {
			get() {
				return this.currentKeyword;
			},
			set(v) {
				console.log('[selectedKeywordModel]set', this, v);
				this.currentKeyword = v;
				if (v.length) this.doSearch(v);
			},
		},
	},
	methods: {
		...mapActions({
			closePanel: 'closePanel',
		}),
		updateCache() {
			this.all = this.Layer.data.features.map((v, idx) => {
				return v.properties;
			});
		},
		onClick(item) {
			console.log('[click]', this, item);
			this.viewPoint = item;
			this.$emit('resetScrollTop');
		},
		goBack() {
			this.viewPoint = null;
			this.$emit('resetScrollTop');
		},
		clearHighlight() {
			if (!this.highlight) return;
			const icon0 = this.Layer.getIconVM()();
			this.highlight.setIcon(icon0);
		},
		flyTo(item) {
			console.log('[flyTo]', this, item);
			if (this.isMobile) this.closePanel();

			// clear old style
			this.clearHighlight();

			const icon = this.Layer.getIconVM()(true);
			const layerGroup = this.Layer.markerClusterGroup;
			const marker = layerGroup.getLayer(item.__leafletID);

			// set highlight style
			marker.setIcon(icon);

			// fly
			layerGroup.zoomToShowLayer(marker, () => {
				const LOffset = !this.isMobile ? this.navWidth : 0;
				const map = this.$InitIns.map;
				map.panTo(marker.getLatLng(), map.getZoom(), {
					animate: false,
					duration: 0.25,
					paddingTopLeft: [LOffset, 0], // fitBounds,flyToBounds [left, top]
				});
				layerGroup.zoomToShowLayer(marker);
			});

			// keep reference
			this.highlight = marker;
		},
		remoteSearch(query) {
			console.log('[remoteSearch]query', this, query);
			if (query !== '') {
				this.loading = true;
				this.doSearch(query);
				return;
			}
			this.results = [];
		},
		doSearch(query) {
			const limit = 50; // ms

			let queue = [];
			let all = this.all;
			let total = all.length;
			let filterFn = (start) => {
				let t0 = Date.now();
				let i = start;
				// let n = 0;
				for (; i < total; i++) {
					let now = Date.now();
					if (now - t0 > limit) break;
					// if (n++ > 2) break;

					let v = all[i];
					let name = v['CName'];
					// name.match(query)
					if (name.includes(query)) {
						queue.push(v);
					}
				}
				if (i == total) {
					console.log('[search]end', this, total, Date.now() - t0);
					let matchs = queue;
					this.results = matchs.map((v) => {
						// return { k: v['uuid'], l: v['CName'], v: v['CName'] };
						return { l: v['CName'], v: v['CName'] };
					});
					this.loading = false;
					this.points = matchs;
					this.currentKeyword = query;
					this.currentPage = 1; // reset page
					this.points.sort((a, b) => {
						const cmpA = `${a.Zone} ${a.County} ${a.CName}`;
						const cmpB = `${b.Zone} ${b.County} ${b.CName}`;
						return cmpA.localeCompare(cmpB, undefined, { numeric: true });
					});
					return;
				}
				console.log('[search]next queue', this, i, total, Date.now() - t0);
				setTimeout(() => {
					filterFn(i);
				}, 0);
			};
			filterFn(0);
		},
	},
	created() {
		this.updateCache();
	},
	mounted() {
		console.log('[relaxationSearchPanel]', this, this.isMobile);
	},
	deactivated() {
		console.log('[relaxationSearchPanel]deactivated()', this, this.isMobile);
		this.clearHighlight();
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
.warningText {
	text-align: center;
	color: #f00;
	font-weight: 500;
	font-size: 1.5rem;
}
.search {
	/deep/ {
		.el-input {
			&__prefix {
				left: 0;
			}
			&__inner {
				padding-left: 55px;
				border-radius: 999px;
			}
		}
	}
}

.el-card.item {
	background-color: #ffffff;
	margin-bottom: 0.5rem;
}
.itemHeader {
	// background:linear-gradient(to bottom, #006588 5%, #004568 100%);
	background-color: #006588;
	color: #ffffff;
}

.column {
	flex-basis: 0;
	flex-grow: 1;
	flex-shrink: 1;
}
.btns {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}
@media screen and (min-width: 769px) {
	.columns {
		display: flex;
	}
	.columnBtn {
		flex: none;
		width: 25%;
	}
	/deep/ {
		.btns .el-button {
			margin: 0.2rem auto;
		}
	}
}

.flyToButton {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	position: relative;
}

/deep/ {
	.el-card__body {
		padding: 0.5rem 1rem;
	}

	/* .el-input placeholder color change */
	.el-input__inner::placeholder{
		color: #4b49b7;
	}

	.table {
		display: flex;
		flex-wrap: wrap;
		line-height: 150%;
		margin: 0 0 1rem 0;
		width: 100%;
		.link {
			color: darken($primary, 20);
			font-weight: bold;
			justify-content: flex-start;
		}
		&__col {
			width: auto;
			flex: 1 0 100%;
			display: flex;
			align-items: flex-start;
			box-sizing: border-box;

			transition: all 0.2s ease;
			&:not(:nth-last-of-type(1)) {
				border-bottom: 1px dashed rgba($info, 0.7);
			}
			&:nth-of-type(odd) {
				background-color: rgba($info, 0.1);
			}
			&:hover {
				background-color: rgba($primary, 0.1);
			}

			&__title,
			&__content,
			&__content-file {
				padding: 0.8rem 1rem;
				text-align: left;
			}
			&__title {
				align-self: stretch;
				flex: 0 0 20%;
			}
			&__content {
				flex: 1 1 85%;
				background-color: transparent;
				display: flex;
				flex-direction: column;
				word-break: break-all;
				overflow: hidden;
			}
			&__content-file {
				a {
					margin: 0.5rem 0;
					color: rgba($primary, 1);
					display: flex;
					align-items: center;
				}
			}
		}
	}
}
</style>
