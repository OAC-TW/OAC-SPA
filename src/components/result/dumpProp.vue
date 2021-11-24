<template lang="pug">
.dump-popup
	p {{ contentStr }}
</template>

<script>
export default {
	name: 'dumpProp',
	props: ['data'],
	computed: {
		contentStr() {
			let dumpObj = {};
			const show = Object.keys(this.data).filter(v => !v.startsWith('_'));
			show.forEach(prop => dumpObj[prop] = this.data[prop]);
			return JSON.stringify(dumpObj, null, 4);
		},
	},
	data: () => ({}),
	methods: {},
	mounted() {
		//console.log('[yachtArea]', this)
	},
};
</script>

<style lang="scss" scoped>
</style>
