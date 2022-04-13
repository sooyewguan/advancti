import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { WebsocketService } from 'src/app/@core/services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { CameraZoneInfoComponent } from './camera-zone-info/camera-zone-info.component';
import { MatSelectionListChange } from '@angular/material/list';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	@ViewChild('points', { static: false }) canvasRef: ElementRef;

	background = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

	directories = [];
	selectedVideo = [];

	ver = 0;
	zones = [];
	lanes = [];
	lines = [];

	mouseOverPoint = null;
	mouseOverLine = null;

	mouseOverPointDragStart = false;
	mouseOverLineDragStart = false;

	// canvasWidth = 845;
	// canvasHeight = 477;

	lineStyle = {
		globalAlpha: 1.0,
		lineWidth: 2,
		lineCap: 'round'
	}

	pointStyle = {
		globalAlpha: 1.0,
		lineWidth: 2,
		fillStyle: 'white',
	}

	arrowStyle = {
		globalAlpha: 0.5,
		lineWidth: 10,
		lineCap: 'round'
	}

	arcStyle = {
		globalAlpha: 0.3,
		lineWidth: 5,
		fillStyle: 'black',
	}

	zonesStyle = {
		globalAlpha: 0.2,
	}

	// var canvas = document.getElementById("ClearSight_canvas");
	// var ctx = canvas.getContext("2d");

	// var canvasOffset = $("#ClearSight_canvas").offset();
	// var offsetX = canvasOffset.left;
	// var offsetY = canvasOffset.top;

	width: number = 845;
	height: number = 477;

	canvas: any;
	ctx: CanvasRenderingContext2D;

	newLineId = 0

	constructor(
		public dialog: MatDialog,
		private sanitizer: DomSanitizer,
		private websocketService: WebsocketService,
	) {
		websocketService.messages.subscribe((msg: any) => {
			console.log("Response from websocket: ", msg);

			if (msg.type == 'directory') {
				this.directories = msg.children;
			}
		});
	}

	ngOnInit(): void { }

	ngAfterViewInit() {
		this.canvas = this.canvasRef.nativeElement;
		this.ctx = this.canvas.getContext('2d');

		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.refreshCanvas()
	}

	onFileSelected(event) {

		console.log(event.target.files)

		// const file: File = event.target.files[0];

		for (var i = 0; i < event.target.files.length; i++) {
			this.selectedVideo.push(URL.createObjectURL(event.target.files[i]));
		};
	}

	getSantizeUrl(url: string) {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	onMouseDown(e: MouseEvent) {
		if (this.mouseOverLine) {
			this.mouseOverLineDragStart = true

			this.mouseOverLine.zone.points = [
				...this.mouseOverLine.zone.points.slice(0, this.mouseOverLine.indx),
				{ x: e.offsetX, y: e.offsetY },
				...this.mouseOverLine.zone.points.slice(this.mouseOverLine.indx)
			]

			this.mouseOverPoint = {
				color: this.mouseOverLine.zone.color,
				point: this.mouseOverLine.zone.points[this.mouseOverLine.indx]
			}
			this.mouseOverPointDragStart = true
			this.mouseOverLine = null;

		} else {
			if (this.mouseOverPoint) this.mouseOverPointDragStart = true
		}

	}

	onMouseUp(e: MouseEvent) {
		this.mouseOverLineDragStart = false;
		this.mouseOverPointDragStart = false;
	}

	onMouseOut(e: MouseEvent) {
		this.mouseOverLineDragStart = false;
		this.mouseOverPointDragStart = false;
	}

	onMouseMove(e: MouseEvent) {
		if (this.mouseOverPointDragStart) {
			this.mouseOverPoint.point.x = e.offsetX;
			this.mouseOverPoint.point.y = e.offsetY;
			this.refreshCanvas();

		} else {
			let closestPoint = this.getClosestPoint(e.offsetX, e.offsetY)

			if (closestPoint) {
				this.mouseOverLine = null;

				this.mouseOverPoint = closestPoint;
				this.canvas.style.cursor = "move";
				this.refreshCanvas();
			} else {
				if (this.mouseOverPoint) {
					this.mouseOverPoint = null;
					this.canvas.style.cursor = "pointer";
					this.refreshCanvas();
				}

				let closestline = this.getClosestLine(e.offsetX, e.offsetY)

				if (closestline) {
					this.mouseOverLine = closestline;
					this.canvas.style.cursor = "crosshair";
					this.refreshCanvas();
				} else {
					if (this.mouseOverLine) {
						this.mouseOverLine = null;
						this.canvas.style.cursor = "pointer";
						this.refreshCanvas();
					}
				}
			}
		}
	}

	refreshCanvas() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.redrawZones(this.zones)
		this.redrawLanes(this.lanes)
		this.redrawLines(this.lines)

		if (this.mouseOverPoint) {
			this.ctx.strokeStyle = this.mouseOverPoint.color;
			this.ctx.beginPath();
			this.ctx.arc(this.mouseOverPoint.point.x, this.mouseOverPoint.point.y, 1.5, 0, 2 * Math.PI);
			this.ctx.stroke();
		}

		if (this.mouseOverLine) {
			this.ctx.strokeStyle = this.mouseOverLine.zone.color;
			this.ctx.lineWidth = 4;
			this.ctx.beginPath();
			this.ctx.moveTo(this.mouseOverLine.line.p1.x, this.mouseOverLine.line.p1.y);
			this.ctx.lineTo(this.mouseOverLine.line.p2.x, this.mouseOverLine.line.p2.y);
			this.ctx.stroke();
		}
	}

	get_polygon_centroid(pts) {
		let first = pts[0], last = pts[pts.length - 1];
		if (first.x != last.x || first.y != last.y) pts.push(first);
		let twicearea = 0,
			x = 0, y = 0,
			nPts = pts.length,
			p1, p2, f;
		for (let i = 0, j = nPts - 1; i < nPts; j = i++) {
			p1 = pts[i]; p2 = pts[j];
			f = p1.x * p2.y - p2.x * p1.y;
			twicearea += f;
			x += (p1.x + p2.x) * f;
			y += (p1.y + p2.y) * f;
		}
		f = twicearea * 3;
		return { x: x / f, y: y / f };
	}

	compute_mid_angle(angle_diff_lower, angle_diff_upper) {
		let CountAngleMid = angle_diff_lower <= angle_diff_upper ?
			(angle_diff_lower + angle_diff_upper) / 2 :
			(angle_diff_lower + angle_diff_upper + 360) / 2;
		return CountAngleMid * Math.PI / 180
	}

	redrawZones(zones) {
		zones.forEach(zone => {
			this.setCtxStyle(this.lineStyle);
			this.ctx.strokeStyle = zone.color;

			this.ctx.beginPath();
			this.ctx.moveTo(zone.points[0].x, zone.points[0].y);

			for (let i = 1; i < zone.points.length; i++)
				this.ctx.lineTo(zone.points[i].x, zone.points[i].y);

			this.ctx.lineTo(zone.points[0].x, zone.points[0].y);
			this.ctx.stroke();

			this.setCtxStyle(this.zonesStyle);
			this.ctx.fillStyle = zone.color;

			this.ctx.fill();

			this.redrawPoints(zone.points);

			this.ctx.fillStyle = zone.color;
			this.ctx.font = "15px Arial";
			this.ctx.fillText(zone.name, zone.points[0].x + 5, zone.points[0].y - 5)

		})
	}

	redrawLanes(lanes) {
		lanes.forEach(lane => {
			this.setCtxStyle(this.lineStyle);
			this.ctx.strokeStyle = lane.color;

			this.ctx.beginPath();
			this.ctx.moveTo(lane.points[0].x, lane.points[0].y);

			for (let i = 1; i < lane.points.length; i++)
				this.ctx.lineTo(lane.points[i].x, lane.points[i].y);

			this.ctx.lineTo(lane.points[0].x, lane.points[0].y);
			this.ctx.stroke();

			this.setCtxStyle(this.zonesStyle);
			this.ctx.fillStyle = lane.color;

			this.ctx.fill();

			if (lane.enable_angle_filter) {
				let mid = this.get_polygon_centroid(lane.points);
				let midangle = this.compute_mid_angle(lane.angle_diff_lower, lane.angle_diff_upper)

				let alpha = midangle

				let dx = Math.cos(alpha) * 50
				let dy = Math.sin(alpha) * 50

				let pdx = mid.x + dx
				let pdy = mid.y + dy

				this.setCtxStyle(this.arrowStyle);
				this.ctx.beginPath();

				dx = Math.cos(alpha) * 10
				dy = Math.sin(alpha) * 10

				this.ctx.moveTo(mid.x + dx, mid.y + dy);
				this.ctx.lineTo(pdx, pdy);

				alpha = (midangle + Math.PI * 0.25)
				dy = Math.sin(alpha) * 20;
				dx = Math.cos(alpha) * 20;


				this.ctx.moveTo(pdx - dx, pdy - dy);
				this.ctx.lineTo(pdx, pdy);

				alpha = (midangle - Math.PI * 0.25)
				dy = Math.sin(alpha) * 20;
				dx = Math.cos(alpha) * 20;

				this.ctx.lineTo(pdx - dx, pdy - dy);
				this.ctx.stroke();

				let radius = 15;
				let start_angle = lane.angle_diff_lower * Math.PI / 180
				let end_angle = lane.angle_diff_upper * Math.PI / 180

				alpha = midangle
				dy = Math.sin(alpha) * (radius + 5);
				dx = Math.cos(alpha) * (radius + 5);

				this.setCtxStyle(this.arcStyle);
				this.ctx.beginPath();
				this.ctx.arc(pdx + dx, pdy + dy, radius, start_angle, end_angle); //need to adjust angle range
				this.ctx.stroke();
				this.ctx.fill();
			}

			this.redrawPoints(lane.points);

			this.ctx.fillStyle = lane.color;
			this.ctx.font = "15px Arial";
			this.ctx.fillText(lane.name + ((lane.occupancy) ? (' : ' + lane.occupancy.toFixed(2)) : ''), lane.points[0].x + 5, lane.points[0].y - 5)

		})
	}

	redrawLines(lines) {
		lines.forEach(line => {
			this.setCtxStyle(this.lineStyle);
			this.ctx.strokeStyle = line.color;

			this.ctx.beginPath();
			this.ctx.moveTo(line.points[0].x, line.points[0].y);

			for (let i = 1; i < line.points.length; i++)
				this.ctx.lineTo(line.points[i].x, line.points[i].y);

			this.ctx.stroke();

			if (line.enable_angle_filter) {
				let mid = {
					x: (line.points[0].x + line.points[1].x) / 2,
					y: (line.points[0].y + line.points[1].y) / 2
				}

				let midangle = this.compute_mid_angle(line.angle_diff_lower, line.angle_diff_upper)

				const theta = Math.atan2((line.points[1].y - line.points[0].y), (line.points[1].x - line.points[0].x))

				let alpha = (midangle + theta)

				let dx = Math.cos(alpha) * 50
				let dy = Math.sin(alpha) * 50

				let pdx = mid.x + dx
				let pdy = mid.y + dy

				this.setCtxStyle(this.arrowStyle);
				this.ctx.beginPath();

				dx = Math.cos(alpha) * 10
				dy = Math.sin(alpha) * 10

				this.ctx.moveTo(mid.x + dx, mid.y + dy);
				this.ctx.lineTo(pdx, pdy);

				alpha = (midangle + Math.PI * 0.25 + theta)
				dy = Math.sin(alpha) * 20;
				dx = Math.cos(alpha) * 20;


				this.ctx.moveTo(pdx - dx, pdy - dy);
				this.ctx.lineTo(pdx, pdy);

				alpha = (midangle - Math.PI * 0.25 + theta)
				dy = Math.sin(alpha) * 20;
				dx = Math.cos(alpha) * 20;

				this.ctx.lineTo(pdx - dx, pdy - dy);
				this.ctx.stroke();

				let radius = 15;
				let start_angle = line.angle_diff_lower * Math.PI / 180 + theta
				let end_angle = line.angle_diff_upper * Math.PI / 180 + theta

				alpha = (midangle + theta)
				dy = Math.sin(alpha) * (radius + 5);
				dx = Math.cos(alpha) * (radius + 5);

				this.setCtxStyle(this.arcStyle);
				this.ctx.beginPath();
				this.ctx.arc(pdx + dx, pdy + dy, radius, start_angle, end_angle); //need to adjust angle range
				this.ctx.stroke();
				this.ctx.fill();
			}


			this.redrawPoints(line.points);

			this.ctx.fillStyle = line.color;
			this.ctx.font = "15px Arial";
			this.ctx.fillText(line.name, line.points[0].x + 5, line.points[0].y - 5)
		})
	}

	redrawPoints(points) {
		this.setCtxStyle(this.pointStyle);

		points.forEach((point, index) => {
			this.ctx.beginPath();
			this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
			this.ctx.stroke();
			this.ctx.fill();
		})
	}

	getClosestPoint(x, y) {
		let closestPoint = null;
		let minDist = 15;

		this.zones.forEach(zone => {
			zone.points.forEach(point => {
				const dist = Math.hypot(x - point.x, y - point.y);
				if (dist < minDist) {
					closestPoint = { color: zone.color, point: point };
					minDist = dist;
				}
			})
		});

		this.lanes.forEach(lane => {
			lane.points.forEach(point => {
				const dist = Math.hypot(x - point.x, y - point.y);
				if (dist < minDist) {
					closestPoint = { color: lane.color, point: point };
					minDist = dist;
				}
			})
		});

		this.lines.forEach(line => {
			line.points.forEach(point => {
				const dist = Math.hypot(x - point.x, y - point.y);
				if (dist < minDist) {
					closestPoint = { color: line.color, point: point };
					minDist = dist;
				}
			})
		});

		return closestPoint;
	}

	getClosestLine(x, y) {
		let closestLine = null;
		let minDist = 10;

		this.zones.forEach(zone => {
			for (let i = 0; i < zone.points.length; i++) {
				let j = 0;

				if (i < zone.points.length - 1) j = i + 1

				const dist = this.distanceLineFromPoint(zone.points[i], zone.points[j], { x, y })

				if (dist < minDist) {
					closestLine = {
						zone: zone,
						indx: i + 1,
						line: {
							p1: zone.points[i],
							p2: zone.points[j]
						}
					}
					minDist = dist;
				}
			}
		});

		this.lanes.forEach(zone => {
			for (let i = 0; i < zone.points.length; i++) {
				let j = 0;

				if (i < zone.points.length - 1) j = i + 1

				const dist = this.distanceLineFromPoint(zone.points[i], zone.points[j], { x, y })

				if (dist < minDist) {
					closestLine = {
						zone: zone,
						indx: i + 1,
						line: {
							p1: zone.points[i],
							p2: zone.points[j]
						}
					}
					minDist = dist;
				}
			}
		});

		return closestLine;
	}

	distanceLineFromPoint(p1, p2, mouse) {
		const lx = p1.x;
		const ly = p1.y;
		const v1x = p2.x - lx;
		const v1y = p2.y - ly;
		const v2x = mouse.x - lx;
		const v2y = mouse.y - ly;
		// get unit dist of closest point
		const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);

		if (u >= 0 && u <= 1) {  // is the point on the line
			return Math.hypot(lx + v1x * u - mouse.x, ly + v1y * u - mouse.y);
		} else if (u < 0) {  // point is before start
			return Math.hypot(lx - mouse.x, ly - mouse.y);
		}
		// point is after end of line
		return Math.hypot(p2.x - mouse.x, p2.y - mouse.y);
	}

	setCtxStyle(style) {
		Object.keys(style).forEach(key => {
			this.ctx[key] = style[key]
		});
	}

	addCameraZone() {
		const dialogRef = this.dialog.open(CameraZoneInfoComponent, {
			width: '512px',
			disableClose: false,
		});

		dialogRef.afterClosed().subscribe(res => {
			if (res) {
				const zone = {
					name: res, //'Zone ' + (this.zones.length + 1),
					color: 'orange',
					active: true,
					points: [
						{ x: 100, y: 50 },
						{ x: 100, y: 200 },
						{ x: 400, y: 200 },
						{ x: 400, y: 50 }
					]
				}

				this.zones.push(zone)
				this.refreshCanvas()
			}

		})
	}

	addCameraLane() {
		const dialogRef = this.dialog.open(CameraZoneInfoComponent, {
			width: '512px',
			disableClose: false,
		});

		dialogRef.afterClosed().subscribe(res => {
			if (res) {
				const loop = {
					name: res, //'Lane ' + (this.lanes.length + 1),
					color: 'yellow',
					active: true,
					points: [
						{ x: 50, y: 25 },
						{ x: 50, y: 100 },
						{ x: 200, y: 100 },
						{ x: 200, y: 25 }
					]
				}

				this.lanes.push(loop)
				this.refreshCanvas()
			}

		})
	}

	// addCameraLoop() {
	// 	const dialogRef = this.dialog.open(CameraZoneInfoComponent, {
	// 		width: '512px',
	// 		disableClose: false,
	// 	});

	// 	dialogRef.afterClosed().subscribe(res => {
	// 		if (res) {
	// 			const loop = {
	// 				name: res, //'Loop ' + (this.loops.length + 1),
	// 				color: 'purple',
	// 				active: true,
	// 				points: [
	// 					{ x: 50, y: 250 },
	// 					{ x: 50, y: 300 },
	// 					{ x: 200, y: 300 },
	// 					{ x: 200, y: 250 }
	// 				]
	// 			}

	// 			this.loops.push(loop)
	// 			this.refreshCanvas()
	// 		}

	// 	})
	// }

	addCameraLine() {
		const dialogRef = this.dialog.open(CameraZoneInfoComponent, {
			data: { lines: this.lines },
			width: '512px',
			disableClose: false,
		});

		dialogRef.afterClosed().subscribe(res => {
			if (res) {
				const line = {
					_id: this.lines.length ? this.lines[this.lines.length - 1]._id + 1 : 1,
					name: res, //'Line ' + (this.lines.length + 1),
					color: 'red',
					active: true,
					points: [
						{ x: 200, y: 320 },
						{ x: 400, y: 320 },
					]
				}

				this.newLineId = line._id
				this.lines.push(line)
				this.refreshCanvas()
			}

		})
	}

	onEditClicked() {
		// const dialogRef = this.dialog.open(CameraZoneInfoComponent, {
		// 	data: { zones: zones, lines: lines, indx: indx },
		// 	width: '512px',
		// 	disableClose: false,
		// });

		// dialogRef.afterClosed().subscribe(res => {
		// 	if (res) {
		// 		if(zones) zones[indx].name = res
		// 		if(lines) lines[indx].name = res
		// 	}
		// })
	}

	onDeleteClicked() {
	}

	onSaveClicked() {
		let data = {
			ver: 0,
			roi: this.zones.map(x => {
				return {
					name: x.name,
					type: parseInt(x.type),
					coordinate: x.points.map(p => {
						return { x: p.x / this.width, y: p.y / this.height }
					})
				}
			}),
			rod: [
				...this.lines.map(x => {
					return {
						id: x.id,
						name: x.name,
						type: 0,
						countpoint: parseInt(x.countpoint),
						vsens_delay_ms: 1000,
						vsens_timeout_ms: 300000,
						enable_angle_filter: x.enable_angle_filter,
						angle_diff_lower: x.angle_diff_lower,
						angle_diff_upper: x.angle_diff_upper,
						enable_sametrackid_filter: x.enable_sametrackid_filter,
						enable_local_storage: x.enable_local_storage,
						local_storage_day: x.local_storage_day,
						enable_trackdetail_newentry: x.enable_trackdetail_newentry,
						enable_trackdetail_newexit: x.enable_trackdetail_newexit,
						enable_trackdetail_frame: x.enable_trackdetail_frame,
						enable_trackdetail_vsens: x.enable_trackdetail_vsens,
						enable_trackdetail_vsenswaiting: x.enable_trackdetail_vsenswaiting,
						enable_trackdetail_vsenstimeout: x.enable_trackdetail_vsenstimeout,
						enable_trackdetail_vsenswaitingtimeout: x.enable_trackdetail_vsenswaitingtimeout,
						enable_license_crop: x.enable_license_crop,
						enable_violation_crop: x.enable_violation_crop,
						coordinate: x.points.map(p => {
							return { x: p.x / this.width, y: p.y / this.height }
						})
					}
				}),
				...this.lanes.map(x => {
					return {
						id: x.id,
						name: x.name,
						type: 1,
						countpoint: parseInt(x.countpoint),
						vsens_delay_ms: x.vsens_delay_ms,
						vsens_timeout_ms: x.vsens_timeout_ms,
						enable_angle_filter: x.enable_angle_filter,
						angle_diff_lower: x.angle_diff_lower,
						angle_diff_upper: x.angle_diff_upper,
						enable_sametrackid_filter: x.enable_sametrackid_filter,
						enable_local_storage: x.enable_local_storage,
						local_storage_day: x.local_storage_day,
						enable_trackdetail_newentry: x.enable_trackdetail_newentry,
						enable_trackdetail_newexit: x.enable_trackdetail_newexit,
						enable_trackdetail_frame: x.enable_trackdetail_frame,
						enable_trackdetail_vsens: x.enable_trackdetail_vsens,
						enable_trackdetail_vsenswaiting: x.enable_trackdetail_vsenswaiting,
						enable_trackdetail_vsenstimeout: x.enable_trackdetail_vsenstimeout,
						enable_trackdetail_vsenswaitingtimeout: x.enable_trackdetail_vsenswaitingtimeout,
						enable_license_crop: false,
						enable_violation_crop: false,
						coordinate: x.points.map(p => {
							return { x: p.x / this.width, y: p.y / this.height }
						})
					}
				}),
			],
		}
		console.log(data);

		let message = {
			"frameskip": 0,
			"video_infer": this.selectedVideo
		}
		this.websocketService.messages.next(message);
	}

}
