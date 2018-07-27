import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import 'chartjs-plugin-annotation';

export class ChartItem {
	constructor(public label: string, public data: Array<any>, public borderColor?: string, public backgroundColor?: string,
		public fill?: boolean, public showLine?: boolean, public isGradient?: boolean, public borderWidth?: number, public chartType?: string,
		public chartTooltipItem?: ChartTooltipItem) {
	}
}

export class ChartLineAnnotation {
	constructor(public label: ChartLabelAnnotation, public value: number, public orientation: string, public drawTime: string,
		public type: string, public borderDash?: Array<number>, public borderColor?: string, public borderWidth?: number, public endValue?: number) {
	}
}

export class ChartBoxAnnotation {
	constructor(public drawTime: string, public xMin: number, public xMax: number, public yMin: number, public yMax: number,
		public type: string, public backgroundColor?: string, public borderColor?: string, public borderWidth?: number) {
	}
}

export class ChartLabelAnnotation {
	constructor(public text?: string, public position?: string, public backgroundColor?: string, public fontStyle?: string,
		public fontColor?: string) {
	}
}

export class ChartTooltipItem {
	constructor(public title?: string, public label?: string, public afterLabel?: string, public valueInAfterLabel?: boolean) {
	}
}

export class ChartTooltipSettings {
	constructor(public backgroundColor?: string, public borderColor?: string, public borderWidth?: number, public bodyFontColor?: string,
		public bodyFontSize?: number, public titleFontSize?: number, public titleFontColor?: string) {
		this.bodyFontColor = '#ffffff';
		this.borderColor = 'rgba(0,0,0,0)';
		this.borderWidth = 0;
		this.bodyFontSize = 12;
		this.titleFontSize = 12;
		this.titleFontColor = '#ffffff';
		this.backgroundColor = 'rgba(0,0,0,0.8)';
	}
}

@Component({
	selector: 'systelab-chart',
	templateUrl: './chart.component.html'
})
export class ChartComponent implements AfterViewInit {
	public defaultColors: Array<number[]> = [
		[255, 99, 132],
		[54, 162, 235],
		[255, 206, 86],
		[75, 192, 192],
		[220, 220, 220],
		[247, 70, 74],
		[70, 191, 189],
		[253, 180, 92],
		[148, 159, 177],
		[151, 187, 205],
		[231, 233, 237],
		[77, 83, 96]];
	chart = Chart;
	private _itemSelected: any;

	@Input()
	get itemSelected(): any {
		return this._itemSelected;
	}

	@Output() itemSelectedChange = new EventEmitter();

	set itemSelected(value: any) {
		this._itemSelected = value;
		this.itemSelectedChange.emit(this._itemSelected);
	}

	@Input() labels: Array<any> = [];
	@Input() data: Array<ChartItem> = [];
	@Input() chartAnnotationsLine: Array<ChartLineAnnotation> = [];
	@Input() chartAnnotationsBox: Array<ChartBoxAnnotation> = [];
	@Input() legend = true;
	@Input() isHorizontal = false;
	@Input() yMinValue: any;
	@Input() yMaxValue: any;
	@Input() xMinValue: any;
	@Input() xMaxValue: any;
	@Input() yLabelAxis: string;
	@Input() xLabelAxis: string;
	@Input() lineTension: number;
	@Input() isBackgroundGrid = true;
	@Input() typeChart: string;
	@Input() responsive = true;
	@Input() maintainAspectRatio = true;
	@Input() chartTooltipSettings: ChartTooltipSettings;

	@Input() minValueForRadar: number;
	@Input() maxValueForRadar: number;

	public dataset: Array<any> = [];
	public annotationsBox: Array<any> = [];
	public annotationsLine: Array<any> = [];
	public annotations: Array<any> = [];
	public axesVisible = true;
	public yAxisLabelVisible = false;
	public xAxisLabelVisible = false;

	@Output() action = new EventEmitter();

	@ViewChild('canvas') canvas: ElementRef;

	public ngAfterViewInit() {

		let cx: CanvasRenderingContext2D;

		if (this.typeChart === 'bar') {
			if (this.isHorizontal) {
				this.typeChart = 'horizontalBar';
			}
		}

		if (!this.chartTooltipSettings) {
			this.chartTooltipSettings = new ChartTooltipSettings();
		}

		/* Axes Labels */
		if (this.xLabelAxis) {
			this.xAxisLabelVisible = true;
		}
		if (this.yLabelAxis) {
			this.yAxisLabelVisible = true;
		}
		if (this.canvas.nativeElement) {
			cx = this.canvas.nativeElement.getContext('2d');
		}

		this.setData(cx);

		if (this.typeChart === 'pie' || this.typeChart === 'doughnut' || this.typeChart === 'polarArea' || this.typeChart === 'radar') {
			this.axesVisible = false;
		}
		this.addAnnotationsLine();
		this.addAnnotationsBox();
		this.drawChart(cx);

	}

	private drawChart(cx: CanvasRenderingContext2D) {
		/* Draw the chart */
		if (this.canvas.nativeElement) {
			const definition: any = {
				type: this.typeChart,
				data: {
					labels: this.labels,
					datasets: this.dataset
				},

				options: {
					responsive: this.responsive,
					maintainAspectRatio: this.maintainAspectRatio,
					onClick: (evt, item) => {
						const e = item[0];
						if (e) {
							this.itemSelected = e;
							this.action.emit();
						}
					},
					elements: {
						line: {
							tension: this.lineTension
						}
					},
					display: true,
					legend: {
						display: this.legend
					},
					scales: {
						yAxes: [{
							ticks: {
								min: this.yMinValue,
								max: this.yMaxValue,
								display: this.axesVisible
							},
							gridLines: {
								display: this.isBackgroundGrid,
								drawBorder: this.axesVisible
							},
							scaleLabel: {
								display: this.yAxisLabelVisible,
								labelString: this.yLabelAxis
							}
						}],
						xAxes: [{
							ticks: {
								min: this.xMinValue,
								max: this.xMaxValue,
								display: this.axesVisible
							},
							gridLines: {
								display: this.isBackgroundGrid,
								drawBorder: this.axesVisible
							},
							scaleLabel: {
								display: this.xAxisLabelVisible,
								labelString: this.xLabelAxis
							}
						}]
					},
					annotation: {
						events: ['click'],
						annotations: this.annotations
					},
					tooltips: {
						callbacks: {
							title: function (tooltipItem, data) {
								const item = data.datasets[tooltipItem[0].datasetIndex];
								if (item.chartTooltipItem) {
									if (item.chartTooltipItem.title) {
										return item.chartTooltipItem.title;
									}
								}
							},
							label: function (tooltipItem, data) {
								const item = data.datasets[tooltipItem.datasetIndex];
								let label = data.datasets[tooltipItem.datasetIndex].label;
								if (!label) {
									label = data.labels[tooltipItem.index];
								}
								const val = item.data[tooltipItem.index];
								let rt = '';
								if (val instanceof Object) {
									if (val.t) {
										rt = val.t;
									} else {
										rt = '(' + val.x + ',' + val.y + ')';
									}
								} else {
									rt = val;
								}
								if (item.chartTooltipItem) {
									if (item.chartTooltipItem.label) {
										label = item.chartTooltipItem.label;
									}
									if (!item.chartTooltipItem.valueInAfterLabel) {
										label += ': ' + rt;
									}
								} else {
									label += ': ' + rt;
								}
								return label;
							},
							afterLabel: function (tooltipItem, data) {
								const item = data.datasets[tooltipItem.datasetIndex];
								let afterLabel = '';
								if (item.chartTooltipItem) {
									if (item.chartTooltipItem.afterLabel) {
										afterLabel = item.chartTooltipItem.afterLabel;
									}
									if (item.chartTooltipItem.valueInAfterLabel) {
										const val = item.data[tooltipItem.index];
										let rt = '';
										if (val instanceof Object) {
											if (val.t) {
												rt = val.t;
											} else {
												rt = '(' + val.x + ',' + val.y + ')';
											}
										} else {
											rt = val;
										}
										afterLabel += ' (' + rt + ')';
									}
								}
								return afterLabel;
							}
						},
						backgroundColor: this.chartTooltipSettings.backgroundColor,
						titleFontSize: this.chartTooltipSettings.titleFontSize,
						titleFontColor: this.chartTooltipSettings.titleFontColor,
						bodyFontColor: this.chartTooltipSettings.bodyFontColor,
						bodyFontSize: this.chartTooltipSettings.bodyFontSize,
						borderColor: this.chartTooltipSettings.borderColor,
						borderWidth: this.chartTooltipSettings.borderWidth
					}
				}
			};

			if (this.typeChart === 'radar') {
				definition.options.scale = {
					ticks: {
						min: this.minValueForRadar,
						max: this.maxValueForRadar
					}
				};
			}

			this.chart = new Chart(cx, definition);
		}
	}

	private setData(cx: CanvasRenderingContext2D) {

		let borderColors: any;
		let backgroundColors: any;

		if (this.data) {
			let colorNumber = 0;

			for (let i = 0; i < this.data.length; i++) {
				colorNumber = i;
				if (this.data[i].isGradient) {
					const gradientStroke = cx.createLinearGradient(500, 0, 100, 0);
					gradientStroke.addColorStop(0, this.rgba(this.defaultColors[0], 1));
					gradientStroke.addColorStop(1, this.rgba(this.defaultColors[1], 1));
					borderColors = gradientStroke;
					backgroundColors = gradientStroke;
				} else if ((this.typeChart === 'pie' || this.typeChart === 'doughnut' || this.typeChart === 'polarArea') && !this.data[i].chartType) {
					const backgroundColorList: Array<any> = [];
					const borderColorList: Array<any> = [];
					for (let j = 0; j < this.data[i].data.length; j++) {
						borderColorList.push(this.rgba(this.defaultColors[colorNumber], 1));
						backgroundColorList.push(this.rgba(this.defaultColors[colorNumber], 1));
						colorNumber++;
						if (colorNumber > (this.defaultColors.length - 1)) {
							colorNumber = 0;
						}
					}
					borderColors = borderColorList;
					backgroundColors = backgroundColorList;
				} else {
					if (colorNumber > (this.defaultColors.length - 1)) {
						colorNumber = 0;
					}
					if (!this.data[i].borderColor) {
						this.data[i].borderColor = this.rgba(this.defaultColors[colorNumber], 1);
					}
					if (!this.data[i].backgroundColor) {
						if (this.data[i].fill) {
							this.data[i].backgroundColor = this.rgba(this.defaultColors[colorNumber], 0.6);
						} else {
							this.data[i].backgroundColor = 'transparent';
						}
					}
					borderColors = this.data[i].borderColor;
					backgroundColors = this.data[i].backgroundColor;
				}
				this.dataset.push({
					label: this.data[i].label, data: this.data[i].data, borderColor: borderColors,
					backgroundColor: backgroundColors, fill: this.data[i].fill,
					type: this.data[i].chartType, borderWidth: this.data[i].borderWidth, showLine: this.data[i].showLine,
					chartTooltipItem: this.data[i].chartTooltipItem
				});
			}
		}

	}

	private addAnnotationsLine() {
		if (this.chartAnnotationsLine) {
			let colorNumber = 0;
			for (let i = 0; i < this.chartAnnotationsLine.length; i++) {
				colorNumber = i;
				if (colorNumber > (this.defaultColors.length - 1)) {
					colorNumber = 0;
				}
				if (!this.chartAnnotationsLine[i].borderColor) {
					this.chartAnnotationsLine[i].borderColor = this.rgba(this.defaultColors[colorNumber], 1);
				}
				if (!this.chartAnnotationsLine[i].borderWidth) {
					this.chartAnnotationsLine[i].borderWidth = 2;
				}

				if (this.chartAnnotationsLine[i].label) {
					if (!this.chartAnnotationsLine[i].label.backgroundColor) {
						this.chartAnnotationsLine[i].label.backgroundColor = this.rgba(this.defaultColors[colorNumber + 1], 1);
					}
					if (!this.chartAnnotationsLine[i].label.position) {
						this.chartAnnotationsLine[i].label.position = 'center';
					}
					if (!this.chartAnnotationsLine[i].label.fontColor) {
						this.chartAnnotationsLine[i].label.fontColor = '#ffffff';
					}
					if (!this.chartAnnotationsLine[i].label.fontStyle) {
						this.chartAnnotationsLine[i].label.fontStyle = 'normal';
					}
				}
				let scaleId = 'y-axis-0';
				if (this.chartAnnotationsLine[i].orientation === 'vertical') {
					scaleId = 'x-axis-0';
				}
				this.annotations.push({
					drawTime: this.chartAnnotationsLine[i].drawTime, id: 'annotation' + (this.annotations.length + 1), type: this.chartAnnotationsLine[i].type,
					mode: this.chartAnnotationsLine[i].orientation, scaleID: scaleId, value: this.chartAnnotationsLine[i].value,
					borderColor: this.chartAnnotationsLine[i].borderColor, endValue: this.chartAnnotationsLine[i].endValue,
					label: {
						backgroundColor: this.chartAnnotationsLine[i].label.backgroundColor,
						position: this.chartAnnotationsLine[i].label.position,
						content: this.chartAnnotationsLine[i].label.text,
						fontColor: this.chartAnnotationsLine[i].label.fontColor,
						enabled: true,
						fontStyle: this.chartAnnotationsLine[i].label.fontStyle
					}, borderWidth: this.chartAnnotationsLine[i].borderWidth, borderDash: this.chartAnnotationsLine[i].borderDash
				});
			}
		}
	}
	private addAnnotationsBox() {
		if (this.chartAnnotationsBox) {
			let colorNumber = 0;
			for (let i = 0; i < this.chartAnnotationsBox.length; i++) {
				colorNumber = i;
				if (colorNumber > (this.defaultColors.length - 1)) {
					colorNumber = 0;
				}
				if (!this.chartAnnotationsBox[i].borderColor) {
					this.chartAnnotationsBox[i].borderColor = this.rgba(this.defaultColors[colorNumber], 1);
				}
				if (!this.chartAnnotationsBox[i].borderWidth) {
					this.chartAnnotationsBox[i].borderWidth = 2;
				}

				if (!this.chartAnnotationsBox[i].backgroundColor) {
					this.chartAnnotationsBox[i].backgroundColor = 'transparent';
				}

				this.annotations.push({
					drawTime: this.chartAnnotationsBox[i].drawTime,
					id: 'annotation' + (this.annotations.length + 1),
					type: this.chartAnnotationsBox[i].type,
					backgroundColor: this.chartAnnotationsBox[i].backgroundColor,
					borderWidth: this.chartAnnotationsBox[i].borderWidth,
					borderColor: this.chartAnnotationsBox[i].borderColor,
					xMin: this.chartAnnotationsBox[i].xMin,
					xMax: this.chartAnnotationsBox[i].xMax,
					yMin: this.chartAnnotationsBox[i].yMin,
					yMax: this.chartAnnotationsBox[i].yMax,
					xScaleID: 'x-axis-0',
					yScaleID: 'y-axis-0'
				});

			}
		}
	}

	public rgba(colour: Array<number>, alpha: number): string {
		return 'rgba(' + colour.concat(alpha)
			.join(',') + ')';
	}

	public doUpdate() {
		let cx: CanvasRenderingContext2D;
		if (this.canvas.nativeElement) {
			cx = this.canvas.nativeElement.getContext('2d');
		}
		this.chart.destroy();
		this.dataset = [];
		this.setData(cx);
		this.addAnnotationsBox();
		this.addAnnotationsLine();
		this.drawChart(cx);
	}
}
