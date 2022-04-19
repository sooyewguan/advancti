import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { LayoutModule } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'http://127.0.0.1', options: {} };

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		SocketIoModule.forRoot(config),
		AppRoutingModule,
		LayoutModule,
		OverlayModule,
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
	],
	bootstrap: [AppComponent]
})
export class AppModule { }
