<template lang="pug">
div.navbar(
	ref="nav",
	:style="{'background-color': backgroundColor, 'height': panelHeight}",
	:class="(isMobile && isExpand) ? 'is-expand' : ''",
)
	div.logo
		a(href="./")
			img(:style="{'max-width': logoSize}", src='@/assets/icon.png')
		hr

	transition(name='slide-down')
		div.menu(
			v-if='isExpand || !isMobile',
		)
			ul.dummy(ref='list')
				template(v-for='(it, idx) in links')
					li.item(
						:index='it.key'
						@click="handleSelect(it, it.key, idx)",
						@mouseenter="onMouseEnter",
						@focus="onMouseEnter",
						@blur="onMouseLeave",
						@mouseleave="onMouseLeave",
						:class="isSelect(it.key, idx)"
					)
						a.panelIcon.link(
							v-if='it.link',
							target="_blank"
							rel="noopener"
							:href='it.link'
						)
							img.iconImg(:src='it.img')
							span {{ it.title }}
						span.panelIcon(v-else)
								img.iconImg(:src='it.img')
								span {{ it.title }}

	template(v-if='isMobile')
		div.expand
			el-button.expandBtn(type='info', size='small', plain, @click='handleExpand')
				font-awesome-icon(
					:icon='isExpand ? ["fas", "angle-double-up"] : ["fas", "angle-double-down"]',
					fixed-width,
				)

</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'navbar',
	components: {
		// mapUI,
		// mapUIxs,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		backgroundColor: {
			type: String,
			default: '#F5F7FA', // custom.scss
		},
		hoverBackground: {
			type: String,
			default: '#a2a2a2', // custom.scss
		},
	},
	data: () => ({
		activeId: '',
		isExpand: false,

		// TODO: as props
		links: [
			{
				img: require('@/assets/kayak.svg'),
				key: 'relaxation',
				title: '海域遊憩',
			},
			{
				img: require('@/assets/warning.svg'),
				key: 'obstruct',
				title: '射擊礙航',
			},
			{
				img: require('@/assets/waves.svg'),
				key: 'weather',
				title: '海情海象',
			},
			{
				img: require('@/assets/law.svg'),
				key: 'law',
				title: '法令資訊',
				cate: 'law',
				// link: 'https://rocean.oac.gov.tw/oacmap/',
			},
			{
				img: require('@/assets/translate.png'),
				key: 'translate',
				title: '翻譯',
			},
		],
	}),
	watch: {
		openedPanel(newVal, oldVal) {
			// console.log(`[openedPanel] ${oldVal} -> ${newVal}`, this.$refs.list);
			this.activeId = newVal;
			if (newVal === '') {
				let ele = this.$refs.list?.querySelectorAll('.is-active');
				if (ele) ele.forEach((e) => e.classList.remove('is-active'));
			} else {
				// auto active
				this.$refs.list?.querySelector(`[index="${newVal}"]`)?.classList.add('is-active');
			}
		},
	},
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
		}),
		panelHeight() {
			return !this.isMobile || this.isExpand ? '100%' : '';
		},
		logoSize() {
			return '70px';
			if (!this.isMobile) {
				return `70px`;
			} else {
				return this.isExpand ? `90px` : `70px`;
			}
		},
	},
	methods: {
		...mapActions({
			closePanel: 'closePanel',
			openPanel: 'openPanel',
		}),
		...mapMutations({
			SET_NAV_WIDTH: 'SET_NAV_WIDTH',
			SET_CARD_VISIBLE: 'SET_CARD_VISIBLE',
			SET_LAYER_CARD_AUTO_SCROLL: 'SET_LAYER_CARD_AUTO_SCROLL',
			UPDATE_LAYER_OPTIONS: 'layer/UPDATE_LAYER_OPTIONS',
			SET_ACTIVED_WEATHER_DATA:"layer/SET_ACTIVED_WEATHER_DATA",
		}),
		onMouseEnter(e) {
			e.currentTarget.classList.add('is-hover');
		},
		onMouseLeave(e) {
			e.currentTarget.classList.remove('is-hover');
		},
		isSelect(key, idx) {
			return this.activeId == key ? 'is-active' : '';
		},
		handleSelect(item, key, idx) {
			console.log('[select]', this, item, key, idx);
			if (this.activeId == key) {
				this.handleClosePanel();
			} else {
				if (this.isMobile) {
					this.isExpand = false; // TODO: delay minimize? watch minimize event?
				}
				if (item.cate) {
					this.handleClosePanel();
					this.getLayerByCate(item.cate);
					this.openLayerPanel();
					return;
				}
				switch (key) {
					case 'law': // TODO: no hardcoded
						break;
					default:
						this.updateWidth();
						this.openPanel(key);
				}
			}
		},
		getLayerByCate(cate) {
			this.$LayerIns.normalLayerCollection.forEach(l => {
				let shouldVis = l.catelog.findIndex((c) => c.value == cate || c.value == 'force') >= 0;
				if (l.visible && !shouldVis) this.setLayerVisible(l.id, false);
				if (!l.visible && shouldVis) this.setLayerVisible(l.id, true);
			});
			console.log('getLayerByCate()', this, cate);
		},
		setLayerVisible(id, vis) {
				this.$LayerIns.setVisible(id, vis);
				if (!vis) this.SET_ACTIVED_WEATHER_DATA({ id:'', times:[] });
		},
		openLayerPanel() {
			this.SET_LAYER_CARD_AUTO_SCROLL(true);
			this.SET_CARD_VISIBLE({ key: "result", bool: false });
			this.SET_CARD_VISIBLE({ key: "baseMap", bool: false });
			this.SET_CARD_VISIBLE({ key: "layer", bool: true });
		},
		handleClosePanel() {
			this.closePanel();
			let ele = this.$refs.list.querySelectorAll('.is-active');
			if (ele) ele.forEach((e) => e.classList.remove('is-active'));
			console.log('[closePanel]', this, this.$refs.list, ele);
		},
		updateWidth() {
			console.log('[navbar]', this, this.$refs.nav, this.$refs.nav.offsetWidth);
			this.SET_NAV_WIDTH(this.$refs.nav.offsetWidth);
		},
		handleExpand(e) {
			console.log('[handleExpand]', this, e);
			this.isExpand = !this.isExpand;
		},
	},
	mounted() {
		this.activeId = this.openedPanel;
		this.$nextTick(() => {
			this.updateWidth();
		});
	},
	updated() {
		this.$nextTick(() => {
			this.updateWidth();
		});
	},
};
</script>

<style lang="scss" scoped>
.navbar {
	z-index: 16;
	position: absolute;
	max-height: 100%;
	display: flex;
	flex-direction: column;
}
.navbar.is-expand {
	z-index: 32;
}

.logo {
	text-align: center;
	margin: 0.3rem;
	height: 70px;
}

.menu {
	// height: calc(100% - 70px);
	// overflow: auto;
	height: 100vh;
	overflow-y: scroll;
}
.menu ul {
	border-right: unset;
	width: 90px;
	margin: 0 auto;
	list-style: none;
	padding-inline-start: 0;
	margin-block-start: 0.6rem;
}
.item {
	padding: 0 1rem;
	line-height: unset;
	// float: left;
	// width: 80px;
	height: 100%;
	text-align: center;
	margin-block-end: 0.5rem;
	cursor: pointer;
}
/deep/ .item.is-active {
	background-color: $primary;
	color: $white;
}
/deep/ .is-hover {
	background-color: $info;
}

.panelIcon {
	display: inline-block;
	vertical-align: unset;
	line-height: initial;
	user-select: none;
	width: 100%;
}
.iconImg {
	display: block;
	// max-width: 48px;
	max-width: 90%;
	margin: 0 auto;
}
a .iconImg {
	max-width: unset;
	width: 90%;
}

.expandBtn {
	width: 100%;
}

a.link {
	color: inherit;
	text-decoration: inherit;
}
</style>
