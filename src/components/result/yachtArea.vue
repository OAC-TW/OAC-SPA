<template lang="pug">
.yachtarea-popup
	h3 {{ contentStr }}
</template>

<script>
export default {
	name: 'yachtArea',
	props: ['遊艇泊區名', '泊位數'],
	computed: {
		contentStr() {
			return `${this['遊艇泊區名']}，泊位數 ${this['泊位數']} 位`;
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
