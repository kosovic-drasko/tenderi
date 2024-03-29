import { NgModule } from '@angular/core';
import { SharedModule } from 'app/shared/shared.module';
import { ViewPonudeComponent } from './list/view-ponude.component';
import { ViewPonudeDetailComponent } from './detail/view-ponude-detail.component';
import { ViewPonudeDeleteDialogComponent } from './delete/view-ponude-delete-dialog.component';
import { ViewPonudeRoutingModule } from './route/view-ponude-routing.module';

@NgModule({
  imports: [SharedModule, ViewPonudeRoutingModule],
  declarations: [ViewPonudeComponent, ViewPonudeDetailComponent, ViewPonudeDeleteDialogComponent],
  exports: [ViewPonudeComponent],
})
export class ViewPonudeModule {}
