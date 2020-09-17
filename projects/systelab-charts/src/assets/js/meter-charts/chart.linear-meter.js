import {
	drawTextPanel,
	getFontSized,
	getTextBackgroundColor,
	getTextColor,
	ChartMeterData,
	range,
	getRectWidthBasedOnText, hideGoalsAndTooltips
} from "./chart.common-meter-functions";

export const LinearMeter = Chart.controllers.bar.extend({
	buildOrUpdateElements:        function() {
		Chart.controllers.bar.prototype.buildOrUpdateElements.apply(this, arguments);
		hideGoalsAndTooltips(this.chart);
	},
	draw:                         function(ease) {
		// Call super method first
		if (this.chart.options.chartMeterOptions.showHistory) {
			Chart.controllers.bar.prototype.draw.apply(this, arguments);
		} else {
			const context = this.chart.chart.ctx;
			const canvas = this.chart.canvas;
			context.save();
			context.clearRect(0, 0, canvas.width, canvas.height);
			const centerX = canvas.width / 2;
			const centerY = canvas.height / 2;

			const chartMeterData = new ChartMeterData(this._data, this.chart.options.chartMeterOptions);

			context.moveTo(centerX, centerY);

			if (this.chart.options.isHorizontal) {

				const externalPanelHeight = Math.max(130, centerY * 0.75);
				const externalPanelWidth = Math.max(470, centerX + centerX / 2);

				const textPanelHeight = Math.max(20, centerY / 8);
				const textPanelWidth = Math.max(80, centerX / 4);

				const textPanelYPos = centerY - (centerY / 3) + 12;
				const increment = Math.max(7, ((centerX + centerX / 2) - (centerX / 7)) / 61);

				drawTextPanel(context, undefined, '#DDDDDD44', centerX / 4, centerY - (centerY / 3), externalPanelWidth,
					externalPanelHeight, undefined, this.chart.options.chartMeterOptions.borderColor);

				drawTextPanel(context, chartMeterData.text, chartMeterData.textBackgroundColor, centerX / 4 + externalPanelWidth - textPanelWidth - increment, textPanelYPos,
					textPanelWidth, textPanelHeight, getTextColor(chartMeterData.textBackgroundColor)
				);

				this.drawHorizontalTicksLabelsBar(context, this._data[this._data.length - 1], centerX / 3,
					textPanelYPos + textPanelHeight + textPanelHeight / 2, externalPanelHeight,
					increment, chartMeterData.minValue, chartMeterData.textIncrement, chartMeterData.fractionDigits);

			} else {
				const textPanelHeight = Math.max(30, centerY / 8);
				const textPanelWidth = Math.max(98, centerX / 4);

				const externalPanelHeight = Math.max(365, canvas.height * 0.9);
				const externalPanelWidth = Math.max(130, centerX / 3, getRectWidthBasedOnText(context, textPanelWidth, textPanelHeight, chartMeterData.text) * 1.35);

				const calculatedYPos = Math.max(333, externalPanelHeight - textPanelHeight - 20);

				drawTextPanel(context, undefined, '#DDDDDD44', centerX - centerX / 6, 15, externalPanelWidth,
					externalPanelHeight, '#DDDDDD44', this.chart.options.chartMeterOptions.borderColor);

				drawTextPanel(context, chartMeterData.text, chartMeterData.textBackgroundColor, centerX - centerX / 8,
					calculatedYPos + 15, textPanelWidth, textPanelHeight, getTextColor(chartMeterData.textBackgroundColor));

				const increment = externalPanelHeight * 6.75 / 495; // Math.max(6, externalPanelHeight * 0.8 / 61);
				const panelsSeparation = 15 * textPanelHeight / 30;
				this.drawVerticalTicksLabelsBar(context, this._data[this._data.length - 1], centerX - centerX / 6 + 3,
					externalPanelHeight - textPanelHeight - panelsSeparation, textPanelWidth,
					increment, chartMeterData.minValue, chartMeterData.textIncrement, chartMeterData.fractionDigits);
			}
			context.restore();

		}
	},
	drawHorizontalTicksLabelsBar: function(context, valueToPrint, xStartPos, yStartPos, panelHeight, increment, startingValue, textIncrement, fractionDigits) {
		context.beginPath();
		context.strokeStyle = 'darkgray';
		context.fillStyle = 'darkgray';
		const calculatedHeightForPanels = Math.max(35, panelHeight / 2.5);
		const calculatedYPos = yStartPos + calculatedHeightForPanels + 15;
		context.font = getFontSized(10, calculatedHeightForPanels, 'Helvetica');
		const textGap = 15 * calculatedHeightForPanels / 70;
		let valueToPrintXPos;

		for (let index = 0; index <= 60; index++) {
			const text = (startingValue + index * textIncrement).toFixed(fractionDigits);
			switch (index % 10) {
				case 0:
					if (Number(text) === valueToPrint) {
						valueToPrintXPos = xStartPos + index * increment - context.measureText(text).width - 10;
					}
					context.lineWidth = 3;
					context.fillText(text, xStartPos + index * increment - context.measureText(text).width / 2, calculatedYPos + textGap);
					context.beginPath();
					context.moveTo(xStartPos + index * increment, calculatedYPos - 10);
					context.lineTo(xStartPos + index * increment, calculatedYPos);
					context.stroke();
					context.closePath();
					break;
				case 5:
					if (Number(text) === valueToPrint) {
						valueToPrintXPos = xStartPos + index * increment - 10;
					}
					context.lineWidth = 2;
					context.beginPath();
					context.moveTo(xStartPos + index * increment, calculatedYPos - 8);
					context.lineTo(xStartPos + index * increment, calculatedYPos);
					context.stroke();
					context.closePath();
					break;
				default:
					if (Number(text) === valueToPrint) {
						valueToPrintXPos = xStartPos + index * increment - 10;
					}
					context.lineWidth = 1;
					context.beginPath();
					context.moveTo(xStartPos + index * increment, calculatedYPos - 5);
					context.lineTo(xStartPos + index * increment, calculatedYPos);
					context.stroke();
					context.closePath();
					break;
			}
		}
		const linearGradient = context.createLinearGradient(100, 0, 500, 0);

		linearGradient.addColorStop(0.5, 'lightgray');
		linearGradient.addColorStop(1, 'gray');

		drawTextPanel(context, undefined, 'white', xStartPos - 5, yStartPos, increment * 61, calculatedHeightForPanels);

		const firstValue = Number((startingValue).toFixed(fractionDigits));
		const lastValue = Number((startingValue + 60 * textIncrement).toFixed(fractionDigits));
		const lastValueXPosition = xStartPos + 60 * increment;
		if (!valueToPrintXPos) {
			valueToPrintXPos = range(firstValue, lastValue, xStartPos, lastValueXPosition, valueToPrint);
		}
		context.beginPath();
		context.lineWidth = 3;
		context.fillStyle = getTextBackgroundColor(this.chart.options.chartMeterOptions.levels, valueToPrint);
		context.fillRect(xStartPos, yStartPos + 1, valueToPrintXPos - xStartPos, calculatedHeightForPanels - 2);
		context.closePath();
	},
	drawVerticalTicksLabelsBar:   function(context, valueToPrint, xStartPos, yStartPos, panelWidth, increment, startingValue, textIncrement, fractionDigits) {
		context.beginPath();
		context.strokeStyle = 'darkgray';
		context.font = getFontSized(12, panelWidth / 2, 'Helvetica');
		context.fillStyle = 'darkgray';
		const calculatedYPos = Math.max(333, yStartPos);

		let valueToPrintYPos;
		let maxTextLabelWidth = 0;

		for (let index = 0; index <= 60; index++) {
			if (index % 10 === 0) {
				const text = (startingValue + index * textIncrement).toFixed(fractionDigits);
				maxTextLabelWidth = Math.max(maxTextLabelWidth, context.measureText(text).width * 1.525);
			}
		}

		for (let index = 0; index <= 60; index++) {
			const text = (startingValue + index * textIncrement).toFixed(fractionDigits);
			switch (index % 10) {
				case 0:
					if (Number(text) === valueToPrint) {
						valueToPrintYPos = calculatedYPos - index * increment;
					}
					let actualBoundingBoxAscent = context.measureText(text).actualBoundingBoxAscent / 2;
					if (Number.isNaN(actualBoundingBoxAscent)) {
						actualBoundingBoxAscent = panelWidth * 4 / 114.625;
					}
					context.lineWidth = 2.5;
					context.fillText(text, xStartPos + 10, calculatedYPos - index * increment + actualBoundingBoxAscent);
					context.beginPath();
					context.moveTo(xStartPos + 10 + maxTextLabelWidth, calculatedYPos - index * increment);
					context.lineTo(xStartPos + maxTextLabelWidth, calculatedYPos - index * increment);
					context.stroke();
					context.closePath();
					break;
				case 5:
					if (Number(text) === valueToPrint) {
						valueToPrintYPos = calculatedYPos - index * increment;
					}
					context.lineWidth = 1.5;
					context.beginPath();
					context.moveTo(xStartPos + 8 + maxTextLabelWidth, calculatedYPos - index * increment);
					context.lineTo(xStartPos + maxTextLabelWidth, calculatedYPos - index * increment);
					context.stroke();
					context.closePath();
					break;
				default:
					if (Number(text) === valueToPrint) {
						valueToPrintYPos = calculatedYPos - index * increment;
					}
					context.lineWidth = 0.7;
					context.beginPath();
					context.moveTo(xStartPos + 5 + maxTextLabelWidth, calculatedYPos - index * increment);
					context.lineTo(xStartPos + maxTextLabelWidth, calculatedYPos - index * increment);
					context.stroke();
					context.closePath();
					break;
			}
		}
		const linearGradient = context.createLinearGradient(0, 100, 0, 50);

		linearGradient.addColorStop(0.5, 'lightgray');
		linearGradient.addColorStop(1, 'gray');

		const calculatedBarWidth = panelWidth * 0.6 - fractionDigits;
		drawTextPanel(context, undefined, 'white', xStartPos + 20 + maxTextLabelWidth, calculatedYPos - increment * 60,
			calculatedBarWidth, increment * 60);

		const firstValue = Number((startingValue).toFixed(fractionDigits));
		const lastValue = Number((startingValue + 60 * textIncrement).toFixed(fractionDigits));
		const lastValueYPosition = calculatedYPos - 60 * increment;
		if (!valueToPrintYPos) {
			valueToPrintYPos = range(lastValue, firstValue, lastValueYPosition, calculatedYPos, valueToPrint);
		}
		context.beginPath();
		context.lineWidth = 3;
		context.fillStyle = getTextBackgroundColor(this.chart.options.chartMeterOptions.levels, valueToPrint);
		context.fillRect(xStartPos + 25 + maxTextLabelWidth, valueToPrintYPos, calculatedBarWidth - 10, calculatedYPos - valueToPrintYPos);
		context.closePath();
	}
});