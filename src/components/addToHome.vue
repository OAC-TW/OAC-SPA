<template lang="pug">
div
    p(style="text-align: center;")
        el-checkbox(
            slot="title" 
            style="color:#fff;" 
            v-model="neverShowAddToScreenModel"
        ) 不再顯示
    el-carousel(trigger="click" type="card" indicator-position="outside" arrow="never" :autoplay="false")
        el-carousel-item(v-for="(src,key) in guideStepModel" :key="key")
            img(:src="src" style="width:100%;")
            h3(style="text-align: center;") 步驟 {{key+1}}
</template>

<script>
import { mapGetters } from 'vuex'
export default {
    name:"addToHomeScreen",
    data:()=>({
        neverShowAddToScreen:localStorage.getItem("neverShowAddToScreen"),
		iosGuides:[
			require("@/assets/guide/guidi1.jpg"),
			require("@/assets/guide/guidi2.jpg"),
			require("@/assets/guide/guidi3.jpg"),
			require("@/assets/guide/guidi4.jpg")
		],
		androidGuides:[
			require("@/assets/guide/guida1.jpg"),
			require("@/assets/guide/guida2.jpg"),
			require("@/assets/guide/guida3.jpg"),
			require("@/assets/guide/guida4.jpg")
		]
    }),
    computed:{
		isAndroid(){
			return this.$store.getters.isAndroid
		},
		isIOS(){
			return this.$store.getters.isIOS
		},
		guideStepModel(){
			if(this.isAndroid){
				return this.androidGuides
			}else if(this.isIOS){
				return this.iosGuides
			}else{
				return [...this.androidGuides,...this.iosGuides]
			}
		},
		neverShowAddToScreenModel:{
			get(){
				if(typeof this.neverShowAddToScreen === "string"){
					this.neverShowAddToScreen = JSON.parse(this.neverShowAddToScreen)
				}
				console.log("[ neverShowAddToScreenModel get ]",this.neverShowAddToScreen)
				if(this.neverShowAddToScreen){
                    this.$parent.$emit("close")
				}
				return this.neverShowAddToScreen
			},
			set(v){ // v must boolean
				console.log("[ neverShowAddToScreenModel set ]",v)
				localStorage.setItem("neverShowAddToScreen",v)
				this.neverShowAddToScreen = v
			}
		}
    },
    mounted(){}
}
</script>