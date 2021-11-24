<template lang="pug">
.result-scroll
	//--------------
	//- head
	//--------------
	//- .result-scroll__head
	//-     slot(name="head")

	//- slot(name="head")
	//- el-button(
	//-     type="text" 
	//-     v-for="(k,index) in sortKeys" 
	//-     :key="index"
	//-     @click="handleSort(k)"
	//- ) 
	//-     span 
	//-         | {{ k.label }}
	//-         i(:class="isUpPowerStatus(k.key)?'arrow-up':'arrow-down'")

	//--------------
	//- body
	//--------------
	.result-scroll__body
		template(v-if='isEmpty')
			el-alert(
				center,
				type='info',
				:closable='false',
				:show-icon='true',
				key='emptyAlert',
				title='找不到符合條件的資料'
			)
		template(v-else)
			.result-scroll__body__list(
				v-for='(item, index) in dataModel',
				v-loading='item.loading',
				:key='`${index}${Date.now()}`'
			)
				//- @see https://vuejs.org/v2/api/#vm-scopedSlots
				//- 暴露 slot-scope 給父組件調用 此迭代後的單一案件資料
				slot(:singleCaseData='item', name='body')

	//--------------
	//- footer
	//- @see https://vuejs.org/v2/api/#vm-scopedSlots
	//--------------
	.result-scroll__footer
		slot(name='footer')
</template>

<script>
/**
 * emit @sort { key,power }
 *
 */

export default {
	name: 'resultScrollList',
	components: {},
	data: () => ({}),
	props: {
		data: {
			type: Array,
			required: true,
		},
	},
	computed: {
		dataModel() {
			return this.data;
		},
		isEmpty() {
			return this.dataModel.length === 0;
		},
	},
	methods: {
		// handleSort(k){
		//   //- upPowerList 紀錄已升冪排序的鍵
		//     let isUpPower = this.isUpPowerStatus(k.key)
		//     this.$emit('sort',{
		//         key:k.key,
		//         power:!isUpPower
		//     })
		//     if(isUpPower){
		//         this.upPowerList = this.upPowerList.filter(i=>i!==k.key)
		//     }else{
		//         this.upPowerList.push(k.key)
		//     }
		// },
		// isUpPowerStatus(key){
		//   return this.upPowerList.indexOf(key) !== -1
		// }
	},
	mounted() {},
	destroyed() {},
};
</script>

<style lang="scss" scoped>
.result-scroll {
	&__footer,
	&__head {
		margin: 1rem 0;
	}

	&__body {
		margin: 0 -1rem;
		&__list {
			&:nth-of-type(even) {
				background-color: rgba($info, 0.15);
			}
		}
	}
}
</style>
