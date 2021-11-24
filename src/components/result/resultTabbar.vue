<template lang="pug">
.tab
    .tab__prepend(v-if="$slots.prepend")
        slot(name="prepend")
    el-tabs.tab__main(
        v-if="tabVisibility"
        :value="value||tabsNames[0].title"
        @input="$emit('input',$event)"
        :closable="false"
    )
        el-tab-pane(
            v-for="(tab,index) in tabsNames"
            :key="tab.title"
            :name="tab.title"
        )
            div(slot="label" style="position: relative;") 
                span {{tab.title}}

</template>

<script>

export default {
    name:'resultTabbar',
    components:{
    },
    props:{
        tabsNames:{
            type:Array,
            validator:(tabsNames)=>{
                let checkek = true
                checkek = Array.isArray(tabsNames)
                checkek = checkek && tabsNames.every(i=>'id' in i && 'title' in i)
                return checkek
            }
        },
        value:{ // title
            type:String,
            default:""
        },
        tabVisibility:{
            type:Boolean,
            default:true
        }
    }
}
</script>

<style scoped lang="scss">

    /deep/ {
        .is-active{
            font-weight: bolder;
            font-size: 1.5rem;
        }
        .el-tabs__item{
            color:$text;
        }
    }

    .tab{
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        &__prepend{
            flex: 1 1 50px;
        }
        &__main {
            min-width: 50px;
            flex: 1 1 100%;
        }
    }

</style>