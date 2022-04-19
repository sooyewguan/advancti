import { environment } from 'src/environments/environment';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom, map, Observer } from 'rxjs';
import { SpinnerService } from './spinner.service';
import { AnonymousSubject, Subject } from 'rxjs/internal/Subject';
import { Observable } from 'rxjs';

import { Socket } from 'ngx-socket-io';

export interface Message { }


@Injectable({
	providedIn: 'root'
})
export class WebsocketService {
	private subject: AnonymousSubject<MessageEvent>;
	public messages: Subject<Message>;

	constructor(
		private socket: Socket,
		private http: HttpClient,
		private spinnerService: SpinnerService,
	) {

		// this.messages = <Subject<Message>>this.connect(environment.ws).pipe(
		// 	map(
		// 		(response: MessageEvent): Message => {
		// 			console.log("[WebsocketService] message", response.data);
		// 			let data = JSON.parse(response.data)
		// 			return data;
		// 		}
		// 	)
		// );

		socket.on('connection', (data) => {
			console.log("[WebsocketService] on connection", data);
		});

		socket.on('dir_update_video', (data) => {
			console.log("[WebsocketService] on dir_update_video", data);
		});

		socket.on('dir_update_result', (data) => {
			console.log("[WebsocketService] on dir_update_result", data);
		});
	}

	sendMessage(topic: string, msg: string) {
		this.socket.emit(topic, msg);
	}

	// connect(url): AnonymousSubject<MessageEvent> {
	// 	if (!this.subject) {
	// 		this.subject = this.create(url);
	// 		console.log("[WebsocketService] Successfully connected: " + url);
	// 	}
	// 	return this.subject;
	// }

	// private create(url): AnonymousSubject<MessageEvent> {
	// 	let ws = new WebSocket(url);
	// 	let observable = new Observable((obs: Observer<MessageEvent>) => {
	// 		ws.onmessage = obs.next.bind(obs);
	// 		ws.onerror = obs.error.bind(obs);
	// 		ws.onclose = obs.complete.bind(obs);
	// 		return ws.close.bind(ws);
	// 	});
	// 	let observer = {
	// 		error: null,
	// 		complete: null,
	// 		next: (data: Object) => {
	// 			console.log("[WebsocketService] Message sent to websocket: ", data);
	// 			if (ws.readyState === WebSocket.OPEN) {
	// 				ws.send(JSON.stringify(data));
	// 			}
	// 		}
	// 	};
	// 	return new AnonymousSubject<MessageEvent>(observer, observable);
	// }

	// async uploadVideo(skip: number, files: string[]) {
	// 	try {
	// 		this.spinnerService.showSpinner();

	// 		const res = await lastValueFrom(
	// 			this.http.post<any>(`${environment.api}/inference/start`, {
	// 				frameskip: skip,
	// 				video_locations: files
	// 			})
	// 		)
	// 		console.log('[WebsocketService] uploadVideo', res)

	// 		this.spinnerService.hideSpinner();

	// 		return res;
	// 	} catch (error) {
	// 		console.warn('![WebsocketService] uploadVideo failed', error)

	// 		this.spinnerService.hideSpinner();
	// 		throw error
	// 	}
	// }
}
