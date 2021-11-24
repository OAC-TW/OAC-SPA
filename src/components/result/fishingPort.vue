<template lang="pug">
.fishingport-popup
	h3 {{ contentStr }}
</template>

<script>
export default {
	name: 'fishingPort',
	props: ['漁港名稱'],
	computed: {
		contentStr() {
			return `${this['漁港名稱']}`;
		},
	},
	data: () => ({}),
	methods: {},
	mounted() {
		//console.log('[fishingPort]', this)
	},
};
</script>

<style lang="scss" scoped>
</style>
