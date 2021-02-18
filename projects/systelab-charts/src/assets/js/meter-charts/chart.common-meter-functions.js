export const ChartMeterData = class {

	constructor(dataArray, chartMeterOptions) {
		this.textBackgroundColor = getTextBackgroundColor(chartMeterOptions.levels, dataArray[dataArray.length - 1]);
		this.visualMinValue = chartMeterOptions.minVisualValue;
		this.visualMaxValue = chartMeterOptions.maxVisualValue;
		this.levelMinValue = Math.min(...chartMeterOptions.levels.map(value => value.minValue));
		this.levelMaxValue = Math.max(...chartMeterOptions.levels.map(value => value.maxValue));
		this.dataValue = dataArray[dataArray.length - 1];

		this.minValue = this.visualMinValue != null ? Math.min(this.visualMinValue, this.levelMinValue) : this.levelMinValue;
		this.maxValue = this.visualMaxValue != null ? Math.max(this.visualMaxValue, this.levelMaxValue) : this.levelMaxValue;

		if (this.dataValue === 0) {
			if (this.dataValue <= this.minValue) {
				this.minValue = -0.5;
			}
			if (this.dataValue >= this.maxValue) {
				this.maxValue = 0.5;
			}
		} else {
			while (this.dataValue <= this.minValue) {
				this.minValue -= Math.abs(this.dataValue * 0.8);
			}
			while (this.dataValue >= this.maxValue) {
				this.maxValue += Math.abs(this.dataValue * 0.8);
			}
		}

		if (chartMeterOptions.unitFormat && chartMeterOptions.unitFormat.lastIndexOf('.') > 0) {
			this.fractionDigits = chartMeterOptions.unitFormat.substr(chartMeterOptions.unitFormat.indexOf('.') + 1).length;
		} else {
			this.fractionDigits = (this.maxValue - this.minValue) <= 20 ? 1 : 0;
		}
		this.text = dataArray.length > 0 ? dataArray[dataArray.length - 1].toFixed(this.fractionDigits) : '--';
		this.textIncrement = Math.abs((this.maxValue - this.minValue)) / 61;
	}

};

export const getRegionYPos = (yAxisLabelItem, level) => {

	const label = yAxisLabelItem.filter(value => Number(value.label) === level);

	if (label.length > 0) {
		return label[0].y;
	} else {
		const lowerLimit = yAxisLabelItem.filter(value => Number(value.label) < level)[0];
		const higherLimit = yAxisLabelItem.filter(value => Number(value.label) > level)
			.slice(-1)[0];

		if (!lowerLimit) {
			return yAxisLabelItem.slice(-1)[0].y;
		}
		if (!higherLimit) {
			return yAxisLabelItem[0].y;
		}
		return range(Number(higherLimit.label), Number(lowerLimit.label), higherLimit.y, lowerLimit.y, Number(level));
	}
};
export const drawRegionsPlugin = {
	beforeDatasetsDraw(chartInstance) {
		if (chartInstance.options.chartMeterOptions) {
			if (chartInstance.options.chartMeterOptions.showHistory) {
				const yAxisLabelItems = chartInstance.boxes.filter(value => value.id === 'y-axis-0')[0]._labelItems;
				chartInstance.options.chartMeterOptions.levels.forEach(level => {
					const minLevelY = getRegionYPos(yAxisLabelItems, level.minValue);
					const maxLevelY = getRegionYPos(yAxisLabelItems, level.maxValue);
					const context = chartInstance.ctx;
					let heightToPrint = minLevelY - maxLevelY;
					let yPos = minLevelY - heightToPrint;
					if (minLevelY - heightToPrint < chartInstance.chartArea.top) {
						yPos = chartInstance.chartArea.top;
						heightToPrint = minLevelY - chartInstance.chartArea.top;
					}
					context.beginPath();
					context.fillStyle = getLevelColor(level.levelColor);
					context.fillRect(chartInstance.chartArea.left + 1, yPos, chartInstance.chartArea.right - 30, heightToPrint);
					context.closePath();
				});
			}
		}
	}
};
export const hideGoalsAndTooltips = (chartInstance) => {
	if (chartInstance.options.chartMeterOptions) {
		if (chartInstance.options.chartMeterOptions.showHistory) {
			chartInstance.chart.data.datasets[0].hidden = chartInstance.chart.data.datasets.length <= 1;
		} else {
			chartInstance.options.tooltips.enabled = false;
			chartInstance.chart.data.datasets[0].hidden = chartInstance.chart.data.datasets.length > 1;
		}
	}
};

export const drawTextPanel = (context, text, backgroundColor, xPos, yPos, rectWidth, rectHeight, textColor, frameColor) => {
	const originalFont = context.font;
	context.font = getFontSized(54, rectHeight, 'digital-font');
	context.lineJoin = "round";
	const textWidth = text ? context.measureText(text).width + 20 : 0;
	rectWidth = Math.max(rectWidth, getFrameSize(context.canvas.width), textWidth);
	let frameColorHeight = 0;
	if (frameColor) {
		frameColorHeight = 4;
		// Set rectangle and corner values
		context.fillStyle = backgroundColor;
		context.lineWidth = 12;

		// Change origin and dimensions to match true size (a stroke makes the shape a bit larger)
		context.beginPath();
		context.strokeStyle = frameColor;
		context.strokeRect(xPos, yPos, rectWidth, rectHeight);
		context.closePath();
	}

	context.beginPath();
	context.lineWidth = 3;
	context.fillStyle = backgroundColor;
	context.fillRect(xPos + 4, yPos + frameColorHeight, rectWidth - 8, rectHeight - frameColorHeight * 2);
	context.strokeStyle = 'darkgray';
	context.strokeRect(xPos + 4, yPos + frameColorHeight, rectWidth - 8, rectHeight - frameColorHeight * 2);
	context.closePath();
	if (text) {
		context.fillStyle = textColor;
		let actualBoundingBoxAscent = context.measureText(text).actualBoundingBoxAscent / 5;
		if (Number.isNaN(actualBoundingBoxAscent)) {
			actualBoundingBoxAscent = rectHeight * 4.2 / 30;
		}
		context.fillText(text, (xPos + rectWidth) - context.measureText(text).width - 10, yPos + rectHeight - actualBoundingBoxAscent);
	}
	context.font = originalFont;
};

export const getFrameSize = (canvasWidth) => {
	const baseWidth = 936;                   // selected default width for canvas
	const baseFrameSize = 15;                     // default size for font

	const ratio = baseFrameSize / baseWidth;   // calc ratio
	return canvasWidth * ratio;   // get font size based on current width
};

export const getFontSized = (defaultFontSize, availableHeight, fontFamily) => {
	const fontBase = 60;                   // selected default available height

	const ratio = defaultFontSize / fontBase;   // calc ratio
	const size = availableHeight * ratio;   // get font size based on current width
	return size.toFixed(0) + 'px ' + fontFamily; // set font
};

export const getRadius = (radius) => {
	return 0.22 * radius;
};

export const applyFractionDigits = (number, fractionDigits) => {
	return Number(number)
		.toFixed(fractionDigits);
}

export const getTextBackgroundColor = (levels, currentValue) => {

	const level = levels.filter(value => value.minValue <= currentValue && currentValue <= value.maxValue);

	if (level.length > 0) {
		if (level[0].levelColor.toLowerCase()
			.startsWith('rgba')) {
			return RGBAToHexA(level[0].levelColor, false);
		}
		return level[0].levelColor;
	}
	return '#95D9FF';
};

export const getLevelColor = (levelColor) => {
	if (levelColor.toLowerCase()
		.startsWith('#')) {
		return hexAToRGBA(levelColor, 0.25)
	} else if (levelColor.toLowerCase()
		.startsWith('rgb(')) {
		return levelColor.replace('rgb(', 'rgba(')
			.replace(')', ', 0.25)');
	}
	return levelColor;
}

export const RGBAToHexA = (rgba, includeAlpha) => {
	let sep = rgba.indexOf(',') > -1 ? ',' : ' ';
	rgba = rgba.substr(5)
		.split(')')[0].split(sep);

	// Strip the slash if using space-separated syntax
	if (rgba.indexOf('/') > -1)
		rgba.splice(3, 1);

	for (let R in rgba) {
		let r = rgba[R];
		if (r.indexOf('%') > -1) {
			let p = r.substr(0, r.length - 1) / 100;

			if (R < 3) {
				rgba[R] = Math.round(p * 255);
			} else {
				rgba[R] = p;
			}
		}
	}

	let r = (+rgba[0]).toString(16),
		g = (+rgba[1]).toString(16),
		b = (+rgba[2]).toString(16),
		a = Math.round(+rgba[3] * 255)
			.toString(16);

	if (r.length === 1)
		r = '0' + r;
	if (g.length === 1)
		g = '0' + g;
	if (b.length === 1)
		b = '0' + b;
	if (a.length === 1)
		a = '0' + a;

	return '#' + r + g + b + (includeAlpha ? a : '');
}

export const hexAToRGBA = (h, alpha) => {
	let r = 0, g = 0, b = 0, a = 0;

	if (h.length === 4) {
		r = '0x' + h[1] + h[1];
		g = '0x' + h[2] + h[2];
		b = '0x' + h[3] + h[3];
		a = alpha != null ? alpha : '1.0';
	} else if (h.length === 5) {
		r = '0x' + h[1] + h[1];
		g = '0x' + h[2] + h[2];
		b = '0x' + h[3] + h[3];
		a = '0x' + h[4] + h[4];
		a = +(a / 255).toFixed(3);
	} else if (h.length === 7) {
		r = '0x' + h[1] + h[2];
		g = '0x' + h[3] + h[4];
		b = '0x' + h[5] + h[6];
		a = alpha != null ? alpha : '1.0';
	} else if (h.length === 9) {
		r = '0x' + h[1] + h[2];
		g = '0x' + h[3] + h[4];
		b = '0x' + h[5] + h[6];
		a = '0x' + h[7] + h[8];
		a = +(a / 255).toFixed(3);
	}

	return 'rgba(' + +r + ',' + +g + ',' + +b + ',' + a + ')';
}

export const getTextColor = (color) => {
	const c = color.substring(1);      // strip #
	const rgb = parseInt(c, 16);   // convert rrggbb to decimal
	const r = (rgb >> 16) & 0xff;  // extract red
	const g = (rgb >> 8) & 0xff;  // extract green
	const b = (rgb >> 0) & 0xff;  // extract blue

	const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

	if (luma < 55) {
		return '#FFF';
	}
	return '#174967';
};

export const getRectWidthBasedOnText = (context, rectWidth, rectHeight, text) => {
	const originalFont = context.font;
	context.font = getFontSized(54, rectHeight, 'digital-font');
	context.lineJoin = "round";

	context.font = originalFont;
	return Math.max(rectWidth, getFrameSize(context.canvas.width), context.measureText(text).width + 20);
};

const lerp = (x, y, a) => x * (1 - a) + y * a;
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
export const range = (x1, y1, x2, y2, a) => lerp(x2, y2, invlerp(x1, y1, a));
