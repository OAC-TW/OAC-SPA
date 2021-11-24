<template lang="pug">
.sightseeingspot-popup
	h3 {{ Name }}
	small {{ locStr }}
	img(v-if='img', style='max-width: 200px', :src='img', :alt='Name')
	p {{ Toldescribe }}
</template>

<script>
export default {
	name: 'sightseeingSpot',
	props: [
		'Name',
		'Toldescribe',
		'Picture1',
		'Picture2',
		'Picture3',
		'Px',
		'Py',
		'Region',
		'Town',
		'Tag',
	],
	computed: {
		img() {
			return this.Picture1 || this.Picture2 || this.Picture3 || '';
		},
		locStr() {
			return `經度 ${this.Px} 緯度 ${this.Py}`;
		},
	},
	data: () => ({}),
	methods: {},
	mounted() {
		console.log('[sightseeingSpot]', this);
	},
};
</script>

<style lang="scss" scoped>
</style>
