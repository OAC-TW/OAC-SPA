export default {
    namespaced: true,
    state: {
        newAdd: [],
        history: {
            filelayer: [],
            facility: [],
            tourism: [],
            situation: [],
            law: []
        }
    },
    actions: {},
    mutations: {
        /** 保存結果到歷史紀錄，並紀錄單次查詢結果 */
        SET_RESULT: (state, qResult) => {

            if (!(Array.isArray(qResult))) {
                qResult = [qResult]
            }

            state.newAdd.splice(0, state.newAdd.length, ...qResult) // 清空全部並更新 NewAdd

            qResult.forEach(lyr => {
                lyr.layerCatelog.forEach(c => {
                    if (!state.history[c.value]) state.history = Object.defineProperty({...state.history}, c.value, { configurable: true, enumerable: true, writable: true, value: [] });
                    const ptr = state.history[c.value]
                    const exsist = ptr.find(r => !Object.keys(lyr.data).some(k => lyr.data[k] !== r.data[k]))
                    const fIndex = ptr.indexOf(exsist)
                    if (fIndex >= 0) { // 若已存在，移動舊的到頂端
                        ptr.splice(fIndex, 1)
                        ptr.unshift(exsist)
                    } else {
                        ptr.unshift(lyr) // 新的到頂端
                    }
                })
            })

        },
        /** 刪除歷史紀錄 @overload */
        DELETE_RESULT: (state, dataId) => {
            const ptr = state.history
            Object.keys(ptr).forEach(k => {
                if (!dataId) {
                    ptr[k].splice(0, ptr[k].length)
                } else {
                    const target = ptr[k].find(i => i.dataId === dataId)
                    const index = ptr[k].indexOf(target)
                    if (index >= 0) {
                        ptr[k].splice(index, 1)
                    }
                }
            })
        },
        /** 清除新加入的 */
        INIT_NEWADD: state => state.newAdd.splice(0, state.newAdd.length)
    },
    getters: {
        state: state => k => k ? state[k] : state,
        newAdd: state => state.newAdd,
        history: state => k => k ? state.history[k] : state.history,
        /** 取得有資料的分類中的分類 作為 頁籤 */
        tabsNames: (state, getter) => {
            let temp = [{
                id: 'all',
                title: "全部",
                num: getter.resultCount
            }]

            const ptr = state.history
            const keys = Object.keys(ptr).filter(k => ptr[k].length)
            keys.forEach(k => {
                ptr[k].forEach(i => i.layerCatelog.forEach(c => {
                    if (!(temp.find(t => t.id === c.value))) {
                        temp.push({
                            id: c.value,
                            title: c.label
                        })
                    }
                }))
            })

            return temp
        },
        resultCount: state => {
            let data = []
            Object.values(state.history).forEach(arr => {
                arr.forEach(i => {
                    if (!data.some(ei => ei.dataId === i.dataId)) {
                        data.push(i)
                    }
                })
            })
            return data.length
        }
    }
}