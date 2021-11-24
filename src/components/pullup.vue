<template lang="pug">
    .pullup
        PullUpPanel.pullup__panel(
            :style="`bottom:${offsetBottom}px`"
            :reservedHeight='reservedHeightModel'
            :headerHeight="headerHeightModel"
            :height="caculatedHeight ||`${height}vh`"
            backgroundColor='#ffffff'
            ref="pullup"
        ) 
            .pullup__fixedFooter(:style="fixedFooterStyle")
                slot(name="fixedFooter")
            
            .pullup__wrapper(ref="content")
                slot(name="header")
                slot
</template>

<script>

/**
 * @input 回傳滑動卡片位置(結束位置) - 100: top / 0: bottom
 * @move 回傳滑動卡片位置(進行中) - 100: top / 0: bottom
 * @scrollEnd 內容滾動到底時觸發
 */

import PullUpPanel from 'vue-pull-up-panel'

export default {
    name:"pullup",
    components:{
        PullUpPanel
    },
    props:{
        value:{ // the pullup's location
            type:String,
            validator:val=> val==='bottom' || val==='top' || val==='close',
            default:'bottom'
        },
        reservedHeight:{ // When position was bottom
            type:Number,
            default:70
        },
        height:{
            type:Number,
            default:70
        },
        offsetBottom:{
            type:Number,
            default:0
        }
    },
    data:()=>({
        ptr:null, // 組件指標
        evtDomMain:null, // dom ptr
        evtDomBody:null, // dom ptr
        headerHeight: 18,  // 頁首高度
        caculatedHeight:""
    }),
    watch:{
        value:{
            handler(location){
                // 計算位置
                if(this.ptr){
                    if(/close|bottom/ig.test(location)){
                        this.toggleDown()
                    }else if(location){
                        this.toggleUp()
                    }
                    console.log("Pullup location is",location)
                }
            },
            immediate:true
        }
    },
    computed:{
        isClosed(){
            return this.value === "close"
        },
        reservedHeightModel(){ // 當關閉時 保留高度即為 0 
            return this.isClosed ? 0 : this.reservedHeight
        },
        headerHeightModel(){
            return this.isClosed ? 0 : this.headerHeight
        },
        // 1 is top , 0 is bottom
        degree(){
            let d = 0
            if(this.ptr){
                d = this.ptr.x/100
                this.$emit('move',d)
            }
            return d
        },
        // 跟隨在卡片上方之區塊 樣式計算
        fixedFooterStyle(){
            return {
                top: -this.headerHeightModel+"px",
                opacity: 1 - this.degree
            }
        },
    },
    methods:{
        toggleUp(){
            this.ptr.toggleUp()
            this.$emit('input','top')
        },
        toggleDown(){
            this.ptr.toggleDown()
            this.$emit('input',this.isClosed?'close':'bottom')
        },
        caculatePullupHeight(){
			/*setTimeout(()=>{
				// if(!this.$refs.pullup) return
				let hpx = this.$refs.pullup.$el.querySelector('.pullup__wrapper').clientHeight
				let hvh = Math.round(hpx * 100 / window.innerHeight)
				let mxh = this.height || 70;
				console.log(`caculatePullupHeight new height : ${hpx}px,${hvh}vh`)
				this.caculatedHeight = `${ hvh < mxh ? hvh : mxh }vh`
			},250)*/
		},
        handleTouchEnd(e){
            if(this.isClosed){
                return
            }

            let isClickHeaderBar = e.target.classList.contains('panel-handle')
            let loc = this.value

            loc = this.ptr.x >= 50 ? 'top' : 'bottom'
            if(isClickHeaderBar){
                if(this.ptr.x === 0) loc = 'top'
                if(this.ptr.x === 100) loc = 'bottom'
            }
            
            this.$emit('input',loc)
        },
        handleTouchMove(e){
            if(!this.isClosed){
                return
            }　
            this.ptr.moveTo(0,0,0) // 關閉時鎖住 panel
        },
        /** 捲動到底 */
        handlePanelScroll(e){
            if(this.evtDomBody.clientHeight + this.evtDomBody.scrollTop === this.evtDomBody.scrollHeight){
                this.$emit("scrollEnd")
            }
        },
    },
    mounted(){
        this.ptr = this.$refs.pullup
        this.evtDomMain = this.ptr.$refs.main 
        this.evtDomBody = this.ptr.$refs.body
        this.evtDomMain.addEventListener('touchend',this.handleTouchEnd)
        this.evtDomMain.addEventListener('touchmove',this.handleTouchMove)
        this.evtDomBody.addEventListener('scroll', this.handlePanelScroll)
    },
    beforeDestroy(){
        this.evtDomMain.removeEventListener('touchend',this.handleTouchEnd)
        this.evtDomMain.removeEventListener('touchmove',this.handleTouchMove)
        this.evtDomBody.removeEventListener('scroll',this.handlePanelScroll)
    }
}

</script>

<style lang="scss" scoped>

    .pullup{
        &__fixedFooter{
            position:absolute;
            transform:translateY(-100%);
            width: 100%;
            left: 0;
            right: 0;
            bottom: auto;
        }
        &__wrapper{
            padding: 1rem;
            color: $text;
        }
        
    }

    /deep/ {
        .panel-bg{
            background-color: $aux !important;
            color: $text !important;
        }
        .panel-handle{
            &:after {
                background-color: rgba($text,0.3) !important;
            }
        }
        .panel-body{
            transition: height ease 0.2s;
        }
    }

</style>
