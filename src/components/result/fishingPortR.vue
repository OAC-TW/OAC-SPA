<template lang="pug">
.fishingport-popup
	h3 {{ Name }}
	p {{ locStr }}
	div 區域: {{ regionStr || "--" }}
	div 種類: {{ kindStr || "--" }}
	div 漁會: {{ fishmenass || "--" }}
	div 主管機關: {{ adminorgan || "--" }}
</template>

<script>
export default {
	name: 'fishingPortR',
	props: [
		'Name', // 漁港名稱
		'kind', // 第X類漁港
		'county', // 縣市
		'township', // 鄉鎮
		'fishmenass', // 漁會
		'adminorgan', // 主管機關
		'xpos', // 經度
		'ypos', // 緯度
	],
	computed: {
		locStr() {
			return `經度 ${this.xpos} 緯度 ${this.ypos}`;
		},
		regionStr() {
			return `${this.county} ${this.township}`;
		},
		kindStr() {
			return `${this.kind}`;
		},
	},
	data: () => ({}),
	methods: {},
	mounted() {
		console.log('[fishingPortR]', this);
	},
};
</script>

<style lang="scss" scoped>
</style>
