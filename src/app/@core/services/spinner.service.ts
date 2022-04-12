import { Injectable } from '@angular/core';

import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { MatSpinner } from '@angular/material/progress-spinner';

@Injectable({
  providedIn: 'root'
})
export class SpinnerService {
  private spinnerRef: OverlayRef = this.cdkSpinnerCreate();
  private isRunning: boolean = false;

  constructor(private overlay: Overlay) { }

  private cdkSpinnerCreate() {
    return this.overlay.create({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    })
  }

  showSpinner() {
    if(!this.isRunning) {
      this.isRunning = true;
      this.spinnerRef.attach(new ComponentPortal(MatSpinner))
    }
  }

  hideSpinner() {
    this.isRunning = false;
    this.spinnerRef.detach();
  }
}
