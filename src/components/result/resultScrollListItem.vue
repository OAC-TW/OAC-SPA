<template lang="pug">
.result-item
	.result-item__row(@click='$emit("fetchDetail")')
		strong(style='width: 80%')
			slot(name='title')

		//----------------------------------------------------------------------------------
		//- button @click.stop="" => 避免 slot 內 event 往上傳遞 導致 .result-item__row 被觸發 
		//----------------------------------------------------------------------------------
		.result-item__row__button(@click.stop='')
			//- 定位
			el-button(
				plain,
				circle,
				size='mini',
				type='primary',
				title='繪製並定位',
				@click='$emit("locate")'
			)
				font-awesome-icon(icon='map-marker-alt', size='1x', fixed-width)
			//- 移除記錄
			el-button(
				plain,
				circle,
				size='mini',
				type='danger',
				title='移除記錄',
				@click='$emit("delete")'
			)
				font-awesome-icon(icon='times', size='1x', fixed-width)

			//- 其他
			slot(name='button')

	//- 細節
	slot(name='detail')
</template>

<script>
/**
 *
 * @locate 定位
 * @fetchDetail 取得 並 開啟細節
 */

import { marquee } from '@/directives/directives';

export default {
	name: 'resultScrollListItem',
	directives: {
		marquee,
	},
	data: () => ({}),
	computed: {},
	mounted() {},
	methods: {},
	props: {
		data: {
			type: Object, // 單一物件(父組件已迭代)
			required: true,
			validator: (data) => typeof data === 'object' && !Array.isArray(data),
		},
	},
};
</script>
<style lang="scss" scoped>
.result-item {
	display: flex;
	flex-direction: column;
	justify-content: center;
	box-sizing: border-box;
	transition: all 0.2s ease;

	&__row {
		//- reset button style
		background: transparent;
		border: 0;
		padding: 0.5rem 1rem;
		text-align: left;
		cursor: pointer;

		&:hover {
			background-color: rgba($primary, 0.2);
		}

		display: flex;
		justify-content: space-between;
		align-items: center;

		transition: all 0.2s ease;

		& > * {
			text-align: left;
		}

		&__title {
			line-height: 150%;
			flex: 1 1 55%;
			display: block;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		&__caption {
			flex: 1 1 35%;
			color: rgba($text, 0.9);
			display: block;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			@media screen and (max-width: 768px) {
				display: none;
			}
		}
		&__button {
			flex: 0 1 80px;
			// display: flex;
			display: block;
			align-items: center;
			justify-content: space-around;
			& > * {
				padding: 0 0.5rem;
			}
		}
	}

	&__footer {
		display: flex;
		align-items: center;
		justify-content: center;
	}
}
</style>
