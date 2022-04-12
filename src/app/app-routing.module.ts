import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
	{
		path: '',
		loadChildren: () => import('./public/public.module').then(m => m.PublicModule)
	}, 
	{
		path: '**',
		redirectTo: ''
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' })],
	exports: [RouterModule]
})

export class AppRoutingModule { }
