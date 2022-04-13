import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { Line, Zone } from 'src/app/@core/models/zone';

@Component({
	selector: 'app-camera-zone-info',
	templateUrl: './camera-zone-info.component.html',
	styleUrls: ['./camera-zone-info.component.scss']
})
export class CameraZoneInfoComponent implements OnInit {
	// form: FormGroup;

	name = ""
	list = []

	constructor(
		private dialogRef: MatDialogRef<CameraZoneInfoComponent>,
		private formBuilder: FormBuilder,
		@Inject(MAT_DIALOG_DATA) public data: { lines: any[], zones: any[], indx: number }
	) { }

	ngOnInit(): void {
		console.log(this.data)

		if (this.data) {
			if (this.data.lines) {
				if (this.data.indx != null) {
					this.name = this.data.lines[this.data.indx].name
				}

				console.log(this.name);

				['turn_left', 'turn_right', 'go_straight', 'u-turn'].forEach(element => {
					if (this.data.lines.findIndex(x => x.name == element) < 0 || this.name == element)
						this.list.push(element)
				})
			} else {
				if (this.data.indx != null) {
					this.name = this.data.zones[this.data.indx].name
				}
			}
		}
	}


	onSubmit() {
		this.dialogRef.close(this.name)
	}

}
