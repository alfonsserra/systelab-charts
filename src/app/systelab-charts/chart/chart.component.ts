import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import 'chartjs-plugin-annotation';

export class ChartItem {
	constructor(public label: string, public data: Array<any>, public borderColor?: string, public backgroundColor?: string,
				public fill?: boolean, public showLine?: boolean, public isGradient?: boolean, public borderWidth?: number,
				public chartType?: string, public chartTooltipItem?: ChartTooltipItem, public pointRadius?: number, public yAxisID?: string,
				public legendType?: string, public labelBorderColors?: Array<number[]>, public labelBackgroundColors?: Array<number[]>) {
	}
}

export class Annotation {
	constructor(public drawTime: string, public type: string, public borderColor?: string, public borderWidth?: number,
				public scaleId = 'y-axis-0') {
	}
}

export class ChartLineAnnotation extends Annotation {
	constructor(public label: ChartLabelAnnotation, public value: number, public orientation: string, drawTime: string,
				type: string, public borderDash?: Array<number>, borderColor?: string, borderWidth?: number, public endValue?: number) {
		super(drawTime, type, borderColor, borderWidth);
	}
}

export class ChartBoxAnnotation extends Annotation {
	constructor(drawTime: string, public xMin: number, public xMax: number, public yMin: number, public yMax: number,
				type: string, public backgroundColor?: string, borderColor?: string, borderWidth?: number) {
		super(drawTime, type, borderColor, borderWidth);
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

export class ChartMultipleYAxisScales {
	constructor(public id?: string, public type?: string, public position?: string,
				public stacked = false,
				public ticks?: { min: number, max: number, stepSize?: number, display?: boolean },
				public gridLines?: { display: boolean, drawBorder: boolean },
				public scaleLabel?: { display: boolean, labelString: string }) {
	}

	public getScaleDefinition() {
		return {
			id:         this.id,
			type:       this.type,
			position:   this.position,
			stacked:    this.stacked,
			ticks:      this.ticks,
			gridLines:  this.gridLines,
			scaleLabel: this.scaleLabel
		};
	}
}

@Component({
	selector:    'systelab-chart',
	templateUrl: './chart.component.html'
})
export class ChartComponent implements AfterViewInit {
	private defaultColors: Array<number[]> = [
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
	@Input() annotations: Array<ChartLineAnnotation | ChartBoxAnnotation> = [];
	@Input() showLegend = true;
	@Input() legendPosition = 'top';
	@Input() isHorizontal = false;
	@Input() yMinValue: any;
	@Input() yMaxValue: any;
	@Input() xMinValue: any;
	@Input() xMaxValue: any;
	@Input() xAutoSkip = true;
	@Input() yLabelAxis: string;
	@Input() xLabelAxis: string;
	@Input() lineTension: number;
	@Input() isBackgroundGrid = true;
	@Input() type: string;
	@Input() responsive = true;
	@Input() maintainAspectRatio = true;
	@Input() tooltipSettings: ChartTooltipSettings;
	@Input() isStacked = false;
	@Input() animationDuration = 1000;
	@Input() minValueForRadar: number;
	@Input() maxValueForRadar: number;
	@Input() multipleYAxisScales: Array<ChartMultipleYAxisScales>;
	@Input() customLegend = false;

	private dataset: Array<any> = [];

	private _annotations: Array<any> = [];
	private axesVisible = true;
	private yAxisLabelVisible = false;
	private xAxisLabelVisible = false;

	@Output() action = new EventEmitter();

	@ViewChild('canvas', {static: false}) canvas: ElementRef;
	@ViewChild('topLegend', {static: false}) topLegend: ElementRef;
	@ViewChild('bottomLegend', {static: false}) bottomLegend: ElementRef;

	public ngAfterViewInit() {

		let cx: CanvasRenderingContext2D;

		if (this.type === 'bar') {
			if (this.isHorizontal) {
				this.type = 'horizontalBar';
			}
		}

		if (!this.tooltipSettings) {
			this.tooltipSettings = new ChartTooltipSettings();
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

		if (this.customLegend) {
			this.initCustomLegend();
		}

		this.setData(cx);

		if (this.type === 'pie' || this.type === 'doughnut' || this.type === 'polarArea' || this.type === 'radar') {
			this.axesVisible = false;
		}
		this.addAnnotations();
		this.drawChart(cx);
		if (this.customLegend && this.data.filter(obj => obj.legendType != null).length === this.data.length) {
			this.buildCustomLegend();
		}
	}

	private initCustomLegend() {
		this.showLegend = false;
	}

	private buildCustomLegend() {
		let legendItems = [];
		if (this.legendPosition === 'top') {
			this.topLegend.nativeElement.innerHTML = this.chart.generateLegend();
			legendItems = this.topLegend.nativeElement.getElementsByTagName('li');
		} else {
			this.bottomLegend.nativeElement.innerHTML = this.chart.generateLegend();
			legendItems = this.bottomLegend.nativeElement.getElementsByTagName('li');
		}
		for (let i = 0; i < legendItems.length; i += 1) {
			legendItems[i].addEventListener('click', this.legendClickCallback.bind(this), false);
		}
	}

	private drawChart(cx: CanvasRenderingContext2D) {
		/* Draw the chart */
		if (this.canvas.nativeElement) {
			const definition: any = {
				type: this.type,
				data: {
					labels:   this.labels,
					datasets: this.dataset
				},

				options: {
					animation:           {
						duration: this.animationDuration
					},
					responsive:          this.responsive,
					maintainAspectRatio: this.maintainAspectRatio,
					onClick:             (evt, item) => {
						const e = item[0];
						if (e) {
							this.itemSelected = e;
							this.action.emit();
						}
					},
					elements:            {
						line: {
							tension: this.lineTension
						}
					},
					display:             true,
					legend:              {
						display:  this.showLegend,
						position: this.legendPosition
					},
					legendCallback:      function(chart) {
						const text = [];
						text.push('<ul class="' + chart.id + '-legend">');
						const data = chart.data;
						const dataSets = data.datasets;
						if (dataSets.length) {
							for (let i = 0; i < dataSets.length; i++) {
								text.push('<li>');
								if (dataSets[i].legendType) {
									if (dataSets[i].borderColor && dataSets[i].backgroundColor) {
										if (dataSets[i].backgroundColor === 'transparent') {
											text.push('<span class="' + dataSets[i].legendType + '" style="background-color:' + dataSets[i].borderColor + '; ' +
												'border-color:' + dataSets[i].borderColor + '"></span>');
										} else if (dataSets[i].borderColor === 'transparent') {
											text.push('<span class="' + dataSets[i].legendType + '" style="background-color:' + dataSets[i].backgroundColor + '; ' +
												'border-color:' + dataSets[i].backgroundColor + '"></span>');
										} else {
											text.push('<span class="' + dataSets[i].legendType + '" style="background-color:' + dataSets[i].backgroundColor + ';' +
												' border-color:' + dataSets[i].borderColor + '"></span>');
										}
									} else if (dataSets[i].borderColor) {
										text.push('<span class="' + dataSets[i].legendType + '" style="border-color:' + dataSets[i].borderColor + '"></span>');
									} else if (dataSets[i].backgroundColor) {
										text.push('<span class="' + dataSets[i].legendType + '" style="background-color:' + dataSets[i].backgroundColor + '"></span>');
									}
								}
								text.push(dataSets[i].label);
								text.push('</li>');
							}
						}
						text.push('</ul>');
						return text.join('');
					},
					scales:              {
						yAxes: this.multipleYAxisScales ? this.multipleYAxisScales.map(yAxis => yAxis.getScaleDefinition()) : [
							{
								stacked:    this.isStacked,
								ticks:      {
									min:     this.yMinValue,
									max:     this.yMaxValue,
									display: this.axesVisible
								},
								gridLines:  {
									display:    this.isBackgroundGrid,
									drawBorder: this.axesVisible
								},
								scaleLabel: {
									display:     this.yAxisLabelVisible,
									labelString: this.yLabelAxis
								}
							}],
						xAxes: [{
							stacked:    this.isStacked,
							ticks:      {
								min:      this.xMinValue,
								max:      this.xMaxValue,
								display:  this.axesVisible,
								autoSkip: this.xAutoSkip
							},
							gridLines:  {
								display:    this.isBackgroundGrid,
								drawBorder: this.axesVisible
							},
							scaleLabel: {
								display:     this.xAxisLabelVisible,
								labelString: this.xLabelAxis
							}
						}]
					},
					annotation:          {
						events:      ['click'],
						annotations: this._annotations
					},
					tooltips:            {
						callbacks:       {
							title:      function(tooltipItem, data) {
								const item = data.datasets[tooltipItem[0].datasetIndex];
								if (item.chartTooltipItem) {
									if (item.chartTooltipItem.title) {
										return item.chartTooltipItem.title;
									}
								}
							},
							label:      function(tooltipItem, data) {
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
							afterLabel: function(tooltipItem, data) {
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
						backgroundColor: this.tooltipSettings.backgroundColor,
						titleFontSize:   this.tooltipSettings.titleFontSize,
						titleFontColor:  this.tooltipSettings.titleFontColor,
						bodyFontColor:   this.tooltipSettings.bodyFontColor,
						bodyFontSize:    this.tooltipSettings.bodyFontSize,
						borderColor:     this.tooltipSettings.borderColor,
						borderWidth:     this.tooltipSettings.borderWidth
					}
				}
			};

			if (this.type === 'radar') {
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
				} else if ((this.type === 'pie' || this.type === 'doughnut' || this.type === 'polarArea') && !this.data[i].chartType) {
					const backgroundColorList: Array<any> = [];
					const borderColorList: Array<any> = [];
					for (let j = 0; j < this.data[i].data.length; j++) {
						if (this.data[i].labelBorderColors && this.data[i].labelBorderColors[j]) {
							borderColorList.push(this.rgba(this.data[i].labelBorderColors[j], 1));
						} else {
							borderColorList.push(this.rgba(this.defaultColors[colorNumber], 1));
						}
						if (this.data[i].labelBackgroundColors && this.data[i].labelBackgroundColors[j]) {
							backgroundColorList.push(this.rgba(this.data[i].labelBackgroundColors[j], 1));
						} else {
							backgroundColorList.push(this.rgba(this.defaultColors[colorNumber], 1));
						}

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
					yAxisID:          this.data[i].yAxisID,
					label:            this.data[i].label,
					data:             this.data[i].data,
					borderColor:      borderColors,
					backgroundColor:  backgroundColors,
					fill:             this.data[i].fill,
					type:             this.data[i].chartType,
					borderWidth:      this.data[i].borderWidth,
					showLine:         this.data[i].showLine,
					pointRadius:      this.data[i].pointRadius,
					chartTooltipItem: this.data[i].chartTooltipItem,
					legendType:       this.data[i].legendType
				});
			}
		}

	}

	private addAnnotations() {
		if (this.annotations) {
			for (let i = 0; i < this.annotations.length; i++) {
				if (this.annotations[i] instanceof ChartLineAnnotation) {
					this.addLineAnnotation(<ChartLineAnnotation>this.annotations[i], this.rgba(this.defaultColors[this.getColorNumber(i)], 1),
						this.rgba(this.defaultColors[this.getColorNumber(i) + 1], 1));
				}
				if (this.annotations[i] instanceof ChartBoxAnnotation) {
					this.addBoxAnnotation(<ChartBoxAnnotation>this.annotations[i], this.rgba(this.defaultColors[this.getColorNumber(i)], 1));

				}
			}
		}
	}

	private addLineAnnotation(lineAnnotation: ChartLineAnnotation, defaultBorderColor: any, defaultBackgroundColor: any) {

		if (!lineAnnotation.borderColor) {
			lineAnnotation.borderColor = defaultBorderColor;
		}
		if (!lineAnnotation.borderWidth) {
			lineAnnotation.borderWidth = 2;
		}

		if (lineAnnotation.label) {
			if (!lineAnnotation.label.backgroundColor) {
				lineAnnotation.label.backgroundColor = defaultBackgroundColor;
			}
			if (!lineAnnotation.label.position) {
				lineAnnotation.label.position = 'center';
			}
			if (!lineAnnotation.label.fontColor) {
				lineAnnotation.label.fontColor = '#ffffff';
			}
			if (!lineAnnotation.label.fontStyle) {
				lineAnnotation.label.fontStyle = 'normal';
			}
		}
		let scaleId = lineAnnotation.scaleId;
		if (lineAnnotation.orientation === 'vertical') {
			scaleId = 'x-axis-0';
		}
		this._annotations.push({
			drawTime:    lineAnnotation.drawTime, id: 'annotation' + (this._annotations.length + 1),
			type:        lineAnnotation.type,
			mode:        lineAnnotation.orientation,
			scaleID:     scaleId,
			value:       lineAnnotation.value,
			borderColor: lineAnnotation.borderColor,
			endValue:    lineAnnotation.endValue,
			borderWidth: lineAnnotation.borderWidth,
			borderDash:  lineAnnotation.borderDash,
			label:       {
				backgroundColor: lineAnnotation.label.backgroundColor,
				position:        lineAnnotation.label.position,
				content:         lineAnnotation.label.text,
				fontColor:       lineAnnotation.label.fontColor,
				enabled:         true,
				fontStyle:       lineAnnotation.label.fontStyle
			}
		});
	}

	private getColorNumber(i: number): number {
		let colorNumber = i;
		if (colorNumber > (this.defaultColors.length - 1)) {
			colorNumber = 0;
		}
		return colorNumber;
	}

	private addBoxAnnotation(boxAnnotation: ChartBoxAnnotation, defaultBorderColor: any) {

		if (!boxAnnotation.borderColor) {
			boxAnnotation.borderColor = defaultBorderColor;
		}

		if (!boxAnnotation.borderWidth) {
			boxAnnotation.borderWidth = 2;
		}

		if (!boxAnnotation.backgroundColor) {
			boxAnnotation.backgroundColor = 'transparent';
		}

		this._annotations.push({
			drawTime:        boxAnnotation.drawTime,
			id:              'annotation' + (this._annotations.length + 1),
			type:            boxAnnotation.type,
			backgroundColor: boxAnnotation.backgroundColor,
			borderWidth:     boxAnnotation.borderWidth,
			borderColor:     boxAnnotation.borderColor,
			xMin:            boxAnnotation.xMin,
			xMax:            boxAnnotation.xMax,
			yMin:            boxAnnotation.yMin,
			yMax:            boxAnnotation.yMax,
			xScaleID:        'x-axis-0',
			yScaleID:        boxAnnotation.scaleId
		});

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
		this.addAnnotations();
		this.drawChart(cx);
		if (this.customLegend && this.data.filter(obj => obj.legendType != null).length === this.data.length) {
			this.buildCustomLegend();
		}
	}

	private legendClickCallback(event) {
		event = event || window.event;
		let target = event.target || event.srcElement;
		while (target.nodeName !== 'LI') {
			target = target.parentElement;
		}
		const parent = target.parentElement;
		const chartId = parseInt(parent.classList[0].split('-')[0], 10);
		const chart = Chart.instances[chartId];
		const index = Array.prototype.slice.call(parent.children)
			.indexOf(target);

		this.chart.data.datasets[index].hidden = !this.chart.data.datasets[index].hidden;
		if (chart) {
			if (chart.isDatasetVisible(index)) {
				target.classList.remove('hidden');
			} else {
				target.classList.add('hidden');
			}
			chart.update();
		}
	}
}
