import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { LayoutModule } from '@angular/cdk/layout';
import { OverlayModule } from '@angular/cdk/overlay';

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
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
