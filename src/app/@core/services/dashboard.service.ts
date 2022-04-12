import { environment } from 'src/environments/environment';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { SpinnerService } from './spinner.service';

@Injectable({
	providedIn: 'root'
})
export class DashboardService {

	constructor(
		private http: HttpClient,
		private spinnerService: SpinnerService,
	) { }

	async uploadVideo(skip: number, files: string[]) {
		try {
			this.spinnerService.showSpinner();

			const res = await lastValueFrom(
				this.http.post<any>(`${environment.api}/inference/start`, {
					frameskip: skip,
					video_locations: files
				})
			)
			console.log('[DashboardService] uploadVideo', res)

			this.spinnerService.hideSpinner();

			return res;
		} catch (error) {
			console.warn('![DashboardService] uploadVideo failed', error)

			this.spinnerService.hideSpinner();
			throw error
		}
	}
}
