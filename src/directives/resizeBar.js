let resizeBar = null
let defalutWidth = 0

export default {
	createElm(el, side) {
		resizeBar = document.createElement("div")
		let cssText = `
			width: 0.8rem;
			height: 100%;
			position: fixed;
			top: 0;
			bottom: auto;
			cursor: ew-resize;
			background-color: #f7f7f7;
			z-index: 99;
			display:flex;
			justify-content: center;
			align-items:center;
		`
		switch (side) {
			case 'r2l':
				cssText += `
					right: ${el.offsetWidth}px;
					left: auto;
					border-top-left-radius: 0.7rem;
					border-bottom-left-radius: 0.7rem;
				`;
				el.style.willChange = 'width,right' //- improve performance
				break;
			default:
				cssText += `
					right: auto;
					left: ${el.offsetWidth + el.offsetLeft}px;
					border-top-right-radius: 0.7rem;
					border-bottom-right-radius: 0.7rem;
				`;
				el.style.willChange = 'width,left' //- improve performance
		}
		resizeBar.style.cssText = cssText;

		resizeBar.innerHTML = `
			<hr style="height:2rem;color:#000;">
			<hr style="height:2rem;color:#000;">
		`


		let start = false
		let max = window.innerWidth * 0.9
		let min = defalutWidth
		resizeBar.onmousedown = evt => {
			start = true
		}
		window.onmousemove = evt => {
			el.style.transition = "none"
			if (!start) return;
			switch (side) {
				case 'r2l':
					let w = el.offsetLeft + el.offsetWidth - evt.clientX;
					if (w >= min && w <= max) {
						el.style.width = w + "px";
						resizeBar.style.right = w + "px";
					}
					break;
				default:
					if (evt.clientX <= max && evt.clientX >= min) {
						el.style.width = evt.clientX - el.offsetLeft + "px"
						resizeBar.style.left = evt.clientX + "px"
					}
			}
		}
		resizeBar.onmouseup = evt => {
			start = false
			el.style.transition = ''
		}
		window.onmouseup = evt => {
			start = false
			el.style.transition = ''
		}
		el.appendChild(resizeBar)
	},
	componentUpdated(el, binding, vnode) {
		if (!binding.value) {
			el.style.width = defalutWidth + "px" //- restore default width
			el.contains(resizeBar) && el.removeChild(resizeBar) //- clear resizeBar
			return
		}

		if (!el.contains(resizeBar)) binding.def.createElm(el)
	},
	inserted(el, binding, vnode) {

		defalutWidth = el.clientWidth //- save default width when inserted()

		if (!binding.value) {
			return
		}

		if (!el.contains(resizeBar)) binding.def.createElm(el, binding.value)

	}
}