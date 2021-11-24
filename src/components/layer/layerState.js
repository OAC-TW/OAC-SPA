export default {
	namespaced: true,
	state: {
		layer: [],
		baseLayer: [],
		pinnedLayer: [],
		// 已啟用的天氣圖層的包含的時間陣列
		activedWeatherLyr: {
			id: '',
			times: []
		},
		// 圖例
		legend: {
			label: "",
			colorScaleLabel: [],
			colorScaleValue: [],
		}
	},
	actions: {},
	mutations: {
		/**
		 * 快照狀態 圖層狀態
		 * @overload
		 * @param {object} payload 圖層屬性(複數) | 加入(unshift)
		 * @param {array} payload 圖層屬性(單數)| 覆蓋
		 */
		SNAPSHOT_RAW_LAYER: (state, { type, payload }) => {
			if (typeof payload !== 'object') {
				new TypeError('SNAPSHOT_RAW_LAYER(params) : params expected object|Array got ' + typeof payload)
				throw ('加入圖層失敗')
			}
			if (Array.isArray(payload)) {
				state[type] = payload
			} else {
				state[type].unshift(payload)
			}
		},
		/**
		 * 更新一般圖層屬性
		 * @param {string} id
		 * @param {object} payload 已定義的欲更新之圖層屬性
		 */
		UPDATE_LAYER_OPTIONS: (state, { id, payload }) => {
			try {
				let ptr = state['layer'].find(l => l.id === id)
				Object.keys(payload).forEach(k => {
					if (k === 'opacity') { //- 檢查透明度數值
						ptr[k] = payload[k] > 1 ? payload[k] / 100 : payload[k]
					} else {
						ptr[k] = payload[k]
					}
				})
			} catch (e) {
				throw new Error(e)
			}
		},
		/**
		 * 更新底圖圖層屬性
		 * @param {string} id
		 * @param {object} payload 已定義的欲更新之圖層屬性
		 */
		UPDATE_BASELAYER_OPTIONS: (state, { id, payload }) => {
			try {
				/** 底圖屬性的 更新 只作用在 "可見的圖層" */
				if (Object.keys(payload).indexOf('visible') > -1) {
					state['baseLayer'].forEach(bLyr => bLyr.visible = bLyr.id === id)
					delete payload['visible']
				}
				//- 找到當前 可見的底圖
				let ptr = state['baseLayer'].find(bLyr => bLyr.visible)
				Object.keys(payload).forEach(k => {
					if (k === 'opacity') { //- 檢查透明度數值
						ptr[k] = payload[k] > 1 ? payload[k] / 100 : payload[k]
					} else {
						ptr[k] = payload[k]
					}
				})
			} catch (e) {
				throw new Error(e)
			}
		},
		/** 紀錄啟用的氣象圖層資訊 */
		SET_ACTIVED_WEATHER_DATA: (state, { id, times = [], legend = {} }) => {

			// 時間資訊
			state.activedWeatherLyr.id = id
			const t = state.activedWeatherLyr.times || [];
			t.splice(0, t.length, ...times)

			// 圖例資訊
			const LL = state.legend.colorScaleLabel
			const LC = state.legend.colorScaleValue
			state.legend.colorScaleLabelName = legend.colorScaleLabelName;
			state.legend.type = legend.type

			state.legend.label = legend.label || ""
			const P_LL = legend.colorScaleLabel || []
			const P_LC = legend.colorScaleValue || []
			LL.splice(0, LL.length, ...P_LL)
			LC.splice(0, LC.length, ...P_LC)

		},
		SET_LAYER_PIN: (state, {id, pin}) => {
			const idx = state.pinnedLayer.indexOf(id)
			if (pin) {
				if (idx >= 0) return;
				state.pinnedLayer.push(id);
			} else {
				if (idx >= 0) state.pinnedLayer.splice(idx, 1);
			}
		},
	},
	getters: {
		/** 可排序的圖層 */
		sortableLayer: (state, getters, rootGetters) => {
			return state.layer.filter(l => {
				return l.sortable
			})
		},
		unsortableLayer: (state, getters, rootGetters) => {
			return state.layer.filter(l => {
				return !l.sortable
			})
		},
		visableLayer: (state, getters, rootGetters) => {
			return state.layer.filter(l => {
				return l.visible
			})
		},
		/** 預報 */
		weatherLayer: (state, getters, rootGetters) => {
			// const wl = state.layer.filter(l => {
			// 	const { value } = rootGetters.currentTag
			// 	return /heatmap|velocity|gradient|CCTV/ig.test(l.type) && (value ? (l.tag || []).indexOf(value) > -1 : true)
			// })
			const wl = state.layer.filter(l => {
				// return l?.catelog.find((c) => c.value == 'situation' || c.value == 'weather'); // TODO: no hardcoded
				return !!l.group; // TODO: no hardcoded
			});
			// mixin icon
			let defaultIcon = "cloud-sun-rain"
			return wl.map(({ title, ...args }) => {
				if (args.icon) return { title, ...args };
				return { title, ...args, icon: defaultIcon }
			})
		},
		/** 點狀 */
		pointerLayer: (state, getters, rootGetters) => {
			return state.layer.filter(l => {
				const { value } = rootGetters.currentTag
				return /cluster|mark/ig.test(l.type) && (value ? (l.tag || []).indexOf(value) > -1 : true)
			})
		},
		pinnedLayer: (state, getters, rootGetters) => {
			return state.pinnedLayer;
		},
	}
}
