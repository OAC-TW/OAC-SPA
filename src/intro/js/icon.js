// modify from: https://gist.github.com/sergey-shpak/dd44afd391b4b912da084f19ba6a971e
import { h } from 'hyperapp';

export default (props) => {
	const {
		src: {
			icon: [
				iconWidth,
				iconHeight,
				, ,
				iconPath,
			],
			iconName,
			prefix: iconPrefix,
		},
		name = iconName,
		className = 'svg-inline--fa fa-w-16 icon',
		viewBox = `0 0 ${iconWidth} ${iconHeight}`,
		prefix = iconPrefix,
		path = iconPath,
	} = props;

	return h('svg', {
		'xmlns': 'http://www.w3.org/2000/svg',
		'aria-hidden': 'true',
		'role': "img",
		'data-icon': name,
		'data-prefix': prefix,
		'class': className,
		'viewBox': viewBox,
	}, h('path', {
		fill: 'currentColor',
		d: path,
	}));
};
