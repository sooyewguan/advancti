import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { DashboardService } from 'src/app/@core/services/dashboard.service';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	selectedVideo = [];

	constructor(
		private sanitizer: DomSanitizer,
		private dashboardService: DashboardService
	) { }

	ngOnInit(): void { }

	onFileSelected(event) {

		console.log(event.target.files.length)

		// const file: File = event.target.files[0];
		const URL = window.URL || window.webkitURL

		for (var i = 0; i < event.target.files.length; i++) {
			this.selectedVideo.push(URL.createObjectURL(event.target.files[i]));
		};
	}

	getSantizeUrl(url: string) {
		return this.sanitizer.bypassSecurityTrustUrl(url);
	}

	async onProcessClicked() {
		await this.dashboardService.uploadVideo(1, this.selectedVideo)
	}
}
