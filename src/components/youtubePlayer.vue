<template lang="pug">
//<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/yeoV-wBdoxQ?&autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

.player(ref='body', style='height: 100%')
	iframe(
		frameborder='0',
		allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
		allowfullscreen,
		ref='iframe',
		:src='getUrl',
		width='100%',
		:height='getHeight'
	)
</template>

<script>
const youtubePlayer = {
	name: 'youtubePlayer',
	components: {},
	data: () => ({
		loading: false,
	}),
	props: {
		data: Object,
		url: String,
	},
	computed: {
		getUrl() {
			let args = this.url.match(/v=([a-zA-Z0-9\-_]+)/);
			if (args && args.length == 2) {
				let VID = args[1];
				return `https://www.youtube-nocookie.com/embed/${VID}?&autoplay=1`;
			}
			return 'about:blank';
		},
		getWidth() {
			console.log('[youtubePlayer]getWidth()', this, this.$refs);
			return this.$el.clientWidth;
		},
		getHeight() {
			console.log('[youtubePlayer]getHeight()', this, this.$refs);
			return this.$el?.clientHeight;
		},
	},
	async created() {
		console.log('[youtubePlayer]created()', this);
	},
	mounted() {
		console.log(
			'[youtubePlayer]mounted()',
			this,
			this.$el.parentElement.clientHeight
		);
		this.onResize();
		window.addEventListener('resize', this.onResize);
	},
	methods: {
		onResize() {
			console.log(
				'[youtubePlayer]onResize()',
				this,
				this.$el.parentElement.clientHeight
			);
			this.$refs.iframe.style.height =
				this.$el.parentElement.clientHeight - 10 + 'px'; // why 10 px?
		},
	},
	beforeDestroy() {
		window.removeEventListener('resize', this.onResize);
	},
};

export default youtubePlayer;
</script>

<style lang="scss">
</style>

